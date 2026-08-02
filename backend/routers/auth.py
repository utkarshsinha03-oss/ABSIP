from backend.auth.dependency import (
    get_current_user,
    admin_required
)
from backend.models.schemas import UserResponse
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from backend.db import SessionLocal
from backend.models import User
from backend.models.schemas import UserCreate, UserLogin
from backend.auth.security import hash_password, verify_password
from backend.auth.jwt_handler import create_access_token


router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User)
        .filter(
            (User.username == user.username) |
            (User.email == user.email)
        )
        .first()
    )

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "id": new_user.id
    }

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    db_user = (
        db.query(User)
        .filter(User.username == form_data.username)
        .first()
    )

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(
        form_data.password,
        db_user.hashed_password
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
    {
        "id": db_user.id,
        "sub": db_user.username,
        "role": db_user.role
    }
)
    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user  



@router.get("/admin")
def admin_only(
    current_user: User = Depends(admin_required)
):
    return {
        "message": f"Welcome Admin {current_user.username}"
    }      