from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    category = Column(String(100), nullable=False)
    stock = Column(Integer, default=0)
    ratings = Column(Numeric(3, 2), default=0.0)
    num_reviews = Column(Integer, default=0)
    supplier = Column(String(255), nullable=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", lazy="joined")
    reviews = relationship("ProductReview", back_populates="product", cascade="all, delete-orphan", lazy="joined")
    creator = relationship("User", lazy="select")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(String(36), primary_key=True, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship
    product = relationship("Product", back_populates="images")


class ProductReview(Base):
    __tablename__ = "product_reviews"

    id = Column(String(36), primary_key=True, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False) # reviewer name cached for quick loading
    rating = Column(Integer, nullable=False)
    comment = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationship
    product = relationship("Product", back_populates="reviews")
    user = relationship("User", lazy="select")
