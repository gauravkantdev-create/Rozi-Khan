from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.payment import WalletResponse, WalletDepositRequest, PayoutResponse
from app.services.payment_service import PaymentService
from app.middleware.auth import AuthorizeRoles

router = APIRouter(tags=["Payments & Ledger"])

@router.get("/retailer/wallet", response_model=WalletResponse)
def get_my_wallet(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer"))
):
    service = PaymentService(db)
    return service.get_wallet(user=current_user)

@router.post("/retailer/wallet/deposit", response_model=WalletResponse)
def deposit_funds(
    data: WalletDepositRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer"))
):
    """
    Simulates a Stripe Top-Up. Adds funds to the Retailer's wallet.
    """
    service = PaymentService(db)
    return service.deposit_funds(user=current_user, data=data)

@router.get("/supplier/payouts", response_model=List[PayoutResponse])
def get_my_payouts(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier"))
):
    """
    Shows money owed to the Supplier for fulfilled orders.
    """
    service = PaymentService(db)
    return service.get_supplier_payouts(user=current_user)
