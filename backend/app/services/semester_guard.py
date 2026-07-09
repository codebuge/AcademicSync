from sqlalchemy.orm import Session
from app.db.models import Mark


class SemesterGuardBlocked(Exception):
    def __init__(self, detail: str, code: str = "SEMESTER_GUARD_BLOCKED"):
        self.detail = detail
        self.code = code


class SemesterGuard:
    # State list
    DRAFT = "draft"
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    LOCKED = "locked"

    # Define valid transitions: { current_state: [allowed_next_states] }
    TRANSITIONS = {
        DRAFT: [PENDING_VERIFICATION],
        PENDING_VERIFICATION: [VERIFIED, DRAFT],
        VERIFIED: [LOCKED, DRAFT],
        LOCKED: []  # Terminal state
    }

    @classmethod
    def can_modify_marks(cls, semester_status: str) -> bool:
        """
        Marks can only be created, updated, or deleted if the semester is in DRAFT state.
        """
        return semester_status.lower() == cls.DRAFT

    @classmethod
    def validate_transition(cls, current_status: str, target_status: str) -> bool:
        """
        Validates whether transitioning from current_status to target_status is allowed.
        """
        cur = current_status.lower()
        tgt = target_status.lower()
        if cur not in cls.TRANSITIONS:
            return False
        return tgt in cls.TRANSITIONS[cur]

    @classmethod
    def check_transcript_upload(cls, current_semester: int):
        """
        Block transcript uploads if semester is 1.
        """
        if current_semester < 2:
            raise SemesterGuardBlocked(
                detail="Transcript upload available from Semester 2 onwards",
                code="SEMESTER_GUARD_BLOCKED"
            )

    @classmethod
    def promote_marks_on_verification(cls, db: Session, student_id: str, semester: str):
        """
        On transcript verified: promote matching pending_verification marks -> verified for that semester.
        """
        marks = db.query(Mark).filter(
            Mark.student_id == student_id,
            Mark.semester == semester,
            Mark.status == "pending_verification"
        ).all()
        for mark in marks:
            mark.status = "verified"
        db.commit()
