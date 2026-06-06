from sqlalchemy import Column, String, ForeignKey, DateTime, func, Boolean, Integer
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    company_name = Column(String(255), nullable=False)
    tax_id = Column(String(100))
    verification_status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED
    warehouse_address = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # String-based relationship mappings to prevent circular dependency
    user = relationship("User", backref="supplier_profile")
    documents = relationship("SupplierDocument", back_populates="supplier", cascade="all, delete-orphan")
    settings = relationship("SupplierSetting", back_populates="supplier", uselist=False, cascade="all, delete-orphan")


class SupplierDocument(Base):
    __tablename__ = "supplier_documents"
    
    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="CASCADE"), index=True)
    document_type = Column(String(100), nullable=False) # e.g., 'BUSINESS_REGISTRATION', 'TAX_ID', 'BANK_DETAILS'
    file_url = Column(String(1000), nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now())

    supplier = relationship("Supplier", back_populates="documents")


class SupplierSetting(Base):
    __tablename__ = "supplier_settings"
    
    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="CASCADE"), unique=True, index=True)
    auto_accept_orders = Column(Boolean, default=True)
    dispatch_sla_days = Column(Integer, default=2)

    supplier = relationship("Supplier", back_populates="settings")
