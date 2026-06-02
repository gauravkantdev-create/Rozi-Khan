from pydantic import BaseModel
from app.schemas.order import OrderCreateRequest

class RazorpayOrderRequest(BaseModel):
    amount: float

class RazorpayOrderDetails(BaseModel):
    id: str
    amount: int
    currency: str

class RazorpayOrderResponse(BaseModel):
    success: bool
    order: RazorpayOrderDetails
    key: str

class PaymentVerificationRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    orderData: OrderCreateRequest
