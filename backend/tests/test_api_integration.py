import pytest
import base64

@pytest.fixture
def mock_png_bytes():
    return base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")

class TestAuthEndpoints:
    def test_signup_success(self, client, mock_png_bytes):
        files = {"grading_scale_image": ("scale.png", mock_png_bytes, "image/png")}
        data = {
            "email": "newstudent@test.com",
            "password": "password123",
            "full_name": "New Student",
            "current_semester": "1"
        }
        response = client.post("/api/auth/signup", data=data, files=files)
        assert response.status_code == 201
        res_data = response.json()
        assert res_data["email"] == "newstudent@test.com"
        assert res_data["role"] == "student"
        assert "id" in res_data

    def test_signup_duplicate_email(self, client, mock_png_bytes):
        files = {"grading_scale_image": ("scale.png", mock_png_bytes, "image/png")}
        data = {
            "email": "dupuser@test.com",
            "password": "password123",
            "full_name": "Dup Student",
            "current_semester": "1"
        }
        client.post("/api/auth/signup", data=data, files=files)
        
        # Try again with same email
        response = client.post("/api/auth/signup", data=data, files=files)
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    def test_login_success(self, client, mock_png_bytes):
        files = {"grading_scale_image": ("scale.png", mock_png_bytes, "image/png")}
        data = {
            "email": "loginuser@test.com",
            "password": "secure123",
            "full_name": "Login Student",
            "current_semester": "1"
        }
        client.post("/api/auth/signup", data=data, files=files)
        
        login_data = {
            "username": "loginuser@test.com",
            "password": "secure123"
        }
        response = client.post("/api/auth/login", data=login_data)
        assert response.status_code == 200
        assert "access_token" in response.json()
        assert response.json()["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        login_data = {
            "username": "loginuser@test.com",
            "password": "wrongpassword"
        }
        response = client.post("/api/auth/login", data=login_data)
        assert response.status_code == 400


class TestUserEndpoints:
    def test_get_me(self, client, auth_headers):
        response = client.get("/api/users/me", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["email"] == "testuser@example.com"
        assert response.json()["role"] == "student"

    def test_increment_semester(self, client, auth_headers):
        response = client.patch("/api/users/me/semester", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["current_semester"] == 2


class TestMarksEndpoints:
    def test_create_mark_denied_to_student(self, client, auth_headers):
        response = client.post("/api/marks", json={
            "course_name": "CS101",
            "score": 95.0,
            "max_score": 100.0,
            "semester": "Fall 2024",
            "credit_hours": 3.0
        }, headers=auth_headers)
        # Students should be denied (only teacher/admin can create marks)
        assert response.status_code == 403


class TestOcrEndpoint:
    def test_ocr_rejects_non_image(self, client, auth_headers):
        response = client.post(
            "/api/ocr/extract",
            files={"file": ("test.txt", b"not an image", "text/plain")},
            headers=auth_headers
        )
        assert response.status_code == 422

    def test_ocr_returns_mock_on_valid_image(self, client, auth_headers, mock_png_bytes):
        response = client.post(
            "/api/ocr/extract",
            files={"file": ("test.png", mock_png_bytes, "image/png")},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "source" in data
        assert "marks" in data
