from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Wallet(Base):
    """
    Retailer's prepaid ledger. Strict constraints prevent overdrafting.
    """
    __tablename__ = "wallets"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    retailer_id = Column(String(36), ForeignKey("retailers.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # CheckConstraint guarantees DB will mathematically reject any transaction bringing balance below 0.
    balance = Column(Numeric(10, 2), default=0.00, nullable=False)
    currency = Column(String(3), default="USD")

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint('balance >= 0', name='wallet_balance_not_negative'),
    )

    # Relationships
    retailer = relationship("Retailer", lazy="select")
    transactions = relationship("Transaction", back_populates="wallet", cascade="all, delete-orphan")

class Transaction(Base):
    """
    Double-entry log for Wallet events.
    """
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    wallet_id = Column(String(36), ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    
    type = Column(String(50), nullable=False) # DEPOSIT, ORDER_PAYMENT, REFUND
    amount = Column(Numeric(10, 2), nullable=False) # Positive (Deposit) or Negative (Payment)
    status = Column(String(50), default="SUCCESS")
    
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    wallet = relationship("Wallet", back_populates="transactions")
    order = relationship("Order", lazy="select")

class Payout(Base):
    """
    Supplier's ledger of money owed by the platform.
    """
    __tablename__ = "payouts"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    amount = Column(Numeric(10, 2), nullable=False) # Owed to supplier
    status = Column(String(50), default="PENDING") # PENDING, PROCESSING, PAID
    reference_id = Column(String(255), nullable=True) # E.g., Bank transfer ID
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    supplier = relationship("Supplier", lazy="select")
    order = relationship("Order", lazy="select")
