import pytest
import os
import base64
import httpx
from dataclasses import dataclass, field
from PIL import Image, ImageDraw
from fpdf import FPDF

# Configure DATABASE_URL for tests
TEST_DB_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")
os.environ["DATABASE_URL"] = TEST_DB_URL
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest-only"
os.environ["SUPABASE_JWT_SECRET"] = "test-secret-key-for-pytest-only"

from app.main import app
from app.db.session import Base, engine

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
if not API_BASE_URL.startswith("http://") and not API_BASE_URL.startswith("https://"):
    API_BASE_URL = f"http://{API_BASE_URL}"

@dataclass
class TestContext:
    student_token: str = ""
    student_id: str = ""
    student_email: str = ""
    student_password: str = ""
    student_b_token: str = ""
    student_b_id: str = ""
    student_b_email: str = ""
    student_b_password: str = ""
    mark_ids: list = field(default_factory=list)
    transcript_id: str = ""

@pytest.fixture(scope="session")
def ctx() -> TestContext:
    """Shared state across all test phases"""
    return TestContext()

@pytest.fixture(scope="session")
def event_loop():
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def client():
    # Use AsyncClient for E2E tests
    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=30.0) as c:
        yield c

@pytest.fixture(scope="session", autouse=True)
def generate_fixtures():
    """Create sample_grades.png, blurry_grades.png, sample_transcript.pdf before tests run"""
    fixtures_dir = os.path.join(os.path.dirname(__file__), "fixtures")
    os.makedirs(fixtures_dir, exist_ok=True)
    
    # 1. Clear grades table PNG
    img = Image.new("RGB", (400, 200), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10, 10), "Course Name | Credits | Score | Grade", fill=(0, 0, 0))
    d.text((10, 40), "Introduction to CS | 3.0 | 95.0 | A", fill=(0, 0, 0))
    d.text((10, 70), "Calculus I | 4.0 | 88.0 | B", fill=(0, 0, 0))
    d.text((10, 100), "English Composition II | 3.0 | 91.0 | A-", fill=(0, 0, 0))
    img.save(os.path.join(fixtures_dir, "sample_grades.png"))
    
    # 2. Blurry grades table PNG with low_confidence marker
    img_blurry = Image.new("RGB", (400, 200), color=(255, 255, 255))
    d_blurry = ImageDraw.Draw(img_blurry)
    d_blurry.text((10, 10), "Course Name | Credits | Score | Grade", fill=(0, 0, 0))
    d_blurry.text((10, 40), "Chemistry I | 4.0 | 75.0 | C", fill=(0, 0, 0))
    d_blurry.text((10, 70), "Physics I | 4.0 | 82.0 | B", fill=(0, 0, 0))
    img_path = os.path.join(fixtures_dir, "blurry_grades.png")
    img_blurry.save(img_path)
    
    # Append low_confidence bytes to blurry_grades.png
    with open(img_path, "ab") as f:
        f.write(b"\nlow_confidence\n")
        
    # 3. Create sample_transcript.pdf
    pdf_path = os.path.join(fixtures_dir, "sample_transcript.pdf")
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)
    pdf.cell(200, 10, txt="Semester 1", ln=True, align="C")
    pdf.cell(200, 10, txt="DS101 Data Structures 3.0 B+", ln=True)
    pdf.cell(200, 10, txt="AL101 Algorithms 3.0 A", ln=True)
    pdf.cell(200, 10, txt="OS101 Operating Systems 3.0 C", ln=True)
    pdf.cell(200, 10, txt="CA101 Calculus 2.0 D", ln=True)
    pdf.cell(200, 10, txt="EN101 English 1.0 A+", ln=True)
    pdf.output(pdf_path)
    return

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables once per test session."""
    Base.metadata.create_all(bind=engine)
