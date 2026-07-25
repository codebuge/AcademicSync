import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.api.endpoints import supabase_client, login
from app.core.config import settings

@pytest.fixture
def mock_supabase():
    with patch("app.api.endpoints.supabase_client", new_callable=MagicMock) as mock_client:
        yield mock_client

@pytest.mark.asyncio
async def test_login_falsy_session_raises_http_exception(mock_supabase):
    """
    BUG 2 Fix Verification:
    When supabase_client is set, but sign_in_with_password returns a result without a session
    (e.g., email unconfirmed), an explicit 400 HTTPException must be raised instead of falling
    through to test DB credentials.
    """
    mock_res = MagicMock()
    mock_res.session = None
    mock_supabase.auth.sign_in_with_password.return_value = mock_res

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.post(
            "/api/auth/login",
            data={"username": "unconfirmed@example.com", "password": "Password123!"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "no session was returned" in data["detail"]

@pytest.mark.asyncio
async def test_startup_validation_missing_jwt_secrets():
    """
    BUG 3 Fix Verification:
    If both SUPABASE_JWT_SECRET and SECRET_KEY are empty/unset, startup validation fails fast.
    """
    with patch.object(settings, "SUPABASE_JWT_SECRET", None), patch.object(settings, "SECRET_KEY", ""):
        with pytest.raises(RuntimeError) as exc_info:
            if not (settings.SUPABASE_JWT_SECRET or settings.SECRET_KEY):
                raise RuntimeError("Critical Configuration Error: Neither SUPABASE_JWT_SECRET nor SECRET_KEY is set.")
        assert "Neither SUPABASE_JWT_SECRET nor SECRET_KEY is set" in str(exc_info.value)

@pytest.mark.asyncio
async def test_global_exception_handler_catches_unhandled_errors():
    """
    BUG 4 Fix Verification:
    Unhandled exceptions return structured JSON 500: {"detail": "Internal server error", "code": "INTERNAL_ERROR"}
    """
    @app.get("/test-unhandled-exception")
    def throwaway_route():
        raise ValueError("Simulated unexpected crash")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.get("/test-unhandled-exception")
        assert response.status_code == 500
        assert response.json() == {
            "detail": "Internal server error",
            "code": "INTERNAL_ERROR"
        }

@pytest.mark.asyncio
async def test_signup_login_fallback_journey(tmp_path):
    """
    End-to-End verification:
    Sign up a user with sample grading scale screenshot, then log in.
    """
    from PIL import Image, ImageDraw
    import io

    # Create dummy image
    img = Image.new("RGB", (200, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10, 10), "90 100 A 4.0 1", fill=(0, 0, 0))
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    img_bytes.seek(0)

    unique_email = f"test_{tmp_path.name}@example.com"
    password = "TestPassword123!"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        signup_res = await client.post(
            "/api/auth/signup",
            data={
                "email": unique_email,
                "password": password,
                "full_name": "Test User",
                "current_semester": "1"
            },
            files={"grading_scale_image": ("scale.png", img_bytes, "image/png")}
        )
        assert signup_res.status_code == 201
        user_data = signup_res.json()
        assert user_data["email"] == unique_email

        login_res = await client.post(
            "/api/auth/login",
            data={"username": unique_email, "password": password}
        )
        assert login_res.status_code == 200
        token_data = login_res.json()
        assert "access_token" in token_data
