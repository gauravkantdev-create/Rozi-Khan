from pydantic import BaseModel, constr
from typing import Optional, List
from datetime import datetime

class ProductVariantBase(BaseModel):
    sku_code: constr(min_length=3, max_length=100)
    wholesale_price: float
    attributes: Optional[str] = None # JSON string e.g. {"color": "red"}

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariantResponse(ProductVariantBase):
    id: str
    product_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductImageBase(BaseModel):
    image_url: str
    is_primary: bool = False

class ProductImageCreate(ProductImageBase):
    pass

class ProductImageResponse(ProductImageBase):
    id: str
    product_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProductCatalogBase(BaseModel):
    name: constr(min_length=2, max_length=255)
    description: str
    category: str
    brand: Optional[str] = None

class ProductCatalogCreate(ProductCatalogBase):
    pass

class ProductCatalogResponse(ProductCatalogBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    catalog_id: str

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    status: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    supplier_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    catalog: Optional[ProductCatalogResponse] = None
    variants: List[ProductVariantResponse] = []
    images: List[ProductImageResponse] = []

    class Config:
        from_attributes = True
