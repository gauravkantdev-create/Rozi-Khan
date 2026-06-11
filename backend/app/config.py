import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PORT: int = 5000
    DATABASE_URL: str = "sqlite:///./dev.db"
    JWT_SECRET: str = "supersecretjwttokenforrozikhanapplicationdevelopment"
    RESEND_API_KEY: Optional[str] = None
    RESEND_FROM_EMAIL: str = "RoziKhan <onboarding@resend.dev>"
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    NODE_ENV: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
