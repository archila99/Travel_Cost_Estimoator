from datetime import datetime, timedelta
import logging
import os
from dotenv import load_dotenv

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, User as UserSchema, Token

load_dotenv()
logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-dev")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter(tags=["auth"])

def verify_password(plain_password, hashed_password):
    """Verify password; return False on any error to avoid process crash (e.g. invalid hash)."""
    if not hashed_password or not isinstance(hashed_password, str):
        return False
    # Avoid passing non-bcrypt data to passlib (can cause SIGABRT in C extension)
    if not hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
        logger.warning("Invalid hash format (not bcrypt)")
        return False
    try:
        if isinstance(plain_password, str):
            plain_password = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.warning("Password verification failed: %s", e)
        return False

def get_password_hash(password):
    # Manually truncate to 72 bytes for bcrypt compatibility
    if isinstance(password, str):
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=UserSchema)
def register(
    user: UserCreate, 
    db: Session = Depends(get_db),
    registration_key: str = Query(None, alias="key", description="Registration key if required by server")
):
    # Check if registration is restricted
    env_key = os.getenv("REGISTRATION_KEY")
    if env_key and env_key != registration_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Registration is restricted. Please provide a valid registration key."
        )
        
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == form_data.username).first()
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "Login /token failed: %s: %s. Check DATABASE_URL, Cloud SQL connection, and SECRET_KEY.",
            type(e).__name__,
            e,
        )
        raise
