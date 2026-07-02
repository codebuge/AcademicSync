from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    current_semester: int = Field(1, ge=1, le=12)

class UserResponse(UserBase):
    id: str
    role: str
    current_semester: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Mark Schemas ---
class MarkBase(BaseModel):
    course_name: str
    score: float = Field(..., ge=0, le=100)
    max_score: float = Field(100.0, gt=0)
    semester: str
    credit_hours: float = Field(..., gt=0, le=19)
    letter_grade: Optional[str] = None

class MarkCreate(MarkBase):
    student_id: Optional[str] = None

class MarkResponse(MarkBase):
    id: str
    student_id: str
    status: str
    source: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Transcript Schemas ---
class TranscriptResponse(BaseModel):
    id: str
    student_id: str
    semester: Optional[str] = None
    transcript_pdf_url: str
    screenshot_url: Optional[str] = None
    status: str
    parse_status: str
    verified_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Grading Scale Schemas ---
class GradingScaleRowCreate(BaseModel):
    min_percent: float = Field(..., ge=0, le=100)
    max_percent: Optional[float] = Field(None, ge=0, le=100)
    letter_grade: str
    gpa_points: Optional[float] = Field(None, ge=0, le=5.0)
    sort_order: int

class GradingScaleRowResponse(BaseModel):
    id: str
    user_id: str
    min_percent: float
    max_percent: Optional[float] = None
    letter_grade: str
    gpa_points: Optional[float] = None
    sort_order: int

    class Config:
        from_attributes = True


# --- OCR / Transcript Parser Schemas ---
class OcrExtractedMark(BaseModel):
    course_name: str
    credit_hours: float
    score: float
    confidence: float
    flagged: bool

class OcrResponse(BaseModel):
    source: str  # "google_vision" or "mock_fallback"
    marks: List[OcrExtractedMark]
    flagged: bool
    low_confidence_fields: List[str]

class OcrGradingScaleResponse(BaseModel):
    rows: List[GradingScaleRowResponse]
    flagged: bool
    error_code: Optional[str] = None


# --- Calculation Schemas ---
class GpaResponse(BaseModel):
    semester: str
    gpa: float
    total_credits: float

class CgpaResponse(BaseModel):
    cgpa: float
    total_verified_credits: float
    verified_semesters_count: int


# --- Projection & Analysis Schemas ---
class ProjectionResponse(BaseModel):
    target_cgpa: float
    remaining_semesters: int
    required_gpa: float
    achievable: bool

class ReconciliationResponse(BaseModel):
    verified_count: int
    new_count: int
    unmatched: List[str]

class SemesterAnalysis(BaseModel):
    semester_name: str
    gpa: float
    verified_only_gpa: float
    status: str
    credits: float

class PerformanceAnalysisResponse(BaseModel):
    cgpa: float
    semesters_performance: List[SemesterAnalysis]
    total_courses_count: int
    verification_summary: dict
    projection: Optional[ProjectionResponse] = None

