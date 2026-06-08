from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.retailer_listing import RetailerListingCreate, RetailerListingUpdate, RetailerListingResponse
from app.services.retailer_listing_service import RetailerListingService
from app.middleware.auth import AuthorizeRoles

router = APIRouter(tags=["Retailer Listings"])

@router.post("/retailer/listings", response_model=RetailerListingResponse, status_code=status.HTTP_201_CREATED)
def import_product_to_store(
    data: RetailerListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer"))
):
    service = RetailerListingService(db)
    return service.import_product(user=current_user, data=data)

@router.get("/retailer/listings", response_model=List[RetailerListingResponse])
def list_my_imports(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer"))
):
    service = RetailerListingService(db)
    return service.get_my_listings(user=current_user)

@router.get("/retailer/listings/{listing_id}", response_model=RetailerListingResponse)
def get_store_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer", "admin"))
):
    service = RetailerListingService(db)
    return service.get_listing(user=current_user, listing_id=listing_id)

@router.patch("/retailer/listings/{listing_id}", response_model=RetailerListingResponse)
def update_store_listing(
    listing_id: str,
    data: RetailerListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer", "admin"))
):
    service = RetailerListingService(db)
    return service.update_listing(user=current_user, listing_id=listing_id, data=data)

@router.delete("/retailer/listings/{listing_id}", status_code=status.HTTP_200_OK)
def remove_store_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer", "admin"))
):
    service = RetailerListingService(db)
    return service.remove_listing(user=current_user, listing_id=listing_id)
