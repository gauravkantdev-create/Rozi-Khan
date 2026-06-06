from fastapi import APIRouter, Depends, status
from typing import List
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.retailer import RetailerCreate, RetailerUpdate, RetailerSettingUpdate, RetailerResponse
from app.services.retailer_service import RetailerService
from app.middleware.auth import AuthorizeRoles

router = APIRouter(tags=["Retailer"])

@router.post("/retailer/profile", response_model=RetailerResponse, status_code=status.HTTP_201_CREATED)
def create_retailer_profile(
    data: RetailerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer", "admin"))
):
    service = RetailerService(db)
    return service.create_profile(user=current_user, data=data)

@router.get("/retailer/profile", response_model=RetailerResponse)
def get_retailer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer", "admin"))
):
    service = RetailerService(db)
    return service.get_profile(user=current_user)

@router.patch("/retailer/profile", response_model=RetailerResponse)
def update_retailer_profile(
    data: RetailerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer", "admin"))
):
    service = RetailerService(db)
    return service.update_profile(user=current_user, data=data)

@router.patch("/retailer/settings", response_model=RetailerResponse)
def update_retailer_settings(
    data: RetailerSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer", "admin"))
):
    service = RetailerService(db)
    return service.update_settings(user=current_user, data=data)

@router.patch("/admin/retailers/{retailer_id}/status", response_model=RetailerResponse)
def update_retailer_status(
    retailer_id: str,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    service = RetailerService(db)
    return service.approve_retailer(admin_user=current_user, retailer_id=retailer_id, new_status=new_status)

@router.get("/admin/retailers", response_model=List[RetailerResponse])
def get_all_retailers(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    service = RetailerService(db)
    return service.get_all_retailers(admin_user=current_user, skip=skip, limit=limit, status=status)

@router.get("/admin/retailers/{retailer_id}", response_model=RetailerResponse)
def get_retailer_by_id(
    retailer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    service = RetailerService(db)
    return service.get_retailer_by_id(admin_user=current_user, retailer_id=retailer_id)
