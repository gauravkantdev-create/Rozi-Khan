from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.payment import (
    RazorpayOrderRequest,
    RazorpayOrderResponse,
    PaymentVerificationRequest,
)
from app.schemas.order import OrderResponse
from app.services.payment import (
    create_razorpay_order_service,
    verify_payment_service,
)
from app.config import settings

router = APIRouter(prefix="/payment", tags=["payment"])

@router.get("/key", status_code=status.HTTP_200_OK)
def get_key():
    return {
        "success": True,
        "key": settings.RAZORPAY_KEY_ID
    }

@router.post("/create-order", response_model=RazorpayOrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    req_data: RazorpayOrderRequest,
    current_user: User = Depends(get_current_user)
):
    return create_razorpay_order_service(req_data.amount)

@router.post("/verify", response_model=dict, status_code=status.HTTP_201_CREATED)
def verify_payment(
    req_data: PaymentVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = verify_payment_service(req_data, current_user.id, db)
    return {
        "success": True,
        "message": "Payment verified and order created successfully",
        "order": OrderResponse.model_validate(order)
    }
