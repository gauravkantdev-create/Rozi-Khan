from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class SendOtpRequest(BaseModel):
    email: EmailStr

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    otp: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfileResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: str
    role: str
    isEmailVerified: bool = Field(..., alias="is_email_verified")

    class Config:
        populate_by_name = True
        from_attributes = True

class AuthSuccessResponse(BaseModel):
    success: bool
    message: str
    user: UserProfileResponse

    class Config:
        populate_by_name = True
        from_attributes = True

class LoginSuccessResponse(BaseModel):
    success: bool
    message: str
    token: str
    user: UserProfileResponse

    class Config:
        populate_by_name = True
        from_attributes = True

class StandardResponse(BaseModel):
    success: bool
    message: str
