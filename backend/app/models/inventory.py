from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class InventoryLedger(Base):
    """
    Dedicated stock tracking table for Product Variants.
    Separated from the core Product Domain to handle concurrency and multi-warehouse scaling.
    """
    __tablename__ = "inventory_ledgers"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = Column(String(36), ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    warehouse_id = Column(String(100), default="DEFAULT", index=True)
    
    quantity_available = Column(Integer, default=0, nullable=False)
    quantity_allocated = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="OUT_OF_STOCK") # IN_STOCK, OUT_OF_STOCK
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint('quantity_available >= 0', name='check_qty_available_positive'),
        CheckConstraint('quantity_allocated >= 0', name='check_qty_allocated_positive'),
    )

    # Relationships
    supplier = relationship("Supplier", lazy="select")
    variant = relationship("ProductVariant", back_populates="ledger", lazy="select")
