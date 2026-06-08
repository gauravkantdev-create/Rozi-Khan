from pydantic import BaseModel, constr, conint
from typing import Optional, List, Dict, Any
from datetime import datetime

class OrderItemCreate(BaseModel):
    variant_id: str
    quantity: conint(gt=0)

class CartCheckoutRequest(BaseModel):
    """
    A single request from the Retailer (or Shopify Webhook) containing items that 
    may belong to multiple different suppliers. The system will split these.
    """
    retailer_order_reference: Optional[str] = None
    shipping_address: Dict[str, Any] # e.g., {"name": "John Doe", "address": "123 Main St", "city": "NY"}
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: str
    variant_id: str
    quantity: int
    wholesale_price_at_order: float

    class Config:
        from_attributes = True

class OrderStatusHistoryResponse(BaseModel):
    status: str
    changed_by: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    retailer_id: str
    supplier_id: str
    retailer_order_reference: Optional[str] = None
    status: str
    shipping_address: Dict[str, Any]
    tracking_number: Optional[str] = None
    total_amount: float
    created_at: datetime
    updated_at: datetime
    
    items: List[OrderItemResponse] = []
    status_history: List[OrderStatusHistoryResponse] = []

    class Config:
        from_attributes = True

class OrderShipRequest(BaseModel):
    tracking_number: str
