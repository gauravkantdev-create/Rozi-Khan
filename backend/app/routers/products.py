from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.product import (
    ProductCatalogCreate, ProductCatalogResponse,
    ProductCreate, ProductResponse,
    ProductVariantCreate, ProductVariantResponse,
    ProductImageCreate, ProductImageResponse
)
from app.services.product_service import ProductService
from app.middleware.auth import AuthorizeRoles

router = APIRouter(tags=["Products"])

# -----------------
# 1. CATALOG APIs
# -----------------
@router.post("/products/catalog", response_model=ProductCatalogResponse, status_code=status.HTTP_201_CREATED)
def create_catalog_item(
    data: ProductCatalogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    service = ProductService(db)
    return service.create_catalog_item(admin_user=current_user, data=data)

@router.get("/products/catalog", response_model=List[ProductCatalogResponse])
def get_catalog_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin", "retailer"))
):
    # Minimal read API for catalog
    service = ProductService(db)
    return service.repository.get_all_catalog_items()

# -----------------
# 2. SUPPLIER APIs
# -----------------
@router.post("/products/offers", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product_offer(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    service = ProductService(db)
    return service.create_product_offer(user=current_user, data=data)

@router.post("/products/offers/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
def add_product_variant(
    product_id: str,
    data: ProductVariantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    service = ProductService(db)
    return service.add_variant(user=current_user, product_id=product_id, data=data)

# -----------------
# 3. ADMIN APIs
# -----------------
@router.patch("/admin/products/{product_id}/status", response_model=ProductResponse)
def update_product_status(
    product_id: str,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    service = ProductService(db)
    return service.update_product_status(admin_user=current_user, product_id=product_id, new_status=new_status)

# -----------------
# 4. SUPPLIER GET & UPDATE APIs
# -----------------
@router.get("/products/offers", response_model=List[ProductResponse])
def list_my_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier"))
):
    service = ProductService(db)
    return service.get_supplier_offers(user=current_user)

@router.get("/products/offers/{product_id}", response_model=ProductResponse)
def get_offer_details(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "retailer", "admin"))
):
    service = ProductService(db)
    return service.get_supplier_offer(user=current_user, product_id=product_id)

@router.get("/products/offers/{product_id}/variants", response_model=List[ProductVariantResponse])
def list_offer_variants(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "retailer", "admin"))
):
    service = ProductService(db)
    return service.get_offer_variants(user=current_user, product_id=product_id)

@router.delete("/products/offers/{product_id}/variants/{variant_id}")
def delete_variant(
    product_id: str,
    variant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    service = ProductService(db)
    return service.delete_variant(user=current_user, product_id=product_id, variant_id=variant_id)

@router.delete("/products/offers/{product_id}")
def archive_offer(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    service = ProductService(db)
    return service.archive_offer(user=current_user, product_id=product_id)
