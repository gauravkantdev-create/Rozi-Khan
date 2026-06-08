from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class RetailerListing(Base):
    """
    Retailer's Projection / Snapshot of a Supplier's Product Offer.
    This acts as the bridge before pushing to external integrations (like Shopify).
    """
    __tablename__ = "retailer_listings"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    retailer_id = Column(String(36), ForeignKey("retailers.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # The immutable cache of the product at time of import
    snapshot_data = Column(JSONB, nullable=False)
    
    # Retailer's custom overrides
    retail_price_override = Column(Numeric(10, 2), nullable=True)
    
    # Sync status
    sync_status = Column(String(50), default="PENDING") # PENDING, SYNCED, FAILED, PAUSED
    last_synced_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (
        UniqueConstraint('retailer_id', 'product_id', name='uix_retailer_product_import'),
    )

    # Relationships
    retailer = relationship("Retailer", lazy="select")
    product = relationship("Product", lazy="select")
