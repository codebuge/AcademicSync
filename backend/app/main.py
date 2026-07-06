from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.db.session import engine
from app.db.models import Base
from app.api.endpoints import router as api_router

# Initialize Database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"WARNING: Database table creation failed on startup: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for GPA Tracking, Transcript Parsing, and Grade Verification",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration: parse ALLOWED_ORIGINS env variable (comma-separated, no wildcards)
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]

# Add common local development origins to allow testing
for dev_origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
    if dev_origin not in origins:
        origins.append(dev_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health Check"])
def read_root():
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "api_docs": "/docs"
    }

@app.get("/health", tags=["Health Check"])
def health_check():
    return {
        "status": "ok"
    }
