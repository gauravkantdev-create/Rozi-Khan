from sqlalchemy.orm import Session
from app.models.payment import Wallet, Transaction, Payout
from typing import Optional, List

class PaymentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_wallet_by_retailer(self, retailer_id: str, for_update: bool = False) -> Optional[Wallet]:
        query = self.db.query(Wallet).filter(Wallet.retailer_id == retailer_id)
        if for_update:
            # Row-level lock to prevent race conditions during deductions
            query = query.with_for_update()
        return query.first()

    def create_wallet(self, retailer_id: str) -> Wallet:
        wallet = Wallet(retailer_id=retailer_id, balance=0.0)
        self.db.add(wallet)
        self.db.flush()
        return wallet

    def get_transactions_by_wallet(self, wallet_id: str) -> List[Transaction]:
        return self.db.query(Transaction).filter(Transaction.wallet_id == wallet_id).order_by(Transaction.created_at.desc()).all()

    def create_transaction(self, wallet_id: str, type: str, amount: float, order_id: Optional[str] = None) -> Transaction:
        txn = Transaction(
            wallet_id=wallet_id,
            order_id=order_id,
            type=type,
            amount=amount,
            status="SUCCESS"
        )
        self.db.add(txn)
        self.db.flush()
        return txn

    def get_payouts_by_supplier(self, supplier_id: str) -> List[Payout]:
        return self.db.query(Payout).filter(Payout.supplier_id == supplier_id).order_by(Payout.created_at.desc()).all()

    def create_payout(self, supplier_id: str, order_id: str, amount: float) -> Payout:
        payout = Payout(
            supplier_id=supplier_id,
            order_id=order_id,
            amount=amount,
            status="PENDING"
        )
        self.db.add(payout)
        self.db.flush()
        return payout
