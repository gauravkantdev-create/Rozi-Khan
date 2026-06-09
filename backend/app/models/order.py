from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Order(Base):
    """
    Represents a fulfillment order routed to a specific Supplier.
    If a Retailer cart has items from multiple suppliers, it is split into multiple Orders.
    """
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    retailer_id = Column(String(36), ForeignKey("retailers.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Optional reference to the external platform (e.g., Shopify Order #1001)
    retailer_order_reference = Column(String(100), nullable=True)
    
    status = Column(String(50), default="PENDING") # PENDING, AWAITING_PAYMENT, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    shipping_address = Column(JSONB, nullable=False) # Name, Address, City, Zip, Country, Phone
    tracking_number = Column(String(255), nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=False) # Sum of items' wholesale prices
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    retailer = relationship("Retailer", lazy="select")
    supplier = relationship("Supplier", lazy="select")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    """
    Line items within an Order.
    """
    __tablename__ = "order_items"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = Column(String(36), ForeignKey("product_variants.id", ondelete="RESTRICT"), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    wholesale_price_at_order = Column(Numeric(10, 2), nullable=False) # Immutable snapshot of price
    
    # Relationships
    order = relationship("Order", back_populates="items")
    variant = relationship("ProductVariant", lazy="select")

class OrderStatusHistory(Base):
    """
    Audit trail for order state changes.
    """
    __tablename__ = "order_status_history"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    changed_by = Column(String(50), nullable=False) # 'System', 'Retailer', 'Supplier'
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="status_history")
