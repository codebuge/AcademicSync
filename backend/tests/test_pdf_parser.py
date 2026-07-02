import pytest
from app.services.pdf_parser import get_grade_points, parse_transcript_pdf, map_grade_to_score, reconcile_transcript
from app.db.models import User, Mark, Transcript, GradingScaleRow
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base

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


class TestGetGradePoints:
    def test_a_plus(self):
        assert get_grade_points("A+") == 4.0

    def test_a(self):
        assert get_grade_points("A") == 4.0

    def test_a_minus(self):
        assert get_grade_points("A-") == 3.7

    def test_b_plus(self):
        assert get_grade_points("B+") == 3.3

    def test_b(self):
        assert get_grade_points("B") == 3.0

    def test_c(self):
        assert get_grade_points("C") == 2.0

    def test_d(self):
        assert get_grade_points("D") == 1.0

    def test_f(self):
        assert get_grade_points("F") == 0.0


class TestParseTranscriptPdf:
    def test_empty_bytes_returns_empty_list(self):
        result = parse_transcript_pdf(b"")
        assert result == []

    def test_invalid_pdf_returns_empty_list(self):
        result = parse_transcript_pdf(b"This is not a PDF file at all.")
        assert result == []


class TestMapGradeToScore:
    def test_map_grade_to_score_custom_scale(self):
        scale_rows = [
            GradingScaleRow(min_percent=90.0, max_percent=100.0, letter_grade="A", gpa_points=4.0, sort_order=0),
            GradingScaleRow(min_percent=80.0, max_percent=89.9, letter_grade="B", gpa_points=3.0, sort_order=1)
        ]
        # Midpoint of 90 and 100 is 95
        assert map_grade_to_score("A", scale_rows) == 95.0
        # Midpoint of 80 and 89.9 is 84.95
        assert map_grade_to_score("B", scale_rows) == 84.95
        # Default fallback
        assert map_grade_to_score("C", scale_rows) == 75.0


class TestReconcileTranscript:
    def test_reconcile_transcript_empty_or_failed_record(self, db):
        # Create user
        user = User(id="student-reconcile", email="rec@test.com", role="student", current_semester=2)
        db.add(user)
        
        # Create transcript record
        transcript = Transcript(
            id="trans-id",
            student_id="student-reconcile",
            transcript_pdf_url="transcripts/student-reconcile/trans.pdf",
            status="pending",
            parse_status="pending"
        )
        db.add(transcript)
        db.commit()

        # Run reconciliation on empty transcript (should return zero verified counts)
        res = reconcile_transcript(db, "student-reconcile", "trans-id")
        
        assert res["verified_count"] == 0
        assert res["new_count"] == 0
        assert len(res["unmatched"]) == 0
