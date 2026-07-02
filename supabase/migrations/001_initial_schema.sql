-- ==========================================
-- 001_INITIAL_SCHEMA.SQL
-- Supabase Migration Schema for Student Academic Tracking
-- ==========================================

-- Enable the UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. TABLES DEFINITIONS
-- ==========================================

-- Users Table (Profiles linked to Supabase Auth)
create table public.users (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Marks Table (Stores individual course scores)
create table public.marks (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.users(id) on delete cascade,
    course_name text not null,
    score numeric(5, 2) not null check (score >= 0.00 and score <= 100.00),
    max_score numeric(5, 2) not null default 100.00 check (max_score > 0.00),
    semester text not null, -- e.g., 'Fall 2025', 'Spring 2026'
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

-- GPA History Table (Stores GPA per semester per student)
create table public.gpa_history (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.users(id) on delete cascade,
    semester text not null,
    gpa numeric(3, 2) not null check (gpa >= 0.00 and gpa <= 4.00),
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now()),
    constraint unique_student_semester_gpa unique (student_id, semester)
);

-- Transcripts Table (Academic transcript PDFs and screenshots)
create table public.transcripts (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.users(id) on delete cascade,
    semester text, -- NULL implies overall transcript, otherwise semester-specific
    transcript_pdf_url text not null, -- Path to the transcript file in Supabase storage
    screenshot_url text,              -- Path to optional screenshot verification file
    status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now()),
    constraint unique_student_semester_transcript unique (student_id, semester)
);

-- ==========================================
-- 2. AUTOMATIC TIMESTAMP TRIGGERS
-- ==========================================

-- Reusable function to set updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
    before update on public.users
    for each row execute procedure public.update_updated_at_column();

create trigger update_marks_updated_at
    before update on public.marks
    for each row execute procedure public.update_updated_at_column();

create trigger update_gpa_history_updated_at
    before update on public.gpa_history
    for each row execute procedure public.update_updated_at_column();

create trigger update_transcripts_updated_at
    before update on public.transcripts
    for each row execute procedure public.update_updated_at_column();


-- ==========================================
-- 3. AUTH.USERS TO PUBLIC.USERS SYNC TRIGGERS
-- ==========================================

-- Trigger function to create/sync public.users record on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, full_name, role)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        coalesce(new.raw_user_meta_data->>'role', 'student')
    )
    on conflict (id) do update set
        email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Trigger function to update public.users record on auth metadata change
create or replace function public.handle_update_user()
returns trigger as $$
begin
    update public.users
    set
        email = new.email,
        full_name = coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', public.users.full_name),
        role = coalesce(new.raw_user_meta_data->>'role', public.users.role),
        updated_at = timezone('utc'::text, now())
    where id = new.id;
    return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace trigger on_auth_user_updated
    after update on auth.users
    for each row execute procedure public.handle_update_user();


-- ==========================================
-- 4. REACTIVE GPA CALCULATION ENGINE
-- ==========================================

-- Automatically recalculates and updates the gpa_history table when marks are updated
create or replace function public.recalculate_gpa()
returns trigger as $$
declare
    avg_score numeric;
    calculated_gpa numeric(3, 2);
    target_student_id uuid;
    target_semester text;
begin
    if tg_op = 'DELETE' then
        target_student_id := old.student_id;
        target_semester := old.semester;
    else
        target_student_id := new.student_id;
        target_semester := new.semester;
    end if;

    -- Calculate average score for the specific student and semester
    select avg(score) into avg_score
    from public.marks
    where student_id = target_student_id and semester = target_semester;

    if avg_score is not null then
        -- Scale the 0-100 average score to a standard 0.00-4.00 GPA
        calculated_gpa := round((avg_score / 100.0) * 4.0, 2);

        -- Upsert into GPA history
        insert into public.gpa_history (student_id, semester, gpa, updated_at)
        values (target_student_id, target_semester, calculated_gpa, timezone('utc'::text, now()))
        on conflict (student_id, semester) do update
        set gpa = excluded.gpa,
            updated_at = timezone('utc'::text, now());
    else
        -- Clean up GPA history if no marks remain for this term
        delete from public.gpa_history
        where student_id = target_student_id and semester = target_semester;
    end if;

    return null;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_mark_change
    after insert or update or delete on public.marks
    for each row execute procedure public.recalculate_gpa();


-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) & HELPER FUNCTIONS
-- ==========================================

-- Helper function to fetch current user's role safely (handles recursion prevention)
-- Because it is SECURITY DEFINER, it bypasses RLS lookup loop recursion.
create or replace function public.get_user_role()
returns text as $$
    select role from public.users where id = auth.uid();
$$ language sql security definer set search_path = public;

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.marks enable row level security;
alter table public.gpa_history enable row level security;
alter table public.transcripts enable row level security;

-- --- Public.Users Policies ---
create policy "Allow select on profiles: own profile or teacher/admin role" on public.users
    for select using (
        auth.uid() = id
        or public.get_user_role() in ('teacher', 'admin')
    );

create policy "Allow update on profiles: owner or admin role" on public.users
    for update using (
        auth.uid() = id
        or public.get_user_role() = 'admin'
    );

-- --- Public.Marks Policies ---
create policy "Allow select on marks: own marks or teacher/admin role" on public.marks
    for select using (
        auth.uid() = student_id
        or public.get_user_role() in ('teacher', 'admin')
    );

create policy "Allow insert on marks: teacher/admin only" on public.marks
    for insert with check (
        public.get_user_role() in ('teacher', 'admin')
    );

create policy "Allow update on marks: teacher/admin only" on public.marks
    for update using (
        public.get_user_role() in ('teacher', 'admin')
    );

create policy "Allow delete on marks: teacher/admin only" on public.marks
    for delete using (
        public.get_user_role() in ('teacher', 'admin')
    );

-- --- Public.GPA_History Policies ---
create policy "Allow select on GPA history: own record or teacher/admin role" on public.gpa_history
    for select using (
        auth.uid() = student_id
        or public.get_user_role() in ('teacher', 'admin')
    );

-- GPA changes are handled strictly through the reactive trigger engine (which bypasses user RLS)
create policy "Allow write on GPA history: admin only" on public.gpa_history
    for all using (
        public.get_user_role() = 'admin'
    );

-- --- Public.Transcripts Policies ---
create policy "Allow select on transcripts: own transcripts or teacher/admin role" on public.transcripts
    for select using (
        auth.uid() = student_id
        or public.get_user_role() in ('teacher', 'admin')
    );

create policy "Allow insert on transcripts: owner (submitting) or teacher/admin role" on public.transcripts
    for insert with check (
        auth.uid() = student_id
        or public.get_user_role() in ('teacher', 'admin')
    );

create policy "Allow update on transcripts: owner (submitting revisions) or teacher/admin role" on public.transcripts
    for update using (
        auth.uid() = student_id
        or public.get_user_role() in ('teacher', 'admin')
    );

create policy "Allow delete on transcripts: teacher/admin only" on public.transcripts
    for delete using (
        public.get_user_role() in ('teacher', 'admin')
    );


-- ==========================================
-- 6. STORAGE BUCKETS & STORAGE RLS POLICIES
-- ==========================================

/*
  -------------------------------------------------------------
  STORAGE INSTRUCTIONS & DOCUMENTATION:
  -------------------------------------------------------------
  This migration programmatically sets up the storage buckets inside the `storage.buckets` table.
  
  To create these buckets manually:
  
  1. Via the Supabase Dashboard:
     - Navigate to Storage -> New Bucket.
     - Name: 'transcripts', set to "Private", toggle "Restrict file size" and set it to 10MB.
     - Name: 'screenshots', set to "Private", toggle "Restrict file size" and set it to 5MB.
     
  2. Via Supabase CLI (config.toml):
     Add the following configurations:
     ```toml
     [storage.buckets.transcripts]
     public = false
     file_size_limit = "10MiB"
     allowed_mime_types = ["application/pdf"]
     
     [storage.buckets.screenshots]
     public = false
     file_size_limit = "5MiB"
     allowed_mime_types = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
     ```
  -------------------------------------------------------------
*/

-- Programmatic creation of storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('transcripts', 'transcripts', false, 10485760, '{"application/pdf"}'),
  ('screenshots', 'screenshots', false, 5242880, '{"image/png", "image/jpeg", "image/jpg", "image/webp"}')
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Enable RLS on storage objects table (usually enabled, but standard protocol)
alter table storage.objects enable row level security;

-- Storage Policies for 'transcripts' bucket (files organized as 'transcripts/student_uuid/filename.pdf')
create policy "Allow owners to upload transcripts" on storage.objects
  for insert with check (
    bucket_id = 'transcripts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Allow owners and academic staff to read transcripts" on storage.objects
  for select using (
    bucket_id = 'transcripts'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.get_user_role() in ('teacher', 'admin')
    )
  );

create policy "Allow owners and academic staff to delete transcripts" on storage.objects
  for delete using (
    bucket_id = 'transcripts'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.get_user_role() in ('teacher', 'admin')
    )
  );

-- Storage Policies for 'screenshots' bucket (files organized as 'screenshots/student_uuid/filename.png')
create policy "Allow owners to upload screenshots" on storage.objects
  for insert with check (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Allow owners and academic staff to read screenshots" on storage.objects
  for select using (
    bucket_id = 'screenshots'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.get_user_role() in ('teacher', 'admin')
    )
  );

create policy "Allow owners and academic staff to delete screenshots" on storage.objects
  for delete using (
    bucket_id = 'screenshots'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.get_user_role() in ('teacher', 'admin')
    )
  );
