from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class ReviewCreateRequest(BaseModel):
    rating: int
    comment: str

class ReviewResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user: str = Field(..., alias="user") # Mongo user id string
    name: str
    rating: int
    comment: str
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True

    @field_validator('user', mode='before')
    @classmethod
    def convert_user(cls, value):
        if hasattr(value, 'id'):
            return value.id
        return str(value)


class ProductCreateRequest(BaseModel):
    name: str
    description: str
    price: float
    category: str
    images: Optional[List[str]] = []
    stock: Optional[int] = 0
    supplier: Optional[str] = None


class ProductResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    description: str
    price: Decimal
    category: str
    images: List[str]
    stock: int
    ratings: Decimal
    reviews: List[ReviewResponse]
    numReviews: int = Field(..., alias="num_reviews")
    supplier: Optional[str] = None
    createdBy: Optional[str] = Field(None, alias="created_by")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True

    @field_validator('images', mode='before')
    @classmethod
    def convert_images(cls, value):
        if not value:
            return []
        # If it's already a list of strings
        if isinstance(value[0], str):
            return value
        # If it's a list of ProductImage SQLAlchemy objects
        return [img.image_url for img in value]

    @field_validator('createdBy', mode='before')
    @classmethod
    def convert_created_by(cls, value):
        if not value:
            return None
        if hasattr(value, 'id'):
            return value.id
        return str(value)


class ProductListResponse(BaseModel):
    success: bool
    page: int
    pages: int
    totalProducts: int
    products: List[ProductResponse]
