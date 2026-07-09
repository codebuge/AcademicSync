import pytest
from unittest.mock import patch

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import Base, engine

Base.metadata.create_all(bind=engine)

@pytest.fixture(scope="module")
def client():
    # ponytail: sync TestClient, no async event loop fights
    with TestClient(app) as c:
        yield c

def test_public_gpa_calculator_happy_path(client):
    # 3 courses with different credit hours and scores
    payload = {
        "courses": [
            {"course_name": "CS101", "credit_hours": 3.0, "score": 95.0},  # Grade A, GP 4.0, weighted points = 12.0
            {"course_name": "MA101", "credit_hours": 4.0, "score": 85.0},  # Grade B, GP 3.0, weighted points = 12.0
            {"course_name": "EE101", "credit_hours": 2.0, "score": 75.0}   # Grade C, GP 2.0, weighted points = 4.0
        ],
        "grading_scale": "4.0"
    }
    # Total credits = 3.0 + 4.0 + 2.0 = 9.0
    # Total weighted points = 12.0 + 12.0 + 4.0 = 28.0
    # GPA = 28.0 / 9.0 = 3.1111... -> round to 3.11
    
    response = client.post("/api/public/gpa-calculator", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["gpa"] == 3.11
    assert data["total_credit_hours"] == 9.0
    assert len(data["course_breakdown"]) == 3
    
    # Verify breakdown
    breakdown = {c["course_name"]: c for c in data["course_breakdown"]}
    assert breakdown["CS101"]["letter_grade"] == "A"
    assert breakdown["CS101"]["grade_points"] == 4.0
    assert breakdown["MA101"]["letter_grade"] == "B"
    assert breakdown["MA101"]["grade_points"] == 3.0
    assert breakdown["EE101"]["letter_grade"] == "C"
    assert breakdown["EE101"]["grade_points"] == 2.0

def test_public_gpa_calculator_empty_courses(client):
    payload = {
        "courses": [],
        "grading_scale": "4.0"
    }
    response = client.post("/api/public/gpa-calculator", json=payload)
    assert response.status_code == 422

def test_public_gpa_calculator_too_many_courses(client):
    payload = {
        "courses": [{"course_name": f"CS{i}", "credit_hours": 3.0, "score": 90.0} for i in range(21)],
        "grading_scale": "4.0"
    }
    response = client.post("/api/public/gpa-calculator", json=payload)
    assert response.status_code == 422

def test_public_gpa_calculator_invalid_score(client):
    payload = {
        "courses": [
            {"course_name": "CS101", "credit_hours": 3.0, "score": 105.0}
        ],
        "grading_scale": "4.0"
    }
    response = client.post("/api/public/gpa-calculator", json=payload)
    assert response.status_code == 422

def test_public_gpa_calculator_invalid_credit_hours(client):
    payload = {
        "courses": [
            {"course_name": "CS101", "credit_hours": 0.0, "score": 90.0}
        ],
        "grading_scale": "4.0"
    }
    response = client.post("/api/public/gpa-calculator", json=payload)
    assert response.status_code == 422

def test_public_gpa_calculator_no_auth_required(client):
    payload = {
        "courses": [
            {"course_name": "CS101", "credit_hours": 3.0, "score": 95.0}
        ],
        "grading_scale": "4.0"
    }
    # Call without any headers (like Authorization)
    response = client.post("/api/public/gpa-calculator", json=payload)
    assert response.status_code == 200

def test_public_gpa_calculator_rate_limit(client):
    # Mock rate limiter to return 3600 retry after to test rate limiting
    payload = {
        "courses": [
            {"course_name": "CS101", "credit_hours": 3.0, "score": 95.0}
        ]
    }
    with patch("app.api.endpoints.check_public_rate_limit", return_value=120):
        response = client.post("/api/public/gpa-calculator", json=payload)
        assert response.status_code == 429
        assert response.headers.get("Retry-After") == "120"
        assert "Rate limit exceeded" in response.json()["detail"]

def test_public_gpa_calculator_grading_scales(client):
    # 5.0 scale
    payload_5 = {
        "courses": [
            {"course_name": "CS101", "credit_hours": 3.0, "score": 95.0} # GP 4.0 * 1.25 = 5.0
        ],
        "grading_scale": "5.0"
    }
    response = client.post("/api/public/gpa-calculator", json=payload_5)
    assert response.status_code == 200
    assert response.json()["gpa"] == 5.0
    assert response.json()["course_breakdown"][0]["grade_points"] == 5.0

    # Percentage scale
    payload_pct = {
        "courses": [
            {"course_name": "CS101", "credit_hours": 3.0, "score": 88.0} # GP = 88.0
        ],
        "grading_scale": "percentage"
    }
    response = client.post("/api/public/gpa-calculator", json=payload_pct)
    assert response.status_code == 200
    assert response.json()["gpa"] == 88.0
    assert response.json()["course_breakdown"][0]["grade_points"] == 88.0
