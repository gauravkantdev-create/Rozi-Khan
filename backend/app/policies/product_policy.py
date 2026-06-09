from app.models.user import User
from app.models.product import Product
from app.models.supplier import Supplier
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

class ProductPolicy:
    @staticmethod
    def can_create_offer(current_user: User, supplier: Supplier) -> bool:
        # User must own the supplier profile and it must be APPROVED
        if current_user.id != supplier.user_id:
            return False
        if supplier.verification_status != "APPROVED":
            return False
        return True

    @staticmethod
    def can_update_offer(current_user: User, target_product: Product, db: Session) -> bool:
        if current_user.role == "admin":
            return True
        # Fetch supplier to check ownership
        supplier = db.query(Supplier).filter(Supplier.id == target_product.supplier_id).first()
        if supplier and supplier.user_id == current_user.id:
            return True
        return False

    @staticmethod
    def can_read_offer(current_user: User, target_product: Product, db: Session) -> bool:
        if current_user.role == "admin":
            return True
        # Supplier reading their own
        supplier = db.query(Supplier).filter(Supplier.id == target_product.supplier_id).first()
        if supplier and supplier.user_id == current_user.id:
            return True
        
        # Retailer reading catalog
        if current_user.role == "retailer":
            if target_product.status == "ACTIVE" and supplier and supplier.verification_status == "APPROVED":
                return True
                
        return False

    @staticmethod
    def enforce(condition: bool, detail: str = "Forbidden: Policy violation"):
        if not condition:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=detail
            )
