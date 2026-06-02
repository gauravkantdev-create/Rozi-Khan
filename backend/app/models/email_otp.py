from sqlalchemy import Column, String, Boolean, DateTime, func
from app.database import Base

class EmailOtp(Base):
    __tablename__ = "email_otps"

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    otp = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
