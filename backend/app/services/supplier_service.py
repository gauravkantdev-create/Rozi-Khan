from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.supplier_repository import SupplierRepository
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse, SupplierDocumentCreate
from app.models.user import User
from app.policies.supplier_policy import SupplierPolicy
from app.events.supplier_events import SupplierEvents
from sqlalchemy.exc import SQLAlchemyError

class SupplierService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = SupplierRepository(db)

    def create_profile(self, user: User, data: SupplierCreate) -> SupplierResponse:
        try:
            existing_profile = self.repository.get_by_user_id(user.id)
            if existing_profile:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supplier profile already exists for this user")
            
            supplier = self.repository.create(user_id=user.id, obj_in=data)
            self.repository.create_settings(supplier.id)
            
            # Since repository currently commits, we're okay. If an error happens, we rollback.
            return supplier
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    def get_profile(self, user: User) -> SupplierResponse:
        supplier = self.repository.get_by_user_id(user.id)
        if not supplier:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier profile not found")
            
        SupplierPolicy.enforce(SupplierPolicy.can_read_profile(user, supplier))
        return supplier

    def update_profile(self, user: User, data: SupplierUpdate) -> SupplierResponse:
        try:
            supplier = self.repository.get_by_user_id(user.id)
            if not supplier:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier profile not found")
                
            SupplierPolicy.enforce(SupplierPolicy.can_update_profile(user, supplier))
            
            updated = self.repository.update(db_obj=supplier, obj_in=data)
            return updated
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    def upload_document(self, user: User, data: SupplierDocumentCreate):
        try:
            supplier = self.repository.get_by_user_id(user.id)
            if not supplier:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier profile not found")
                
            SupplierPolicy.enforce(SupplierPolicy.can_update_profile(user, supplier))
            
            return self.repository.add_document(supplier_id=supplier.id, doc_in=data)
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    def get_documents(self, user: User):
        supplier = self.repository.get_by_user_id(user.id)
        if not supplier:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier profile not found")
            
        SupplierPolicy.enforce(SupplierPolicy.can_read_profile(user, supplier))
        return self.repository.get_documents(supplier_id=supplier.id)

    def get_all_suppliers(self, admin_user: User, skip: int = 0, limit: int = 100, status: str = None):
        if admin_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can list suppliers")
        return self.repository.get_all(skip=skip, limit=limit, status=status)

    def get_supplier_by_id(self, admin_user: User, supplier_id: str):
        if admin_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can view arbitrary supplier profiles")
        supplier = self.repository.get_by_id(supplier_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return supplier

    def approve_supplier(self, admin_user: User, supplier_id: str, new_status: str):
        SupplierPolicy.enforce(SupplierPolicy.can_update_status(admin_user))
        
        valid_statuses = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]
        if new_status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid verification status")
            
        try:
            supplier = self.repository.update_verification_status(supplier_id, new_status)
            if not supplier:
                raise HTTPException(status_code=404, detail="Supplier not found")
            
            # Dispatch Events Based on Status Change
            if new_status == "SUSPENDED":
                SupplierEvents.on_supplier_suspended(supplier.id)
            elif new_status == "APPROVED":
                # Assuming user email can be fetched or we just pass ID
                user = self.db.query(User).filter(User.id == supplier.user_id).first()
                if user:
                    SupplierEvents.on_supplier_approved(user.email)
            
            return supplier
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
