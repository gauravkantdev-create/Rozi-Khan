from pydantic import BaseModel, condecimal
from typing import Optional, List
from datetime import datetime

class WalletDepositRequest(BaseModel):
    amount: condecimal(gt=0, max_digits=10, decimal_places=2) # type: ignore

class TransactionResponse(BaseModel):
    id: str
    wallet_id: str
    order_id: Optional[str] = None
    type: str
    amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class WalletResponse(BaseModel):
    id: str
    retailer_id: str
    balance: float
    currency: str
    transactions: List[TransactionResponse] = []

    class Config:
        from_attributes = True

class PayoutResponse(BaseModel):
    id: str
    supplier_id: str
    order_id: str
    amount: float
    status: str
    reference_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
