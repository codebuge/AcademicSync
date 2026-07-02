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
        # If user is valid in Supabase but doesn't exist in our public profiles yet,
        # we can sync them on the fly if needed, or raise exception.
        # Let's check: during tests or first login, we might want to sync.
        # But generally they should exist via trigger on Postgres. For local tests:
        # we will ensure the test setup creates the user.
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
