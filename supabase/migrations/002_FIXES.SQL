-- ==========================================
-- 002_FIXES.SQL
-- Schema fixes, per-user grading scale, RLS hardening
-- Live-safe: uses IF NOT EXISTS / DROP ... IF EXISTS throughout
-- ==========================================

-- ==========================================
-- 1. TABLE ALTERATIONS
-- ==========================================

-- Users: add current_semester (no grading_scale enum — replaced by grading_scale_rows table)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_semester integer NOT NULL DEFAULT 1;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_current_semester;
ALTER TABLE public.users ADD CONSTRAINT check_current_semester
    CHECK (current_semester >= 1 AND current_semester <= 12);

-- Marks: add credit_hours, letter_grade, status, source
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS credit_hours numeric(3,1) NOT NULL DEFAULT 3.0;
ALTER TABLE public.marks DROP CONSTRAINT IF EXISTS check_credit_hours_positive;
ALTER TABLE public.marks ADD CONSTRAINT check_credit_hours_positive CHECK (credit_hours > 0);

ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS letter_grade text;

ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.marks DROP CONSTRAINT IF EXISTS check_marks_status;
ALTER TABLE public.marks ADD CONSTRAINT check_marks_status
    CHECK (status IN ('draft', 'pending_verification', 'verified', 'locked'));

ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
ALTER TABLE public.marks DROP CONSTRAINT IF EXISTS check_marks_source;
ALTER TABLE public.marks ADD CONSTRAINT check_marks_source
    CHECK (source IN ('manual', 'ocr_extracted', 'transcript'));

-- GPA History: add cgpa_at_time
ALTER TABLE public.gpa_history ADD COLUMN IF NOT EXISTS cgpa_at_time numeric(3,2);
ALTER TABLE public.gpa_history DROP CONSTRAINT IF EXISTS check_cgpa_range;
ALTER TABLE public.gpa_history ADD CONSTRAINT check_cgpa_range
    CHECK (cgpa_at_time IS NULL OR (cgpa_at_time >= 0.00 AND cgpa_at_time <= 4.00));

-- Transcripts: add parse_status, verified_at
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS parse_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.transcripts DROP CONSTRAINT IF EXISTS check_parse_status;
ALTER TABLE public.transcripts ADD CONSTRAINT check_parse_status
    CHECK (parse_status IN ('pending', 'parsed', 'failed'));

ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS verified_at timestamptz;


-- ==========================================
-- 2. NEW TABLE: grading_scale_rows
-- ==========================================
-- Per-user grading scale parsed from OCR at signup.
-- Supports numeric ranges (percentage → letter → GPA) and
-- non-numeric outcomes (Incomplete/Withdrawn/Freeze → NULL gpa_points).
-- Schema is future-proof: DELETE + reinsert for a user_id is sufficient
-- for the planned re-upload feature (no schema migration needed).
-- TODO: Add UPDATE/DELETE RLS policies when the re-upload feature ships.

CREATE TABLE IF NOT EXISTS public.grading_scale_rows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    min_percent numeric(5, 2) NOT NULL
        CHECK (min_percent >= 0.00 AND min_percent <= 100.00),
    max_percent numeric(5, 2)
        CHECK (max_percent IS NULL OR (max_percent >= 0.00 AND max_percent <= 100.00)),
    letter_grade text NOT NULL,
    gpa_points numeric(3, 2),  -- NULL for non-numeric outcomes (I/W/Freeze)
    sort_order integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT check_percent_range CHECK (max_percent IS NULL OR min_percent <= max_percent)
);

-- Primary lookup index for score_to_grade_points function
CREATE INDEX IF NOT EXISTS idx_grading_scale_rows_user
    ON public.grading_scale_rows(user_id);
-- Partial index for numeric-only lookups (excludes I/W/Freeze rows)
CREATE INDEX IF NOT EXISTS idx_grading_scale_rows_lookup
    ON public.grading_scale_rows(user_id, min_percent, max_percent)
    WHERE gpa_points IS NOT NULL;

-- Enable RLS
ALTER TABLE public.grading_scale_rows ENABLE ROW LEVEL SECURITY;

-- RLS policies for grading_scale_rows
DROP POLICY IF EXISTS "grading_scale_select_own_or_staff" ON public.grading_scale_rows;
CREATE POLICY "grading_scale_select_own_or_staff" ON public.grading_scale_rows
    FOR SELECT USING (
        auth.uid() = user_id
        OR public.get_user_role() IN ('teacher', 'admin')
    );

DROP POLICY IF EXISTS "grading_scale_insert_own" ON public.grading_scale_rows;
CREATE POLICY "grading_scale_insert_own" ON public.grading_scale_rows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies — scale is permanent for this pass
-- TODO: Future re-upload feature will require DELETE + INSERT policies for the owning user


-- ==========================================
-- 3. FUNCTIONS
-- ==========================================

-- (a) score_to_grade_points: per-user lookup against grading_scale_rows
-- Marked STABLE (not IMMUTABLE) because it reads from a mutable table.
-- Performance: the partial index idx_grading_scale_rows_lookup ensures
-- this lookup is index-assisted even when called per-row in triggers.
-- Will NOT cache/reuse results across different target_user_id values
-- within a single statement — confirmed safe for batch recalculation.
CREATE OR REPLACE FUNCTION public.score_to_grade_points(
    target_user_id uuid,
    score numeric
)
RETURNS numeric AS $$
    SELECT gpa_points
    FROM public.grading_scale_rows
    WHERE user_id = target_user_id
      AND gpa_points IS NOT NULL
      AND score >= min_percent
      AND (max_percent IS NULL OR score <= max_percent)
    ORDER BY min_percent DESC
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;


-- (b) recalculate_gpa: weighted GPA per semester + CGPA across all semesters
-- Fires on marks INSERT/UPDATE/DELETE via existing on_mark_change trigger.
-- CREATE OR REPLACE updates the function body in-place — no trigger recreation needed.
-- Only includes 'verified' marks; excludes NULL gpa_points (I/W/Freeze outcomes).
CREATE OR REPLACE FUNCTION public.recalculate_gpa()
RETURNS trigger AS $$
DECLARE
    target_student_id uuid;
    target_semester text;
    semester_gpa numeric(3, 2);
    cumulative_cgpa numeric(3, 2);
BEGIN
    IF tg_op = 'DELETE' THEN
        target_student_id := old.student_id;
        target_semester := old.semester;
    ELSE
        target_student_id := new.student_id;
        target_semester := new.semester;
    END IF;

    -- Semester GPA: weighted by credit_hours, verified marks only
    -- Uses CTE to avoid calling score_to_grade_points twice per row
    SELECT CASE
        WHEN COALESCE(SUM(sm.credit_hours), 0) > 0 THEN
            ROUND(SUM(sm.gp * sm.credit_hours) / SUM(sm.credit_hours), 2)
        ELSE NULL
    END INTO semester_gpa
    FROM (
        SELECT m.credit_hours,
               public.score_to_grade_points(target_student_id, m.score) AS gp
        FROM public.marks m
        WHERE m.student_id = target_student_id
          AND m.semester = target_semester
          AND m.status = 'verified'
    ) sm
    WHERE sm.gp IS NOT NULL;

    -- CGPA: all verified marks across ALL semesters
    SELECT CASE
        WHEN COALESCE(SUM(am.credit_hours), 0) > 0 THEN
            ROUND(SUM(am.gp * am.credit_hours) / SUM(am.credit_hours), 2)
        ELSE NULL
    END INTO cumulative_cgpa
    FROM (
        SELECT m.credit_hours,
               public.score_to_grade_points(target_student_id, m.score) AS gp
        FROM public.marks m
        WHERE m.student_id = target_student_id
          AND m.status = 'verified'
    ) am
    WHERE am.gp IS NOT NULL;

    IF semester_gpa IS NOT NULL THEN
        -- Upsert: store both semester GPA and current CGPA snapshot
        INSERT INTO public.gpa_history (student_id, semester, gpa, cgpa_at_time, updated_at)
        VALUES (target_student_id, target_semester, semester_gpa, cumulative_cgpa,
                timezone('utc'::text, now()))
        ON CONFLICT (student_id, semester) DO UPDATE
        SET gpa = excluded.gpa,
            cgpa_at_time = excluded.cgpa_at_time,
            updated_at = timezone('utc'::text, now());
    ELSE
        -- No verified marks with numeric grade points remain
        DELETE FROM public.gpa_history
        WHERE student_id = target_student_id AND semester = target_semester;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: the trigger on_mark_change already exists from 001_initial_schema.sql
-- and points to recalculate_gpa(). CREATE OR REPLACE above updates it in-place.


-- ==========================================
-- 4. RLS POLICY FIXES
-- ==========================================

-- (a) Secure get_user_role: revoke from public, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- (b) Fix handle_update_user: only admin callers can change the role field
-- Prevents metadata-based role self-promotion by non-admin users
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS trigger AS $$
BEGIN
    UPDATE public.users
    SET
        email = new.email,
        full_name = COALESCE(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            public.users.full_name
        ),
        -- Role update gated: only proceeds if the caller is an admin
        role = CASE
            WHEN public.get_user_role() = 'admin'
            THEN COALESCE(new.raw_user_meta_data->>'role', public.users.role)
            ELSE public.users.role
        END,
        updated_at = timezone('utc'::text, now())
    WHERE id = new.id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- (c) Transcript INSERT: block students in semester < 2, teachers/admins bypass
DROP POLICY IF EXISTS "Allow insert on transcripts: owner (submitting) or teacher/admin role"
    ON public.transcripts;
CREATE POLICY "Allow insert on transcripts: semester >= 2 or staff" ON public.transcripts
    FOR INSERT WITH CHECK (
        (
            auth.uid() = student_id
            AND (SELECT current_semester FROM public.users WHERE id = auth.uid()) >= 2
        )
        OR public.get_user_role() IN ('teacher', 'admin')
    );

-- (d) Marks UPDATE: teacher/admin only, block modification of locked marks
DROP POLICY IF EXISTS "Allow update on marks: teacher/admin only" ON public.marks;
CREATE POLICY "Allow update on marks: teacher/admin, not locked" ON public.marks
    FOR UPDATE USING (
        public.get_user_role() IN ('teacher', 'admin')
        AND status != 'locked'
    );


-- ==========================================
-- 5. STORAGE: grading_scale_screenshots bucket + policies
-- ==========================================

-- Create the bucket for grading scale screenshot uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'grading_scale_screenshots',
    'grading_scale_screenshots',
    false,
    5242880,  -- 5 MB
    '{"image/png", "image/jpeg", "image/jpg", "image/webp"}'
)
ON CONFLICT (id) DO UPDATE SET
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies: user owns their folder, staff can read
DROP POLICY IF EXISTS "grading_scale_screenshots_insert" ON storage.objects;
CREATE POLICY "grading_scale_screenshots_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'grading_scale_screenshots'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "grading_scale_screenshots_select" ON storage.objects;
CREATE POLICY "grading_scale_screenshots_select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'grading_scale_screenshots'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.get_user_role() IN ('teacher', 'admin')
        )
    );
