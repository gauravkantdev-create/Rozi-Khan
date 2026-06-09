from sqlalchemy import Column, String, ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class PlatformIntegration(Base):
    """
    Stores connection credentials for Retailer third-party channels (Shopify, WooCommerce, etc.)
    """
    __tablename__ = "platform_integrations"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    retailer_id = Column(String(36), ForeignKey("retailers.id", ondelete="CASCADE"), nullable=False, index=True)
    platform_name = Column(String(50), nullable=False) # e.g., "shopify"
    shop_url = Column(String(255), nullable=False)     # e.g., "my-store.myshopify.com"
    access_token = Column(String(500), nullable=False) # In production, this should be KMS encrypted
    status = Column(String(50), default="ACTIVE")      # ACTIVE, DISCONNECTED, ERROR
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('retailer_id', 'platform_name', 'shop_url', name='uix_retailer_platform_shop'),
    )

    # Relationships
    retailer = relationship("Retailer", lazy="select")
