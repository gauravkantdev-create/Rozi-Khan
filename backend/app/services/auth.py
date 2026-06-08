import datetime
import random
import jwt
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.config import settings
from app.models.user import User
from app.models.email_otp import EmailOtp
from app.services.email import send_otp_email
from app.utils.helpers import (
    generate_object_id,
    is_strong_password,
    normalize_email,
    is_valid_email,
)
from app.utils.roles import get_user_role

pwd_context = CryptContext(schemes=["bcrypt", "sha256_crypt"], deprecated="auto")

def hash_password(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception:
        # Fallback for local development environments where bcrypt may be unavailable
        from passlib.hash import sha256_crypt
        return sha256_crypt.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def generate_otp() -> str:
    return str(random.randint(100000, 999999))

def send_register_otp_service(email: str, db: Session):
    normalized = normalize_email(email)
    
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
        
    if not is_valid_email(normalized):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address"
        )
        
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == normalized).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists with this email"
        )
        
    # Generate OTP
    otp = generate_otp()
    
    # Delete prior OTPs
    db.query(EmailOtp).filter(EmailOtp.email == normalized).delete()
    
    # Create new OTP record (10 mins expiration)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    otp_record = EmailOtp(
        id=generate_object_id(),
        email=normalized,
        otp=otp,
        expires_at=expires_at,
        verified=False
    )
    
    db.add(otp_record)
    db.commit()
    
    # Print to console for easy local debugging/testing
    print(f"\n[DEV MODE] OTP generated for {normalized}: {otp}\n")
    
    # Send email
    send_otp_email(normalized, otp)
    
    return {
        "success": True,
        "message": "OTP sent to your email. Please verify before registration.",
        "provider": "resend"
    }

def register_user_service(name: str, email: str, password: str, otp: str, db: Session):
    normalized = normalize_email(email)
    
    if not name or not normalized or not password or not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide name, email, OTP, and password"
        )
        
    if not is_valid_email(normalized):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address"
        )
        
    if not is_strong_password(password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
        )
        
    # Check user existence
    existing_user = db.query(User).filter(User.email == normalized).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists with this email"
        )
        
    # Verify OTP
    now = datetime.datetime.utcnow()
    otp_record = db.query(EmailOtp).filter(
        EmailOtp.email == normalized,
        EmailOtp.otp == otp,
        EmailOtp.verified == False,
        EmailOtp.expires_at > now
    ).first()
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP. Please verify your email again."
        )
        
    # Create user
    hashed = hash_password(password)
    user = User(
        id=generate_object_id(),
        name=name,
        email=normalized,
        password=hashed,
        role="user",
        is_email_verified=True
    )
    
    db.add(user)
    
    # Mark OTP as verified
    otp_record.verified = True
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "message": "User registered successfully",
        "user": user
    }

def login_user_service(email: str, password: str, db: Session):
    normalized = normalize_email(email)
    
    if not normalized or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide email and password"
        )
        
    user = db.query(User).filter(User.email == normalized).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # During development, allow login even if email is not verified.
    if not user.is_email_verified and settings.NODE_ENV != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before login"
        )
        
    # Ensure password length does not exceed bcrypt's 72‑byte limit
    # Encode to bytes, truncate, then decode back to string
    password_bytes = password.encode('utf-8')[:72]
    password = password_bytes.decode('utf-8', errors='ignore')
    if not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
        
    role = get_user_role(user)
    
    # Create JWT Token (expires in 7 days)
    payload = {
        "id": user.id,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
    
    # We return the JWT token string. If it's a bytes object (depending on PyJWT version), we decode it.
    if isinstance(token, bytes):
        token = token.decode("utf-8")
        
    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": user
    }
