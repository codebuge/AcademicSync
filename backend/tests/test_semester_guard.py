import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.db.session import Base
from app.db.models import User, Mark
from app.services.semester_guard import SemesterGuard, SemesterGuardBlocked

@pytest.fixture(scope="module")
def db():
    # SQLite memory engine for testing
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


def make_test_user(db, user_id="test-student", sem=1):
    user = User(
        id=user_id,
        email=f"{user_id}@test.com",
        role="student",
        current_semester=sem
    )
    db.add(user)
    db.commit()
    return user


class TestCanModifyMarks:
    def test_draft_allows_modification(self):
        assert SemesterGuard.can_modify_marks("draft") is True

    def test_pending_blocks_modification(self):
        assert SemesterGuard.can_modify_marks("pending_verification") is False

    def test_verified_blocks_modification(self):
        assert SemesterGuard.can_modify_marks("verified") is False

    def test_locked_blocks_modification(self):
        assert SemesterGuard.can_modify_marks("locked") is False


class TestValidateTransition:
    def test_draft_to_pending_valid(self):
        assert SemesterGuard.validate_transition("draft", "pending_verification") is True

    def test_pending_to_verified_valid(self):
        assert SemesterGuard.validate_transition("pending_verification", "verified") is True

    def test_pending_to_draft_valid(self):
        assert SemesterGuard.validate_transition("pending_verification", "draft") is True

    def test_verified_to_locked_valid(self):
        assert SemesterGuard.validate_transition("verified", "locked") is True

    def test_draft_to_verified_invalid(self):
        assert SemesterGuard.validate_transition("draft", "verified") is False

    def test_draft_to_locked_invalid(self):
        assert SemesterGuard.validate_transition("draft", "locked") is False


class TestSemesterGuardUploadChecks:
    def test_semester_1_upload_blocked(self, db):
        user = make_test_user(db, "student-sem1", sem=1)
        with pytest.raises(SemesterGuardBlocked) as exc_info:
            SemesterGuard.check_transcript_upload(user.current_semester)
        
        assert "available from Semester 2 onwards" in str(exc_info.value)

    def test_semester_2_upload_allowed(self, db):
        user = make_test_user(db, "student-sem2", sem=2)
        # Should not raise any exception
        SemesterGuard.check_transcript_upload(user.current_semester)


class TestSemesterGuardPromotions:
    def test_reconciliation_promotes_marks(self, db):
        user = make_test_user(db, "student-promotion", sem=2)
        mark1 = Mark(
            student_id=user.id,
            course_name="Data Structures",
            score=90.0,
            semester="Fall 2024",
            credit_hours=4.0,
            status="pending_verification",
            source="manual"
        )
        mark2 = Mark(
            student_id=user.id,
            course_name="Physics I",
            score=82.0,
            semester="Fall 2024",
            credit_hours=4.0,
            status="draft",  # draft should NOT be promoted
            source="manual"
        )
        db.add(mark1)
        db.add(mark2)
        db.commit()

        # Promote marks for Fall 2024
        SemesterGuard.promote_marks_on_verification(db, user.id, "Fall 2024")

        # Refresh
        db.refresh(mark1)
        db.refresh(mark2)

        assert mark1.status == "verified"
        assert mark2.status == "draft"
