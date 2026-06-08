from app.models.user import User
from app.models.retailer import Retailer, RetailerSubscription
from app.models.retailer_listing import RetailerListing
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

class RetailerListingPolicy:
    @staticmethod
    def can_import(current_user: User, db: Session) -> Retailer:
        if current_user.role != "retailer":
            raise HTTPException(status_code=403, detail="Only retailers can import products.")
            
        retailer = db.query(Retailer).filter(Retailer.user_id == current_user.id).first()
        if not retailer:
            raise HTTPException(status_code=404, detail="Retailer profile not found.")
            
        sub = db.query(RetailerSubscription).filter(RetailerSubscription.retailer_id == retailer.id).first()
        if not sub or not sub.is_active:
            raise HTTPException(status_code=402, detail="Payment Required: Active subscription needed to import products.")
            
        return retailer

    @staticmethod
    def can_modify_listing(current_user: User, listing: RetailerListing, db: Session) -> bool:
        if current_user.role == "admin":
            return True
            
        retailer = db.query(Retailer).filter(Retailer.user_id == current_user.id).first()
        if retailer and listing.retailer_id == retailer.id:
            return True
            
        return False

    @staticmethod
    def enforce(condition: bool, detail: str = "Forbidden: Policy violation"):
        if not condition:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
