from app.models.user import User
from app.models.supplier import Supplier
from app.models.inventory import InventoryLedger
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

class InventoryPolicy:
    @staticmethod
    def can_manage_ledger(current_user: User, ledger: InventoryLedger, db: Session) -> bool:
        if current_user.role == "admin":
            return True
            
        supplier = db.query(Supplier).filter(Supplier.user_id == current_user.id).first()
        if supplier and ledger.supplier_id == supplier.id:
            return True
            
        return False

    @staticmethod
    def can_retailer_read_stock(current_user: User, variant_id: str, db: Session) -> bool:
        if current_user.role != "retailer":
            return False
            
        from app.models.retailer import Retailer
        from app.models.retailer_listing import RetailerListing
        from app.models.product import ProductVariant
        
        retailer = db.query(Retailer).filter(Retailer.user_id == current_user.id).first()
        if not retailer:
            return False
            
        variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
        if not variant:
            return False
            
        listing = db.query(RetailerListing).filter(
            RetailerListing.retailer_id == retailer.id,
            RetailerListing.product_id == variant.product_id
        ).first()
        
        if listing:
            return True
            
        return False

    @staticmethod
    def enforce(condition: bool, detail: str = "Forbidden: Policy violation"):
        if not condition:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
