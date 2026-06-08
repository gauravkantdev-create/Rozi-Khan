from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse, SupplierDocumentCreate, SupplierDocumentResponse
from app.services.supplier_service import SupplierService
from app.middleware.auth import get_current_user, AuthorizeRoles

router = APIRouter(tags=["Supplier"])

@router.post("/supplier/profile", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier_profile(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    service = SupplierService(db)
    return service.create_profile(user=current_user, data=data)

@router.get("/supplier/profile", response_model=SupplierResponse)
def get_supplier_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    service = SupplierService(db)
    return service.get_profile(user=current_user)

@router.patch("/supplier/profile", response_model=SupplierResponse)
def update_supplier_profile(
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    service = SupplierService(db)
    return service.update_profile(user=current_user, data=data)

@router.post("/supplier/documents", response_model=SupplierDocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_supplier_document(
    data: SupplierDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    service = SupplierService(db)
    return service.upload_document(user=current_user, data=data)

@router.get("/supplier/documents", response_model=List[SupplierDocumentResponse])
def get_supplier_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    service = SupplierService(db)
    return service.get_documents(user=current_user)

@router.patch("/admin/suppliers/{supplier_id}/status", response_model=SupplierResponse)
def update_supplier_status(
    supplier_id: str,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    service = SupplierService(db)
    return service.approve_supplier(admin_user=current_user, supplier_id=supplier_id, new_status=new_status)

@router.get("/admin/suppliers", response_model=List[SupplierResponse])
def get_all_suppliers(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    service = SupplierService(db)
    return service.get_all_suppliers(admin_user=current_user, skip=skip, limit=limit, status=status)

@router.get("/admin/suppliers/{supplier_id}", response_model=SupplierResponse)
def get_supplier_by_id(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    service = SupplierService(db)
    return service.get_supplier_by_id(admin_user=current_user, supplier_id=supplier_id)
