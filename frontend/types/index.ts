export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'student' | 'teacher' | 'admin';
  current_semester: number;
  created_at: string;
}

export interface Mark {
  id: string;
  student_id: string;
  course_name: string;
  score: number;
  max_score: number;
  semester: string;
  credit_hours: number;
  letter_grade: string | null;
  status: 'draft' | 'pending_verification' | 'verified' | 'locked';
  source: 'manual' | 'ocr_extracted' | 'transcript';
  created_at: string;
  updated_at: string;
}

export interface GpaHistory {
  semester: string;
  gpa: number;
  cgpa_at_time: number | null;
}

export interface SemesterAnalysis {
  semester_name: string;
  gpa: number;
  verified_only_gpa: number;
  status: string;
  credits: number;
}

export interface Transcript {
  id: string;
  student_id: string;
  semester: string | null;
  transcript_pdf_url: string;
  screenshot_url: string | null;
  status: string;
  parse_status: 'pending' | 'parsed' | 'failed';
  verified_at: string | null;
  created_at: string;
}

export interface GradingScaleRow {
  id: string;
  user_id: string;
  min_percent: number;
  max_percent: number | null;
  letter_grade: string;
  gpa_points: number | null;
  sort_order: number;
}

export interface OcrExtractedMark {
  course_name: string;
  credit_hours: number;
  score: number;
  confidence: number;
  flagged: boolean;
}

export interface OcrResponse {
  source: string;
  marks: OcrExtractedMark[];
  flagged: boolean;
  low_confidence_fields: string[];
}

export interface ProjectionResult {
  target_cgpa: number;
  remaining_semesters: number;
  required_gpa: number;
  achievable: boolean;
}

export interface ReconciliationResult {
  verified_count: number;
  new_count: number;
  unmatched: string[];
}

export interface GpaResponse {
  semester: string;
  gpa: number;
  total_credits: number;
}

export interface CgpaResponse {
  cgpa: number;
  total_verified_credits: number;
  verified_semesters_count: number;
}

export interface PerformanceAnalysisResponse {
  cgpa: number;
  semesters_performance: SemesterAnalysis[];
  total_courses_count: number;
  verification_summary: Record<string, number>;
  projection: ProjectionResult | null;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  current_semester: number;
  grading_scale_image?: File;
}

// API error type
export interface ApiError {
  detail: string;
  code?: string;
}
