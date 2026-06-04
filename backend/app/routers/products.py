from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.middleware.auth import get_current_user, AuthorizeRoles
from app.models.user import User
from app.schemas.product import (
    ProductCreateRequest,
    ProductResponse,
    ProductListResponse,
    ReviewCreateRequest,
)
from app.services.product import (
    create_product_service,
    get_products_service,
    get_single_product_service,
    update_product_service,
    delete_product_service,
    create_product_review_service,
)

router = APIRouter(prefix="/products", tags=["products"])

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_product(
    req_data: ProductCreateRequest,
    current_user: User = Depends(AuthorizeRoles("admin")),
    db: Session = Depends(get_db)
):
    product = create_product_service(req_data, current_user.id, db)
    # Serialize product with ProductResponse schema
    return {
        "success": True,
        "message": "Product created successfully",
        "product": ProductResponse.model_validate(product)
    }

@router.get("/", response_model=ProductListResponse)
def get_products(
    keyword: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: Optional[int] = Query(8),
    page: Optional[int] = Query(1),
    db: Session = Depends(get_db)
):
    return get_products_service(
        keyword=keyword,
        category=category,
        limit=limit,
        page=page,
        db=db
    )

@router.get("/{id}", response_model=dict)
def get_single_product(id: str, db: Session = Depends(get_db)):
    product = get_single_product_service(id, db)
    return {
        "success": True,
        "product": ProductResponse.model_validate(product)
    }

@router.put("/{id}", response_model=dict)
def update_product(
    id: str,
    req_data: dict, # Let's accept raw dict to support partial updates easily
    current_user: User = Depends(AuthorizeRoles("admin")),
    db: Session = Depends(get_db)
):
    product = update_product_service(id, req_data, db)
    return {
        "success": True,
        "message": "Product updated successfully",
        "product": ProductResponse.model_validate(product)
    }

@router.delete("/{id}", response_model=dict)
def delete_product(
    id: str,
    current_user: User = Depends(AuthorizeRoles("admin")),
    db: Session = Depends(get_db)
):
    return delete_product_service(id, db)

@router.post("/{id}/reviews", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_review(
    id: str,
    req_data: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = create_product_review_service(
        product_id=id,
        req_data=req_data,
        user_id=current_user.id,
        user_name=current_user.name,
        db=db
    )
    return {
        "success": True,
        "message": result["message"],
        "product": ProductResponse.model_validate(result["product"]),
        "review": result["review"]
    }
