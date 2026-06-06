from app.models.user import User
from app.models.order import Order
from app.models.retailer import Retailer
from app.models.supplier import Supplier
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

class OrderPolicy:
    @staticmethod
    def can_retailer_view(current_user: User, order: Order, db: Session) -> bool:
        if current_user.role == "admin":
            return True
        if current_user.role == "retailer":
            retailer = db.query(Retailer).filter(Retailer.user_id == current_user.id).first()
            if retailer and order.retailer_id == retailer.id:
                return True
        return False

    @staticmethod
    def can_supplier_manage(current_user: User, order: Order, db: Session) -> bool:
        if current_user.role == "admin":
            return True
        if current_user.role == "supplier":
            supplier = db.query(Supplier).filter(Supplier.user_id == current_user.id).first()
            if supplier and order.supplier_id == supplier.id:
                return True
        return False

    @staticmethod
    def enforce(condition: bool, detail: str = "Forbidden: Policy violation"):
        if not condition:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
