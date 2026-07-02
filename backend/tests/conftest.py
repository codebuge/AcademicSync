import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os
import base64

# Configure DATABASE_URL for tests
TEST_DB_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")
os.environ["DATABASE_URL"] = TEST_DB_URL
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest-only"
os.environ["SUPABASE_JWT_SECRET"] = "test-secret-key-for-pytest-only"

from app.main import app
from app.db.session import Base, get_db
from app.db.models import User, Mark, Transcript, GradingScaleRow

# Setup SQLite StaticPool or standard pool for Postgres
if TEST_DB_URL.startswith("sqlite"):
    engine = create_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(TEST_DB_URL)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Dependency override: use isolated DB for every test."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables once per test session, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Provide a clean DB session per test function with rollback isolation."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="module")
def client():
    """Provide a TestClient with the DB dependency overridden."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="module")
def auth_headers(client):
    """Register a test user using form-data + mock grading scale and return auth headers."""
    # 1x1 png for mock image upload
    png_bytes = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")
    
    files = {"grading_scale_image": ("scale.png", png_bytes, "image/png")}
    data = {
        "email": "testuser@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
        "current_semester": "1"
    }
    # Sign up
    client.post("/api/auth/signup", data=data, files=files)
    
    # Login
    login_data = {
        "username": "testuser@example.com",
        "password": "testpassword123"
    }
    response = client.post("/api/auth/login", data=login_data)
    token = response.json().get("access_token", "")
    return {"Authorization": f"Bearer {token}"}
