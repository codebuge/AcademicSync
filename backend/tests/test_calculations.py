import pytest
from app.db.models import Mark, User, GradingScaleRow
from app.services.calculations import calculate_gpa, calculate_cgpa, get_cgpa_projection, score_to_gpa
import os

class MockGradingScaleRow:
    def __init__(self, min_percent: float, max_percent: Optional[float], letter_grade: str, gpa_points: Optional[float]):
        self.min_percent = min_percent
        self.max_percent = max_percent
        self.letter_grade = letter_grade
        self.gpa_points = gpa_points

# Helper factory
def make_mark(score: float, credit_hours: float, status: str) -> Mark:
    m = Mark()
    m.score = score
    m.credit_hours = credit_hours
    m.status = status
    m.verification_status = status  # Keep compatibility
    m.course_name = "Test Course"
    m.semester = "Fall 2024"
    return m

# Mock standard scales
standard_scale = [
    MockGradingScaleRow(93.00, 100.00, "A", 4.0),
    MockGradingScaleRow(90.00, 92.99, "A-", 3.7),
    MockGradingScaleRow(87.00, 89.99, "B+", 3.3),
    MockGradingScaleRow(80.00, 86.99, "B", 3.0),
    MockGradingScaleRow(60.00, 79.99, "D", 1.0),
    MockGradingScaleRow(0.00, 59.99, "F", 0.0)
]

alternate_scale = [
    MockGradingScaleRow(90.00, 100.00, "A", 4.0),
    MockGradingScaleRow(80.00, 89.99, "B", 3.0),
    MockGradingScaleRow(0.00, 79.99, "F", 0.0)
]

non_numeric_scale = [
    MockGradingScaleRow(90.00, 100.00, "A", 4.0),
    MockGradingScaleRow(0.00, 89.99, "I", None)  # Incomplete
]

class TestScoreToGpa:
    def test_score_to_gpa_standard(self):
        assert score_to_gpa(95.0, standard_scale) == 4.0
        assert score_to_gpa(91.0, standard_scale) == 3.7
        assert score_to_gpa(55.0, standard_scale) == 0.0

    def test_score_to_gpa_alternate(self):
        assert score_to_gpa(91.0, alternate_scale) == 4.0  # alternate has A starting at 90
        assert score_to_gpa(85.0, alternate_scale) == 3.0

    def test_score_to_gpa_non_numeric(self):
        assert score_to_gpa(85.0, non_numeric_scale) is None


class TestCalculateGpa:
    def test_empty_list_returns_zero(self):
        assert calculate_gpa([], standard_scale) == 0.0

    def test_single_course_verified(self):
        marks = [make_mark(95.0, 3.0, "verified")]
        assert calculate_gpa(marks, standard_scale) == 4.0

    def test_draft_excluded(self):
        marks = [
            make_mark(95.0, 3.0, "verified"),
            make_mark(85.0, 4.0, "draft")  # Exclude draft
        ]
        assert calculate_gpa(marks, standard_scale) == 4.0

    def test_non_numeric_grade_excluded_entirely(self):
        """Marks with gpa_points=None (Incomplete) are excluded from both numerator and denominator."""
        marks = [
            make_mark(95.0, 3.0, "verified"),  # A (4.0 * 3cr = 12.0 points)
            make_mark(85.0, 4.0, "verified")   # Incomplete (gpa_points=None, 4cr) -> Exclude
        ]
        # GPA = 12.0 / 3.0 = 4.0 (If not excluded, credit sum is 7.0, reducing GPA)
        assert calculate_gpa(marks, non_numeric_scale) == 4.0


class TestCalculateCgpa:
    def test_calculate_cgpa_weighted(self):
        marks = [
            make_mark(95.0, 3.0, "verified"),  # 4.0 * 3 = 12.0
            make_mark(88.0, 4.0, "verified")   # 3.3 * 4 = 13.2
        ]
        # CGPA = (12.0 + 13.2) / 7.0 = 25.2 / 7.0 = 3.6
        assert calculate_cgpa(marks, standard_scale) == 3.6


class TestGpaProjection:
    def test_projection_returns_correct_value(self):
        # Current CGPA is 3.0, completed 30 credits. Target is 3.5. Remaining 2 semesters (30 credits).
        # Target CGPA = (3.0 * 30 + Req * 30) / 60 = 3.5 => Req = 4.0
        res = get_cgpa_projection(
            target_cgpa=3.5,
            remaining_semesters=2,
            current_cgpa=3.0,
            completed_credits=30.0,
            scale_rows=standard_scale
        )
        assert res["required_gpa"] == 4.0
        assert res["achievable"] is True

    def test_projection_unachievable(self):
        # Target CGPA of 4.5 is impossible on a 4.0 scale
        res = get_cgpa_projection(
            target_cgpa=4.5,
            remaining_semesters=2,
            current_cgpa=3.0,
            completed_credits=30.0,
            scale_rows=standard_scale
        )
        assert res["achievable"] is False


# Volatility and trigger-based batch recalculation isolation test
# Requires a live PostgreSQL database instance
def test_stable_batch_recalculation_isolation(db_session):
    """
    Asserts that score_to_grade_points STABLE volatility works correctly
    and does not leak or cache values across different user_ids within a single query context.
    """
    if "sqlite" in os.getenv("TEST_DATABASE_URL", "sqlite:///"):
        pytest.skip("This test requires a live Postgres database to run triggers and functions.")
        
    db = db_session
    try:
        # Create User A (uses standard scale where 90% = 3.7)
        user_a = User(id="user-a", email="usera@test.com", role="student", current_semester=1)
        db.add(user_a)
        
        # Create User B (uses alternate scale where 90% = 4.0)
        user_b = User(id="user-b", email="userb@test.com", role="student", current_semester=1)
        db.add(user_b)
        
        db.commit()

        # Add scale rows for User A (Standard Scale)
        for row in standard_scale:
            db.add(GradingScaleRow(
                user_id="user-a", min_percent=row.min_percent, max_percent=row.max_percent,
                letter_grade=row.letter_grade, gpa_points=row.gpa_points, sort_order=0
            ))
            
        # Add scale rows for User B (Alternate Scale)
        for row in alternate_scale:
            db.add(GradingScaleRow(
                user_id="user-b", min_percent=row.min_percent, max_percent=row.max_percent,
                letter_grade=row.letter_grade, gpa_points=row.gpa_points, sort_order=0
            ))
            
        db.commit()

        # Insert marks with same score (90.0) for both users in a single statement
        mark_a = Mark(student_id="user-a", course_name="Course A", score=90.0, credit_hours=3.0, semester="Fall 2024", status="verified", source="manual")
        mark_b = Mark(student_id="user-b", course_name="Course B", score=90.0, credit_hours=3.0, semester="Fall 2024", status="verified", source="manual")
        
        db.add(mark_a)
        db.add(mark_b)
        db.commit()

        # The recalculate_gpa() trigger computes GPA and stores it in gpa_history
        hist_a = db.query(GpaHistory).filter(GpaHistory.student_id == "user-a").first()
        hist_b = db.query(GpaHistory).filter(GpaHistory.student_id == "user-b").first()
        
        # User A gpa should be 3.7, User B gpa should be 4.0
        assert hist_a.gpa == 3.7
        assert hist_b.gpa == 4.0
        
    finally:
        # Clean up
        db.query(Mark).filter(Mark.student_id.in_(["user-a", "user-b"])).delete()
        db.query(GradingScaleRow).filter(GradingScaleRow.user_id.in_(["user-a", "user-b"])).delete()
        db.query(User).filter(User.id.in_(["user-a", "user-b"])).delete()
        db.commit()
