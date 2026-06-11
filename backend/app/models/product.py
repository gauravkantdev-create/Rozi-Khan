from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, DateTime, func, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class ProductCatalog(Base):
    """
    Master Product Database (System Owned)
    e.g., 'Apple iPhone 14'
    """
    __tablename__ = "product_catalog"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(String, nullable=False)
    category = Column(String(100), nullable=False)
    brand = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 1:N -> Product (Supplier Listings)
    supplier_listings = relationship("Product", back_populates="catalog", cascade="all, delete-orphan")


class Product(Base):
    """
    Product Offer (Supplier Owned)
    The specific wholesale contract for a catalog item.
    """
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    catalog_id = Column(String(36), ForeignKey("product_catalog.id", ondelete="CASCADE"), nullable=False)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="DRAFT") # DRAFT, PENDING_APPROVAL, ACTIVE, PAUSED, OUT_OF_STOCK, DISABLED, ARCHIVED
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    catalog = relationship("ProductCatalog", back_populates="supplier_listings")
    supplier = relationship("Supplier", lazy="select") # Assuming string-based or lazy load if supplier not imported to avoid circular
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    """
    Specific SKUs attached to the Supplier's Product Offer.
    Inventory connects to this ID in the future.
    """
    __tablename__ = "product_variants"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    sku_code = Column(String(100), nullable=False, unique=True, index=True)
    wholesale_price = Column(Numeric(10, 2), nullable=False)
    attributes = Column(String, nullable=True) # e.g., JSON string '{"color": "Red", "size": "L"}'
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="variants")
    ledger = relationship("InventoryLedger", back_populates="variant", uselist=False)


class ProductImage(Base):
    """
    Supplier's specific images for their offer.
    """
    __tablename__ = "product_images"

    id = Column(String(36), primary_key=True, index=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship
    product = relationship("Product", back_populates="images")
