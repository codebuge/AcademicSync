import os
from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Summer GPA Tracker & Transcript Parser"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeythatnobodywillguess1234567890!@#")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./gpa_tracker.db")
    
    # Supabase config
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", None)
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY", None)
    SUPABASE_JWT_SECRET: Optional[str] = os.getenv("SUPABASE_JWT_SECRET", None)
    
    # OCR & Google Vision
    GOOGLE_VISION_API_KEY: Optional[str] = os.getenv("GOOGLE_VISION_API_KEY", None)
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", None)
    
    # Redis for rate limiting
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL", None)
    
    # CORS allowed origins
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    
    # Environment
    RAILWAY_ENVIRONMENT: Optional[str] = os.getenv("RAILWAY_ENVIRONMENT", None)

    class Config:
        case_sensitive = True

settings = Settings()
