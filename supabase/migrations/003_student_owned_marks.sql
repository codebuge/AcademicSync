-- Migration to change marks ownership to student-only
-- Drop the existing policies for teacher/admin only on marks
DROP POLICY IF EXISTS "Allow insert on marks: teacher/admin only" ON public.marks;
DROP POLICY IF EXISTS "Allow update on marks: teacher/admin only" ON public.marks;
DROP POLICY IF EXISTS "Allow delete on marks: teacher/admin only" ON public.marks;

-- Create policies for student owned marks
CREATE POLICY "marks: student inserts own, status guard"
  ON public.marks FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND status IN ('draft', 'pending_verification')
  );

CREATE POLICY "marks: student updates own, not locked/verified"
  ON public.marks FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (
    auth.uid() = student_id
    AND status NOT IN ('verified', 'locked')
  );

CREATE POLICY "marks: student deletes own draft/pending only"
  ON public.marks FOR DELETE
  USING (
    auth.uid() = student_id
    AND status IN ('draft', 'pending_verification')
  );
