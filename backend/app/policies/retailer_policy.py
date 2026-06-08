from app.models.user import User
from app.models.retailer import Retailer
from fastapi import HTTPException, status

class RetailerPolicy:
    @staticmethod
    def can_read_profile(current_user: User, target_retailer: Retailer) -> bool:
        if current_user.role == "admin":
            return True
        if current_user.id == target_retailer.user_id:
            return True
        return False

    @staticmethod
    def can_update_profile(current_user: User, target_retailer: Retailer) -> bool:
        if current_user.role == "admin":
            return True
        if current_user.id == target_retailer.user_id:
            return True
        return False

    @staticmethod
    def can_update_status(current_user: User) -> bool:
        return current_user.role == "admin"

    @staticmethod
    def enforce(condition: bool, detail: str = "Forbidden: Policy violation"):
        if not condition:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=detail
            )
