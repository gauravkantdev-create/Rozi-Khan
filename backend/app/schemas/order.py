from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
from typing import List, Optional, Any
from datetime import datetime
from decimal import Decimal

class AddressSchema(BaseModel):
    fullName: str = Field(..., alias="fullName")
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: str
    city: str
    state: str
    postalCode: str = Field(..., alias="postalCode")
    country: Optional[str] = "India"

    class Config:
        populate_by_name = True


class OrderItemRequest(BaseModel):
    productId: Optional[str] = Field(None, alias="productId")
    name: str
    price: float
    image: Optional[str] = None
    category: Optional[str] = None
    supplier: Optional[str] = "RoziKhan Verified Supplier"
    quantity: int


class OrderItemResponse(BaseModel):
    productId: Optional[str] = Field(None, alias="productId")
    name: str
    price: Decimal
    image: Optional[str] = None
    category: Optional[str] = None
    supplier: str
    quantity: int

    class Config:
        populate_by_name = True
        from_attributes = True


class OrderCreateRequest(BaseModel):
    orderItems: List[OrderItemRequest]
    shippingAddress: AddressSchema
    billingAddress: AddressSchema
    paymentMethod: Optional[str] = "Razorpay"
    itemsPrice: Optional[float] = None
    platformFee: Optional[float] = 0.0
    shippingPrice: Optional[float] = 0.0
    discount: Optional[float] = 0.0
    totalPrice: Optional[float] = None


class StatusHistoryResponse(BaseModel):
    status: str
    note: Optional[str] = None
    changedAt: datetime = Field(..., alias="changed_at")

    class Config:
        populate_by_name = True
        from_attributes = True


class OrderUserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: str
    role: str

    class Config:
        populate_by_name = True
        from_attributes = True


class OrderResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user: OrderUserResponse
    order_items: List[OrderItemResponse] = Field(..., alias="orderItems")
    shippingAddress: AddressSchema
    billingAddress: AddressSchema
    razorpay_order_id: Optional[str] = Field(None, alias="razorpayOrderId")
    razorpay_payment_id: Optional[str] = Field(None, alias="razorpayPaymentId")
    razorpay_signature: Optional[str] = Field(None, alias="razorpaySignature")
    payment_method: str = Field(..., alias="paymentMethod")
    payment_status: str = Field(..., alias="paymentStatus")
    status: str
    status_history: List[StatusHistoryResponse] = Field(..., alias="statusHistory")
    cancel_reason: Optional[str] = Field(None, alias="cancelReason")
    cancelled_at: Optional[datetime] = Field(None, alias="cancelledAt")
    items_price: Decimal = Field(..., alias="itemsPrice")
    platform_fee: Decimal = Field(..., alias="platformFee")
    shipping_price: Decimal = Field(..., alias="shippingPrice")
    discount: Decimal = Field(..., alias="discount")
    total_price: Decimal = Field(..., alias="totalPrice")
    delivery_estimate: str = Field(..., alias="deliveryEstimate")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True

    @model_validator(mode='before')
    @classmethod
    def populate_addresses(cls, data: Any):
        if hasattr(data, 'shipping_fullname'):
            # It's an ORM object, let's construct the addresses
            shipping = {
                "fullName": data.shipping_fullname,
                "email": data.shipping_email,
                "phone": data.shipping_phone,
                "address": data.shipping_address,
                "city": data.shipping_city,
                "state": data.shipping_state,
                "postalCode": data.shipping_postalcode,
                "country": data.shipping_country
            }
            billing = {
                "fullName": data.billing_fullname,
                "email": data.billing_email,
                "phone": data.billing_phone,
                "address": data.billing_address,
                "city": data.billing_city,
                "state": data.billing_state,
                "postalCode": data.billing_postalcode,
                "country": data.billing_country
            }
            
            # Since Pydantic v2 mode='before' validator for model can return a dict when parsing from an object
            return {
                **{k: getattr(data, k) for k in data.__dict__ if not k.startswith('_')},
                "shippingAddress": shipping,
                "billingAddress": billing,
                "order_items": getattr(data, 'order_items', []),
                "status_history": getattr(data, 'status_history', []),
                "user": getattr(data, 'user', None)
            }
        return data


class OrderStatsDashboard(BaseModel):
    totalOrders: int
    totalRevenue: float
    pendingOrders: int
    processingOrders: int
    deliveredOrders: int
    cancelledOrders: int


class OrderDashboardResponse(BaseModel):
    success: bool
    orders: List[OrderResponse]
    stats: OrderStatsDashboard
