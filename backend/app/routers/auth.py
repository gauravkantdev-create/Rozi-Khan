from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    SendOtpRequest,
    RegisterRequest,
    LoginRequest,
    UserProfileResponse,
    AuthSuccessResponse,
    LoginSuccessResponse,
    StandardResponse,
)
from app.services.auth import (
    send_register_otp_service,
    register_user_service,
    login_user_service,
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp(req_data: SendOtpRequest, db: Session = Depends(get_db)):
    result = send_register_otp_service(req_data.email, db)
    return result

@router.post("/register", response_model=AuthSuccessResponse, status_code=status.HTTP_201_CREATED)
def register(req_data: RegisterRequest, db: Session = Depends(get_db)):
    result = register_user_service(
        name=req_data.name,
        email=req_data.email,
        password=req_data.password,
        otp=req_data.otp,
        db=db
    )
    return result

@router.post("/login", response_model=LoginSuccessResponse, status_code=status.HTTP_200_OK)
def login(req_data: LoginRequest, db: Session = Depends(get_db)):
    result = login_user_service(
        email=req_data.email,
        password=req_data.password,
        db=db
    )
    return result

@router.get("/profile", response_model=AuthSuccessResponse, status_code=status.HTTP_200_OK)
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "message": "Welcome to protected profile route 🔥",
        "user": current_user
    }
