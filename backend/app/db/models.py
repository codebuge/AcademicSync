from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="student", nullable=False)  # student, teacher, admin
    current_semester = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")
    gpa_history = relationship("GpaHistory", back_populates="student", cascade="all, delete-orphan")
    transcripts = relationship("Transcript", back_populates="student", cascade="all, delete-orphan")
    grading_scales = relationship("GradingScaleRow", back_populates="user", cascade="all, delete-orphan")


class Mark(Base):
    __tablename__ = "marks"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_name = Column(String, nullable=False)
    score = Column(Float, nullable=False, default=0.0)
    max_score = Column(Float, nullable=False, default=100.0)
    semester = Column(String, nullable=False)  # e.g., 'Fall 2025', 'Spring 2026'
    credit_hours = Column(Float, nullable=False, default=3.0)
    letter_grade = Column(String, nullable=True)
    status = Column(String, default="draft", nullable=False)  # draft, pending_verification, verified, locked
    source = Column(String, default="manual", nullable=False)  # manual, ocr_extracted, transcript
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    student = relationship("User", back_populates="marks")


class GpaHistory(Base):
    __tablename__ = "gpa_history"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    semester = Column(String, nullable=False)
    gpa = Column(Float, nullable=False)
    cgpa_at_time = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    student = relationship("User", back_populates="gpa_history")


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    semester = Column(String, nullable=True)  # Nullable for overall transcript
    transcript_pdf_url = Column(String, nullable=False)
    screenshot_url = Column(String, nullable=True)
    status = Column(String, default="pending", nullable=False)  # pending, verified, rejected
    parse_status = Column(String, default="pending", nullable=False)  # pending, parsed, failed
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    student = relationship("User", back_populates="transcripts")


class GradingScaleRow(Base):
    __tablename__ = "grading_scale_rows"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    min_percent = Column(Float, nullable=False)
    max_percent = Column(Float, nullable=True)
    letter_grade = Column(String, nullable=False)
    gpa_points = Column(Float, nullable=True)  # Nullable for non-numeric (I/W/Freeze)
    sort_order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="grading_scales")

