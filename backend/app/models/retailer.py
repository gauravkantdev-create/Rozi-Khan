from sqlalchemy import Column, String, ForeignKey, DateTime, func, Boolean, Float
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Retailer(Base):
    __tablename__ = "retailers"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    store_name = Column(String(255), nullable=False)
    business_registration_number = Column(String(100))
    status = Column(String(50), default="ACTIVE") # ACTIVE, SUSPENDED
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # String-based mappings to prevent circular dependencies
    user = relationship("User", backref="retailer_profile")
    settings = relationship("RetailerSetting", back_populates="retailer", uselist=False, cascade="all, delete-orphan")
    subscription = relationship("RetailerSubscription", back_populates="retailer", uselist=False, cascade="all, delete-orphan")

class RetailerSetting(Base):
    __tablename__ = "retailer_settings"
    
    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    retailer_id = Column(String(36), ForeignKey("retailers.id", ondelete="CASCADE"), unique=True, index=True)
    default_profit_margin_percent = Column(Float, default=20.0)
    auto_sync_inventory = Column(Boolean, default=True)

    retailer = relationship("Retailer", back_populates="settings")

class RetailerSubscription(Base):
    __tablename__ = "retailer_subscriptions"
    
    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    retailer_id = Column(String(36), ForeignKey("retailers.id", ondelete="CASCADE"), unique=True, index=True)
    plan_name = Column(String(50), default="FREE") # FREE, PRO, ENTERPRISE
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)

    retailer = relationship("Retailer", back_populates="subscription")
