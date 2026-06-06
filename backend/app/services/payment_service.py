from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.repositories.payment_repository import PaymentRepository
from app.models.user import User
from app.models.retailer import Retailer
from app.models.supplier import Supplier
from app.schemas.payment import WalletDepositRequest
from app.policies.payment_policy import PaymentPolicy
from app.events.payment_events import PaymentEvents
import logging

logger = logging.getLogger(__name__)

class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = PaymentRepository(db)

    def _get_retailer(self, user: User) -> Retailer:
        retailer = self.db.query(Retailer).filter(Retailer.user_id == user.id).first()
        if not retailer:
            raise HTTPException(status_code=404, detail="Retailer not found")
        return retailer

    def get_wallet(self, user: User):
        retailer = self._get_retailer(user)
        wallet = self.repository.get_wallet_by_retailer(retailer.id)
        if not wallet:
            wallet = self.repository.create_wallet(retailer.id)
            
        PaymentPolicy.enforce(PaymentPolicy.can_view_wallet(user, wallet, self.db))
        return wallet

    def deposit_funds(self, user: User, data: WalletDepositRequest):
        """
        In M9, this simulates a successful Stripe/Razorpay top-up.
        """
        retailer = self._get_retailer(user)
        
        # 1. Lock the wallet row to prevent race conditions
        wallet = self.repository.get_wallet_by_retailer(retailer.id, for_update=True)
        if not wallet:
            wallet = self.repository.create_wallet(retailer.id)
            wallet = self.repository.get_wallet_by_retailer(retailer.id, for_update=True)
            
        PaymentPolicy.enforce(PaymentPolicy.can_view_wallet(user, wallet, self.db))

        # 2. Add funds
        wallet.balance += data.amount
        
        # 3. Create double-entry transaction log
        self.repository.create_transaction(
            wallet_id=wallet.id,
            type="DEPOSIT",
            amount=data.amount
        )
        
        self.db.commit()
        self.db.refresh(wallet)
        
        PaymentEvents.on_deposit_success(wallet.id, float(data.amount))
        return wallet

    def deduct_wallet_for_order(self, retailer_id: str, amount: float, order_id: str):
        """
        Internal System Method: Called by OrderService.
        Must be called within an active DB transaction.
        """
        if amount <= 0:
            return

        wallet = self.repository.get_wallet_by_retailer(retailer_id, for_update=True)
        if not wallet:
            raise HTTPException(status_code=400, detail="Wallet not found. Please add funds.")

        if wallet.balance < amount:
            raise HTTPException(
                status_code=402, 
                detail=f"Insufficient funds. Order total: ${amount}, Wallet balance: ${wallet.balance}"
            )

        wallet.balance -= amount
        
        self.repository.create_transaction(
            wallet_id=wallet.id,
            order_id=order_id,
            type="ORDER_PAYMENT",
            amount=-amount
        )
        # Flush to trigger the DB CheckConstraint immediately
        self.db.flush() 

    def get_supplier_payouts(self, user: User):
        supplier = self.db.query(Supplier).filter(Supplier.user_id == user.id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return self.repository.get_payouts_by_supplier(supplier.id)

    def create_supplier_payout(self, supplier_id: str, order_id: str, order_amount: float):
        """
        Internal System Method: Called by OrderService when status changes to SHIPPED.
        Applies platform commission and credits supplier.
        """
        try:
            # Let's say Rozi Khan takes a flat 5% commission
            commission_rate = 0.05
            payout_amount = float(order_amount) * (1.0 - commission_rate)
            
            payout = self.repository.create_payout(
                supplier_id=supplier_id,
                order_id=order_id,
                amount=payout_amount
            )
            self.db.flush()
            PaymentEvents.on_payout_generated(payout.id, supplier_id, payout_amount)
        except IntegrityError:
            # Payout already exists for this order
            self.db.rollback()
            logger.warning(f"Payout already exists for Order {order_id}")
