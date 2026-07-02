# 🎓 AcademicSync — CGPA & GPA Academic Tracker

AcademicSync is a modern, responsive full-stack university academic tracker featuring OCR-powered grading scale extraction at signup, semester-aware guard logic, transcript reconciliation, and future CGPA projections.

Converted from a Flutter + SQLite mobile app to a **Next.js 14 App Router + FastAPI + Supabase** web application.

---

## 📁 Project Structure

```
d:/summer/
├── backend/              # FastAPI REST API (Python)
│   ├── app/
│   │   ├── api/          # API route handlers (endpoints.py)
│   │   ├── core/         # Settings and configurations (config.py)
│   │   ├── db/           # Database connections and SQLAlchemy models
│   │   ├── models/       # Pydantic validation schemas (schemas.py)
│   │   └── services/     # Business logic modules
│   │       ├── auth.py          # Supabase JWT decoding and role checking
│   │       ├── calculations.py  # GPA, CGPA & Future GPA Projection formulas
│   │       ├── ocr.py           # Google Vision document parsing & custom scale OCR
│   │       ├── pdf_parser.py    # PDF transcript parser & reconciliation logic
│   │       └── semester_guard.py# Block rules for transcripts (Semester 1 lock)
│   └── tests/            # Pytest suite (conftest, integration, calculations)
│
├── frontend/             # Next.js 14 App Router Web App (TypeScript)
│   ├── app/              # Routes (Dashboard, Marks, Transcript, Analysis, Auth)
│   ├── components/       # Custom React components (charts, uploads, tables)
│   │   └── ui/           # Radix-based shadcn UI primitives
│   ├── lib/              # Supabase browser client, API wrappers, utility helpers
│   ├── store/            # Unified Zustand state management
│   └── types/            # TypeScript schemas matching backend models
│
└── supabase/             # Supabase Config & Database migrations
    └── migrations/
        ├── 001_initial_schema.sql  # User, marks, transcript tables
        └── 002_FIXES.SQL           # Per-user grading scale, STABLE isolation, GPA triggers
```

---

## 🧠 Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, Recharts | Premium dark mode web portal with glassmorphic cards, custom scrollbars, and micro-animations. |
| **Backend** | FastAPI, Python 3.10+, SQLAlchemy | REST API layer handling OCR image extraction, PDF ingestion, and projections. |
| **Database** | Supabase (PostgreSQL) | Primary data layer using Row Level Security (RLS) policies, PL/pgSQL database calculation triggers, and Auth. |
| **OCR / Ingestion** | Google Vision API, pdfplumber | Parses grades/credits from transcripts and parses grading scale tables at signup. |

---

## ⚙️ Backend Setup & Run

### 1. Install Dependencies
Make sure you run using a system Python installation:
```bash
cd backend
C:\python\python.exe -m pip install -r requirements.txt
```

### 2. Configure Environment
Create a `.env` file inside `backend/` from `.env.example`:
```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
GOOGLE_VISION_API_KEY=your-google-cloud-vision-api-key
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Run FastAPI Dev Server
```bash
$env:PYTHONPATH = "."
uvicorn app.main:app --reload
```
Interactive docs will load at [http://localhost:8000/docs](http://localhost:8000/docs).

### 4. Running Backend Tests
Ensure your python command uses the correct system path:
```bash
C:\python\python.exe -m pytest
```

---

## 🌐 Frontend Setup & Run

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Create a `.env.local` file inside `frontend/`:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build Production Bundle
```bash
npm run build
```

---

## 🗄️ Database & Grading Scale Logic

### 1. Per-User Grading Scale
During signup, users upload a screenshot of their university's grading scale.
- If OCR parses it successfully, rows are mapped to `public.grading_scale_rows` linked to the user's UUID.
- **Failures are handled explicitly**:
  - `GRADING_SCALE_LOW_CONFIDENCE`: Displays an amber caution retry screen with image capture tips and a reference photo.
  - `GRADING_SCALE_MALFORMED`: Displays a red warning screen outlining table criteria (Range → Letter → Points).

### 2. Semester Guard Ingestion Rules
- **Semester 1**: PDF transcript uploads are locked. Only manual/OCR mark creation is enabled.
- **Semester 2+**: Transcript PDF uploads unlock, triggering a cross-check verification. Existing draft marks matching course names are automatically promoted to `verified` and updated with authoritative transcript values.
