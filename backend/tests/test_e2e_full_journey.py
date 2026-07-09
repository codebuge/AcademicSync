import pytest
import os
import uuid
import time
import httpx
from jose import jwt
from app.db.session import TestingSessionLocal
from app.db.models import User, Mark, Transcript, GradingScaleRow, GpaHistory
from app.services.ocr import memory_rates

# Use ordering to run tests in sequential order
pytestmark = pytest.mark.ordering

@pytest.mark.run(order=1)
class TestPhase0ServerHealth:
    async def test_health_check(self, client):
        response = await client.get("/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.json() == {"status": "ok"}, f"Expected {{'status': 'ok'}}, got {response.json()}"
        
        # Fail fast if health check fails
        if response.status_code != 200 or response.json().get("status") != "ok":
            pytest.exit("Aborting test suite: Health check failed")

    async def test_docs_reachable(self, client):
        response = await client.get("/docs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    async def test_invalid_route_returns_404(self, client):
        response = await client.get("/nonexistent_route_xyz")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


@pytest.mark.run(order=2)
class TestPhase1Authentication:
    async def test_student_signup_happy_path(self, client, ctx):
        ctx.student_email = f"test_student_{uuid.uuid4().hex[:8]}@academicsync.test"
        ctx.student_password = "TestPass@123"

        # Read fixture image
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_grades.png")
        with open(fixture_path, "rb") as f:
            img_bytes = f.read()

        files = {"grading_scale_image": ("sample_grades.png", img_bytes, "image/png")}
        data = {
            "email": ctx.student_email,
            "password": ctx.student_password,
            "full_name": "Test Student",
            "current_semester": "1"
        }

        response = await client.post("/api/auth/signup", data=data, files=files)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}. Details: {response.text}"
        
        res_data = response.json()
        assert res_data["email"] == ctx.student_email, f"Expected email {ctx.student_email}, got {res_data['email']}"
        assert res_data["role"] == "student", f"Expected role 'student', got {res_data['role']}"
        assert res_data["current_semester"] == 1, f"Expected semester 1, got {res_data['current_semester']}"
        
        ctx.student_id = res_data["id"]

    async def test_duplicate_signup_rejected(self, client, ctx):
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_grades.png")
        with open(fixture_path, "rb") as f:
            img_bytes = f.read()

        files = {"grading_scale_image": ("sample_grades.png", img_bytes, "image/png")}
        data = {
            "email": ctx.student_email,
            "password": ctx.student_password,
            "full_name": "Test Student Duplicate",
            "current_semester": "1"
        }

        response = await client.post("/api/auth/signup", data=data, files=files)
        assert response.status_code == 409, f"Expected 409, got {response.status_code}. Response: {response.text}"
        assert "already exists" in response.json()["detail"].lower(), f"Expected duplicate error message, got: {response.json()}"

    async def test_signup_invalid_email(self, client):
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_grades.png")
        with open(fixture_path, "rb") as f:
            img_bytes = f.read()

        files = {"grading_scale_image": ("sample_grades.png", img_bytes, "image/png")}
        data = {
            "email": "not-an-email",
            "password": "TestPass@123",
            "full_name": "Test Invalid",
            "current_semester": "1"
        }

        response = await client.post("/api/auth/signup", data=data, files=files)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"

    async def test_signup_weak_password(self, client):
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_grades.png")
        with open(fixture_path, "rb") as f:
            img_bytes = f.read()

        files = {"grading_scale_image": ("sample_grades.png", img_bytes, "image/png")}
        data = {
            "email": "valid@test.com",
            "password": "123",
            "full_name": "Test Weak",
            "current_semester": "1"
        }

        response = await client.post("/api/auth/signup", data=data, files=files)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"

    async def test_student_b_signup(self, client, ctx):
        ctx.student_b_email = f"test_student_b_{uuid.uuid4().hex[:8]}@academicsync.test"
        ctx.student_b_password = "TestPass@123"

        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_grades.png")
        with open(fixture_path, "rb") as f:
            img_bytes = f.read()

        files = {"grading_scale_image": ("sample_grades.png", img_bytes, "image/png")}
        data = {
            "email": ctx.student_b_email,
            "password": ctx.student_b_password,
            "full_name": "Student B",
            "current_semester": "1"
        }

        response = await client.post("/api/auth/signup", data=data, files=files)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        ctx.student_b_id = response.json()["id"]

    async def test_student_login_happy_path(self, client, ctx):
        login_data = {
            "username": ctx.student_email,
            "password": ctx.student_password
        }
        response = await client.post("/api/auth/login", data=login_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        res_json = response.json()
        assert "access_token" in res_json, f"Missing access_token in response: {res_json}"
        assert res_json["token_type"] == "bearer", f"Expected token type bearer, got {res_json['token_type']}"
        
        ctx.student_token = res_json["access_token"]
        
        if not ctx.student_token:
            pytest.exit("Aborting: Login failed, student_token is empty")

    async def test_student_b_login(self, client, ctx):
        login_data = {
            "username": ctx.student_b_email,
            "password": ctx.student_b_password
        }
        response = await client.post("/api/auth/login", data=login_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        ctx.student_b_token = response.json()["access_token"]

    async def test_login_wrong_password(self, client, ctx):
        login_data = {
            "username": ctx.student_email,
            "password": "WrongPass@999"
        }
        response = await client.post("/api/auth/login", data=login_data)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    async def test_login_unregistered_email(self, client):
        login_data = {
            "username": "ghost@nobody.com",
            "password": "TestPass@123"
        }
        response = await client.post("/api/auth/login", data=login_data)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    async def test_request_without_token_rejected(self, client):
        response = await client.get("/api/users/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    async def test_request_with_malformed_token_rejected(self, client):
        headers = {"Authorization": "Bearer this.is.not.a.real.jwt"}
        response = await client.get("/api/users/me", headers=headers)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    async def test_request_with_expired_token_rejected(self, client, ctx):
        # Generate expired JWT
        jwt_secret = "test-secret-key-for-pytest-only"
        payload = {
            "sub": ctx.student_id,
            "email": ctx.student_email,
            "role": "student",
            "exp": int(time.time()) - 3600
        }
        expired_token = jwt.encode(payload, jwt_secret, algorithm="HS256")
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = await client.get("/api/users/me", headers=headers)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


@pytest.mark.run(order=3)
class TestPhase2UserProfile:
    async def test_get_own_profile(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.get("/api/users/me", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["id"] == ctx.student_id
        assert data["email"] == ctx.student_email
        assert data["role"] == "student"

    async def test_increment_semester(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        # No body payload should increment by 1
        response = await client.patch("/api/users/me/semester", json=None, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.json()["current_semester"] == 2, f"Expected semester 2, got {response.json()['current_semester']}"

        # Double check via GET me
        me_res = await client.get("/api/users/me", headers=headers)
        assert me_res.json()["current_semester"] == 2

    async def test_set_semester_invalid_under_1(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.patch("/api/users/me/semester", json={"current_semester": 0}, headers=headers)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"

    async def test_set_semester_invalid_over_12(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.patch("/api/users/me/semester", json={"current_semester": 13}, headers=headers)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"


@pytest.mark.run(order=4)
class TestPhase3SemesterGuard:
    async def test_reset_to_semester_1(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.patch("/api/users/me/semester", json={"current_semester": 1}, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.json()["current_semester"] == 1

    async def test_semester_1_blocks_transcript_upload(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_transcript.pdf")
        with open(fixture_path, "rb") as f:
            pdf_bytes = f.read()

        files = {"file": ("sample_transcript.pdf", pdf_bytes, "application/pdf")}
        data = {"semester": "Semester 1"}
        
        response = await client.post("/api/transcripts", files=files, data=data, headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        
        res_json = response.json()
        assert res_json["code"] == "SEMESTER_GUARD_BLOCKED", f"Expected SEMESTER_GUARD_BLOCKED, got {res_json}"
        assert "semester 2" in res_json["detail"].lower(), f"Expected detail containing Semester 2, got {res_json['detail']}"

    async def test_semester_1_allows_marks_viewing(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.get("/api/marks", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    async def test_advance_to_semester_2_unlocks_transcript(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        # Advance semester
        sem_res = await client.patch("/api/users/me/semester", json={"current_semester": 2}, headers=headers)
        assert sem_res.status_code == 200
        
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_transcript.pdf")
        with open(fixture_path, "rb") as f:
            pdf_bytes = f.read()

        files = {"file": ("sample_transcript.pdf", pdf_bytes, "application/pdf")}
        data = {"semester": "Semester 1"}
        
        response = await client.post("/api/transcripts", files=files, data=data, headers=headers)
        assert response.status_code in (200, 201), f"Expected 200/201, got {response.status_code}"


@pytest.mark.run(order=5)
class TestPhase4Marks:
    async def test_student_inserts_own_mark(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        data = {
            "course_name": "Data Structures",
            "credit_hours": 3,
            "score": 88.0,
            "semester": "Semester 1"
        }
        response = await client.post("/api/marks", json=data, headers=headers)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        
        res_data = response.json()
        assert "id" in res_data
        assert res_data["student_id"] == ctx.student_id
        assert res_data["status"] == "draft"
        assert res_data["source"] == "manual"
        assert res_data["letter_grade"] == "B+", f"Expected B+, got {res_data['letter_grade']}"
        
        ctx.mark_ids.append(res_data["id"])

    async def test_student_posts_spoofed_student_id(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        data = {
            "student_id": "spoofed-user-id-xyz",
            "course_name": "Spoofed Course",
            "credit_hours": 3,
            "score": 90.0,
            "semester": "Semester 1"
        }
        response = await client.post("/api/marks", json=data, headers=headers)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        # Assert student_id is set to student's real ID, ignoring body
        assert response.json()["student_id"] == ctx.student_id

    async def test_insert_multiple_marks(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        courses = [
            ("Algorithms", 3, 92.0),
            ("Operating Systems", 3, 75.0),
            ("Calculus", 2, 65.0),
            ("English", 1, 95.0)
        ]
        for name, credits, score in courses:
            data = {
                "course_name": name,
                "credit_hours": credits,
                "score": score,
                "semester": "Semester 1"
            }
            response = await client.post("/api/marks", json=data, headers=headers)
            assert response.status_code == 201
            ctx.mark_ids.append(response.json()["id"])

    async def test_student_reads_own_marks(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.get("/api/marks?semester=Semester 1", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        res_data = response.json()
        # Should contain Data Structures + Spoofed Course + 4 extra courses = 6 marks
        assert len(res_data) == 6, f"Expected 6 marks, got {len(res_data)}"
        for mark in res_data:
            assert mark["student_id"] == ctx.student_id

    async def test_mark_validation_score_too_high(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        data = {
            "course_name": "Invalid Score",
            "credit_hours": 3,
            "score": 101.0,
            "semester": "Semester 1"
        }
        response = await client.post("/api/marks", json=data, headers=headers)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"

    async def test_mark_validation_negative_credits(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        data = {
            "course_name": "Invalid Credits",
            "credit_hours": -1,
            "score": 90.0,
            "semester": "Semester 1"
        }
        response = await client.post("/api/marks", json=data, headers=headers)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"

    async def test_mark_validation_empty_course_name(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        data = {
            "course_name": "",
            "credit_hours": 3,
            "score": 90.0,
            "semester": "Semester 1"
        }
        response = await client.post("/api/marks", json=data, headers=headers)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"

    async def test_student_updates_own_mark(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        mark_id = ctx.mark_ids[0]
        data = {"score": 91.0}
        response = await client.patch(f"/api/marks/{mark_id}", json=data, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.json()["score"] == 91.0
        assert response.json()["letter_grade"] == "A-"

    async def test_student_cannot_promote_status_to_verified(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        mark_id = ctx.mark_ids[0]
        data = {"status": "verified"}
        response = await client.patch(f"/api/marks/{mark_id}", json=data, headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"

    async def test_student_cannot_promote_status_to_locked(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        mark_id = ctx.mark_ids[0]
        data = {"status": "locked"}
        response = await client.patch(f"/api/marks/{mark_id}", json=data, headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"

    async def test_delete_draft_mark(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        # First, create throwaway mark
        data = {
            "course_name": "Throwaway CS",
            "credit_hours": 3,
            "score": 85.0,
            "semester": "Semester 1"
        }
        throw_res = await client.post("/api/marks", json=data, headers=headers)
        throw_id = throw_res.json()["id"]

        # Delete it
        del_res = await client.delete(f"/api/marks/{throw_id}", headers=headers)
        assert del_res.status_code == 204, f"Expected 204, got {del_res.status_code}"

    async def test_student_cannot_update_verified_mark(self, client, ctx):
        # Directly promote mark to verified in DB
        db = TestingSessionLocal()
        mark_id = ctx.mark_ids[0]
        m = db.query(Mark).filter(Mark.id == mark_id).first()
        m.status = "verified"
        db.commit()
        db.close()

        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.patch(f"/api/marks/{mark_id}", json={"score": 99.0}, headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"

    async def test_student_cannot_delete_verified_mark(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        mark_id = ctx.mark_ids[0]
        response = await client.delete(f"/api/marks/{mark_id}", headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"


@pytest.mark.run(order=6)
class TestPhase5GpaCalculation:
    async def test_verify_all_marks(self, ctx):
        # Promote all marks in context to verified in database
        db = TestingSessionLocal()
        # Also let's delete the "Spoofed Course" mark or keep it?
        # Wait, the calculation in TEST 5.2 expects:
        # DS (3cr, 91 -> 3.7) + Algo (3cr, 92 -> 3.7) + OS (3cr, 75 -> 2.0) + Calc (2cr, 65 -> 1.0) + Eng (1cr, 95 -> 4.0)
        # That was 5 courses. The Spoofed Course is a draft, let's delete it or leave it unverified.
        # Let's delete the Spoofed Course so it doesn't mess with CGPA if promoted.
        # Actually, let's find the 5 specific course marks we need and verify them.
        for mid in ctx.mark_ids:
            m = db.query(Mark).filter(Mark.id == mid).first()
            if m.course_name in ("Data Structures", "Algorithms", "Operating Systems", "Calculus", "English"):
                m.status = "verified"
            else:
                db.delete(m) # Delete Spoofed Course to align with 5 courses math
        db.commit()
        db.close()

    async def test_semester_gpa_calculated_correctly(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.get("/api/gpa?semester=Semester 1", headers=headers)
        assert response.status_code == 200
        
        gpa = response.json()["gpa"]
        # Expected: DS(3cr, 3.7) + Algo(3cr, 3.7) + OS(3cr, 2.0) + Calc(2cr, 1.0) + Eng(1cr, 4.0)
        # (11.1 + 11.1 + 6.0 + 2.0 + 4.0) / 12 = 34.2 / 12 = 2.85
        assert abs(gpa - 2.85) < 0.01, f"Expected GPA ~2.85, got {gpa}"

    async def test_gpa_excludes_draft_marks(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        # Insert a draft mark
        data = {
            "course_name": "Draft Course",
            "credit_hours": 3,
            "score": 100.0,
            "semester": "Semester 1"
        }
        await client.post("/api/marks", json=data, headers=headers)

        response = await client.get("/api/gpa?semester=Semester 1", headers=headers)
        assert response.status_code == 200
        # GPA should remain 2.85 (draft course excluded)
        assert abs(response.json()["gpa"] - 2.85) < 0.01

    async def test_cgpa_matches_semester_gpa_when_only_one_semester(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.get("/api/cgpa", headers=headers)
        assert response.status_code == 200
        assert abs(response.json()["cgpa"] - 2.85) < 0.01

    async def test_cgpa_updates_correctly_after_semester_2_marks(self, client, ctx):
        # Insert Semester 2 verified marks directly
        db = TestingSessionLocal()
        courses = [
            ("ML Fundamentals", 3.0, 94.0), # A (4.0)
            ("Web Dev", 3.0, 82.0),          # B- (2.7)
            ("Statistics", 3.0, 78.0)        # C+ (2.3)
        ]
        for name, credits, score in courses:
            # Get grade mapping
            m = Mark(
                student_id=ctx.student_id,
                course_name=name,
                credit_hours=credits,
                score=score,
                semester="Semester 2",
                letter_grade="A" if score == 94.0 else ("B-" if score == 82.0 else "C+"),
                status="verified",
                source="manual"
            )
            db.add(m)
        db.commit()
        db.close()

        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.get("/api/cgpa", headers=headers)
        assert response.status_code == 200
        
        cgpa = response.json()["cgpa"]
        # Expected points: Sem 1 = 34.2 (12cr)
        # Sem 2 = (4.0 * 3) + (2.7 * 3) + (2.3 * 3) = 12.0 + 8.1 + 6.9 = 27.0 (9cr)
        # Total CGPA: (34.2 + 27.0) / 21 = 61.2 / 21 = 2.914
        assert abs(cgpa - 2.91) < 0.02, f"Expected CGPA ~2.91, got {cgpa}"

    async def test_gpa_history_snapshots(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.get("/api/gpa_history", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        history = response.json()
        assert len(history) == 2, f"Expected 2 entries, got {len(history)}"
        assert history[0]["semester"] == "Semester 1"
        assert abs(history[0]["gpa"] - 2.85) < 0.02
        assert abs(history[0]["cgpa_at_time"] - 2.85) < 0.02
        
        assert history[1]["semester"] == "Semester 2"
        assert abs(history[1]["gpa"] - 3.00) < 0.02
        assert abs(history[1]["cgpa_at_time"] - 2.91) < 0.02

    async def test_no_verified_marks_returns_zero_gpa(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.get("/api/gpa?semester=Semester 99", headers=headers)
        assert response.status_code == 200
        assert response.json()["gpa"] == 0.0


@pytest.mark.run(order=7)
class TestPhase6OcrEndpoint:
    async def test_ocr_extract_happy_path(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_grades.png")
        with open(fixture_path, "rb") as f:
            img_bytes = f.read()

        files = {"file": ("sample_grades.png", img_bytes, "image/png")}
        response = await client.post("/api/ocr/extract", files=files, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        res_data = response.json()
        assert "marks" in res_data
        assert res_data["flagged"] is False

    async def test_ocr_extract_low_confidence(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "blurry_grades.png")
        with open(fixture_path, "rb") as f:
            img_bytes = f.read()

        files = {"file": ("blurry_grades.png", img_bytes, "image/png")}
        response = await client.post("/api/ocr/extract", files=files, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        res_data = response.json()
        assert res_data["flagged"] is True
        assert len(res_data["low_confidence_fields"]) > 0

    async def test_ocr_invalid_mime_type_rejected(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        files = {"file": ("test.pdf", b"pdf content dummy", "application/pdf")}
        response = await client.post("/api/ocr/extract", files=files, headers=headers)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"

    async def test_ocr_file_too_large_rejected(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        # Generate 6MB of dummy bytes
        large_bytes = b"0" * (6 * 1024 * 1024)
        files = {"file": ("large.png", large_bytes, "image/png")}
        response = await client.post("/api/ocr/extract", files=files, headers=headers)
        assert response.status_code == 413, f"Expected 413, got {response.status_code}"

    async def test_ocr_rate_limit(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_grades.png")
        with open(fixture_path, "rb") as f:
            img_bytes = f.read()

        # Clear memory rate limits for testing
        memory_rates.clear()

        # Make 10 successful calls
        for i in range(10):
            files = {"file": ("sample_grades.png", img_bytes, "image/png")}
            res = await client.post("/api/ocr/extract", files=files, headers=headers)
            assert res.status_code == 200, f"Call {i+1} failed"

        # 11th call should return 429
        files = {"file": ("sample_grades.png", img_bytes, "image/png")}
        res = await client.post("/api/ocr/extract", files=files, headers=headers)
        assert res.status_code == 429, f"Expected 429, got {res.status_code}"

    async def test_ocr_unauthenticated(self, client):
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_grades.png")
        with open(fixture_path, "rb") as f:
            img_bytes = f.read()

        files = {"file": ("sample_grades.png", img_bytes, "image/png")}
        response = await client.post("/api/ocr/extract", files=files)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


@pytest.mark.run(order=8)
class TestPhase7TranscriptUploadAndReconciliation:
    async def test_upload_valid_transcript_happy_path(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        
        # Fresh student at semester 2 for upload
        ctx.student_c_email = f"student_c_{uuid.uuid4().hex[:8]}@academicsync.test"
        ctx.student_c_password = "TestPass@123"

        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_grades.png")
        with open(fixture_path, "rb") as f:
            img_bytes = f.read()

        files = {"grading_scale_image": ("sample_grades.png", img_bytes, "image/png")}
        data = {
            "email": ctx.student_c_email,
            "password": ctx.student_c_password,
            "full_name": "Student C",
            "current_semester": "2"
        }
        res_signup = await client.post("/api/auth/signup", data=data, files=files)
        assert res_signup.status_code == 201
        ctx.student_c_id = res_signup.json()["id"]

        # Login Student C
        res_login = await client.post("/api/auth/login", data={
            "username": ctx.student_c_email,
            "password": ctx.student_c_password
        })
        ctx.student_c_token = res_login.json()["access_token"]
        c_headers = {"Authorization": f"Bearer {ctx.student_c_token}"}

        # Create draft mark that matches course in transcript (to test promotion)
        draft_mark_data = {
            "course_name": "DS101 - Data Structures",
            "credit_hours": 3,
            "score": 70.0, # Will be promoted and score updated
            "semester": "Semester 1"
        }
        res_mark = await client.post("/api/marks", json=draft_mark_data, headers=c_headers)
        assert res_mark.status_code == 201

        # Upload transcript
        pdf_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_transcript.pdf")
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        files_pdf = {"file": ("sample_transcript.pdf", pdf_bytes, "application/pdf")}
        data_pdf = {"semester": "Semester 1"}
        
        response = await client.post("/api/transcripts", files=files_pdf, data=data_pdf, headers=c_headers)
        assert response.status_code in (200, 201), f"Expected 200/201, got {response.status_code}"
        
        res_json = response.json()
        assert res_json["verified_count"] == 1
        assert res_json["new_count"] == 4

        # Fetch transcript ID
        list_res = await client.get("/api/transcripts", headers=c_headers)
        ctx.transcript_id = list_res.json()[0]["id"]

    async def test_get_single_transcript(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_c_token}"}
        response = await client.get(f"/api/transcripts/{ctx.transcript_id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["parse_status"] == "parsed"

    async def test_reconciliation_promotes_marks(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_c_token}"}
        response = await client.get("/api/marks?semester=Semester 1", headers=headers)
        assert response.status_code == 200
        
        marks = response.json()
        verified_marks = [m for m in marks if m["status"] == "verified"]
        # Total should be 5 courses
        assert len(verified_marks) == 5, f"Expected 5 verified marks, got {len(verified_marks)}"

    async def test_get_transcript_diff(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_c_token}"}
        response = await client.get(f"/api/transcripts/{ctx.transcript_id}/diff", headers=headers)
        assert response.status_code == 200
        assert response.json()["verified_count"] == 1
        assert response.json()["new_count"] == 4

    async def test_duplicate_transcript_rejected(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_c_token}"}
        pdf_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_transcript.pdf")
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        files_pdf = {"file": ("sample_transcript.pdf", pdf_bytes, "application/pdf")}
        data_pdf = {"semester": "Semester 1"}
        
        response = await client.post("/api/transcripts", files=files_pdf, data=data_pdf, headers=headers)
        assert response.status_code == 409, f"Expected 409, got {response.status_code}"

    async def test_non_pdf_file_rejected(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_c_token}"}
        files = {"file": ("image.png", b"dummy image bytes", "image/png")}
        response = await client.post("/api/transcripts", files=files, headers=headers)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"

    async def test_transcript_file_too_large_rejected(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_c_token}"}
        large_pdf_bytes = b"0" * (11 * 1024 * 1024)
        files = {"file": ("large.pdf", large_pdf_bytes, "application/pdf")}
        response = await client.post("/api/transcripts", files=files, headers=headers)
        assert response.status_code == 413, f"Expected 413, got {response.status_code}"


@pytest.mark.run(order=9)
class TestPhase8AnalysisAndProjection:
    async def test_analysis_endpoint_trend(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.get("/api/analysis", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert len(data["semesters_performance"]) == 2

    async def test_projection_achievable(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.get("/api/analysis?target=3.2&remaining=2", headers=headers)
        assert response.status_code == 200
        
        proj = response.json()["projection"]
        assert proj["achievable"] is True
        # Math: current_cgpa = 2.914, completed_credits = 21
        # remaining sems = 2 sems * 15 = 30 credits. total_credits = 51
        # target_points = 3.2 * 51 = 163.2
        # already earned = 2.914 * 21 = 61.2
        # needed = (163.2 - 61.2) / 30 = 3.4
        assert abs(proj["required_gpa"] - 3.4) < 0.1

    async def test_projection_impossible(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.get("/api/analysis?target=3.99&remaining=1", headers=headers)
        assert response.status_code == 200
        assert response.json()["projection"]["achievable"] is False

    async def test_analysis_no_data_returns_empty(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_b_token}"}
        response = await client.get("/api/analysis", headers=headers)
        assert response.status_code == 200
        assert len(response.json()["semesters_performance"]) == 0
        assert response.json()["cgpa"] == 0.0

    async def test_analysis_unauthenticated(self, client):
        response = await client.get("/api/analysis")
        assert response.status_code == 401


@pytest.mark.run(order=10)
class TestPhase9DataIsolation:
    async def test_student_a_cannot_see_student_b_marks(self, client, ctx):
        # Insert mark for Student B
        b_headers = {"Authorization": f"Bearer {ctx.student_b_token}"}
        data = {
            "course_name": "Student B Course",
            "credit_hours": 3,
            "score": 90.0,
            "semester": "Semester 1"
        }
        res_b = await client.post("/api/marks", json=data, headers=b_headers)
        b_mark_id = res_b.json()["id"]

        # Try to read marks as Student A
        a_headers = {"Authorization": f"Bearer {ctx.student_token}"}
        res_a = await client.get("/api/marks?semester=Semester 1", headers=a_headers)
        
        # Student B's mark should NOT be in Student A's marks list
        for mark in res_a.json():
            assert mark["id"] != b_mark_id, "Student A can see Student B's mark!"

    async def test_student_a_cannot_see_student_b_transcripts(self, client, ctx):
        # Student B's transcripts list should be empty or not contain Student C's transcript
        b_headers = {"Authorization": f"Bearer {ctx.student_b_token}"}
        res_b = await client.get("/api/transcripts", headers=b_headers)
        for transcript in res_b.json():
            assert transcript["id"] != ctx.transcript_id, "Student B can see Student C's transcript!"

    async def test_student_a_cannot_patch_or_delete_student_b_marks(self, client, ctx):
        # Student B's mark
        db = TestingSessionLocal()
        b_mark = db.query(Mark).filter(Mark.student_id == ctx.student_b_id).first()
        b_mark_id = b_mark.id
        db.close()

        a_headers = {"Authorization": f"Bearer {ctx.student_token}"}
        
        # Try PATCH
        patch_res = await client.patch(f"/api/marks/{b_mark_id}", json={"score": 10.0}, headers=a_headers)
        assert patch_res.status_code in (403, 404)

        # Try DELETE
        del_res = await client.delete(f"/api/marks/{b_mark_id}", headers=a_headers)
        assert del_res.status_code in (403, 404)


@pytest.mark.run(order=11)
class TestPhase10Cleanup:
    async def test_cleanup_users(self, ctx):
        db = TestingSessionLocal()
        # Delete test students
        db.query(User).filter(User.id.in_([ctx.student_id, ctx.student_b_id, ctx.student_c_id])).delete(synchronize_session=False)
        db.commit()
        db.close()

    async def test_deleted_token_rejected(self, client, ctx):
        headers = {"Authorization": f"Bearer {ctx.student_token}"}
        response = await client.get("/api/users/me", headers=headers)
        assert response.status_code in (401, 404), f"Expected 401 or 404, got {response.status_code}"
