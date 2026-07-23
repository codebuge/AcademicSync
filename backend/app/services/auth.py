from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.db.models import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    # Use Supabase JWT Secret if configured, else fall back to local Secret Key
    jwt_secret = settings.SUPABASE_JWT_SECRET or settings.SECRET_KEY
    
    try:
        payload = jwt.decode(
            token, jwt_secret, algorithms=["HS256"], options={"verify_aud": False}
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except (JWTError, ValueError):
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        # If user is valid in Supabase but profile row is missing in local DB, auto-sync on the fly
        email = payload.get("email", f"{user_id}@example.com")
        user_metadata = payload.get("user_metadata") or {}
        full_name = user_metadata.get("full_name") if isinstance(user_metadata, dict) else None
        current_semester = user_metadata.get("current_semester", 1) if isinstance(user_metadata, dict) else 1
        role = user_metadata.get("role", "student") if isinstance(user_metadata, dict) else "student"

        user = User(
            id=user_id,
            email=email,
            full_name=full_name,
            role=role if isinstance(role, str) else "student",
            current_semester=current_semester if isinstance(current_semester, int) else 1
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            user = db.query(User).filter(User.id == user_id).first()
            if user is None:
                raise credentials_exception
    return user

def require_role(roles: list[str]):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: role must be one of {roles}"
            )
        return current_user
    return dependency
