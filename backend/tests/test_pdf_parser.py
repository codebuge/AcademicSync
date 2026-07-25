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

    def test_table_extraction_with_pdfplumber_mock(self, monkeypatch):
        class MockPage:
            def extract_text(self):
                return "Semester 1\nSpring 2023"

            def extract_tables(self):
                return [[
                    ["Course Code", "Course Title", "Obt. Marks", "Max Marks", "Cr. Hr", "Grade", "Grade Points"],
                    ["CSC103", "Programming Fundamentals", "59", "100", "3", "C-", "1.66"],
                    ["CSC104", "Object Oriented Programming(P)", "", "50", "1", "F", "0.00"],
                    ["MATH101", "Calculus and Analytical Geometry", "85", "100", "3", "A", "4.00"],
                    ["ENG101", "English Composition", "", "", "3", "", ""]  # Malformed row with missing grade
                ]]

        class MockPdf:
            pages = [MockPage()]
            def __enter__(self): return self
            def __exit__(self, *args): pass

        monkeypatch.setattr("pdfplumber.open", lambda *a, **kw: MockPdf())

        result = parse_transcript_pdf(b"dummy_pdf_content")
        assert len(result) == 1
        sem = result[0]
        assert "Semester 1" in sem["semester_name"]
        assert "Spring 2023" in sem["semester_name"]
        assert len(sem["courses"]) == 3
        assert sem["courses"][0]["course_name"] == "CSC103 - Programming Fundamentals"
        assert sem["courses"][0]["credit_hours"] == 3.0
        assert sem["courses"][0]["grade"] == "C-"
        assert sem["courses"][1]["course_name"] == "CSC104 - Object Oriented Programming(P)"
        assert sem["courses"][1]["grade"] == "F"
        assert len(sem["parse_warnings"]) == 1
        assert "ENG101" in sem["parse_warnings"][0]


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
