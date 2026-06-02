from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    # Shipping Address Details
    shipping_fullname = Column(String(255), nullable=False)
    shipping_email = Column(String(255), nullable=True)
    shipping_phone = Column(String(50), nullable=True)
    shipping_address = Column(String, nullable=False)
    shipping_city = Column(String(100), nullable=False)
    shipping_state = Column(String(100), nullable=False)
    shipping_postalcode = Column(String(50), nullable=False)
    shipping_country = Column(String(100), default="India")

    # Billing Address Details
    billing_fullname = Column(String(255), nullable=False)
    billing_email = Column(String(255), nullable=True)
    billing_phone = Column(String(50), nullable=True)
    billing_address = Column(String, nullable=False)
    billing_city = Column(String(100), nullable=False)
    billing_state = Column(String(100), nullable=False)
    billing_postalcode = Column(String(50), nullable=False)
    billing_country = Column(String(100), default="India")

    # Razorpay Payment Fields
    razorpay_order_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    razorpay_signature = Column(String(255), nullable=True)

    # General Payment Details
    payment_method = Column(String(50), default="Razorpay")
    payment_status = Column(String(50), default="Paid") # Pending, Paid, Failed
    
    # Order Status
    status = Column(String(50), default="Pending") # Pending, Processing, Shipped, Delivered, Cancelled
    cancel_reason = Column(String, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    # Financial Totals
    items_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    platform_fee = Column(Numeric(10, 2), nullable=False, default=0.00)
    shipping_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    discount = Column(Numeric(10, 2), nullable=False, default=0.00)
    total_price = Column(Numeric(10, 2), nullable=False, default=0.00)

    # Delivery Estimate
    delivery_estimate = Column(String(100), default="5-8 business days")

    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", lazy="joined")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="joined")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan", lazy="joined")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(36), primary_key=True, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(36), nullable=True) # can represent deleted or external product
    name = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    image = Column(String, nullable=True)
    category = Column(String(100), nullable=True)
    supplier = Column(String(255), default="RoziKhan Verified Supplier")
    quantity = Column(Integer, nullable=False, default=1)

    # Relationship
    order = relationship("Order", back_populates="order_items")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_histories"

    id = Column(String(36), primary_key=True, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)
    note = Column(String, nullable=True)
    changed_at = Column(DateTime, server_default=func.now())

    # Relationship
    order = relationship("Order", back_populates="status_history")
