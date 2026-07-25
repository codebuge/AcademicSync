from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
from app.core.config import settings
from app.db.session import engine
from app.db.models import Base
from app.api.endpoints import router as api_router
from app.services.semester_guard import SemesterGuardBlocked

logger = logging.getLogger(__name__)

# Startup validation: Ensure JWT signing secret is configured
if not (settings.SUPABASE_JWT_SECRET or settings.SECRET_KEY):
    raise RuntimeError("Critical Configuration Error: Neither SUPABASE_JWT_SECRET nor SECRET_KEY is set.")

# Initialize Database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.warning(f"Database table creation failed on startup: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for GPA Tracking, Transcript Parsing, and Grade Verification",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.exception_handler(SemesterGuardBlocked)
async def semester_guard_blocked_handler(request: Request, exc: SemesterGuardBlocked):
    return JSONResponse(
        status_code=403,
        content={"detail": exc.detail, "code": exc.code}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, (HTTPException, StarletteHTTPException)):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None)
        )
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors()}
        )
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "code": "INTERNAL_ERROR"}
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
