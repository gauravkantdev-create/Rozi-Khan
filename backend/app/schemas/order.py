from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional
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
    orderItems: List[OrderItemResponse] = Field(..., alias="order_items")
    shippingAddress: AddressSchema
    billingAddress: AddressSchema
    razorpayOrderId: Optional[str] = Field(None, alias="razorpayOrderId")
    razorpayPaymentId: Optional[str] = Field(None, alias="razorpayPaymentId")
    razorpaySignature: Optional[str] = Field(None, alias="razorpaySignature")
    paymentMethod: str = Field(..., alias="paymentMethod")
    paymentStatus: str = Field(..., alias="paymentStatus")
    status: str
    statusHistory: List[StatusHistoryResponse] = Field(..., alias="status_history")
    cancelReason: Optional[str] = Field(None, alias="cancelReason")
    cancelledAt: Optional[datetime] = Field(None, alias="cancelledAt")
    itemsPrice: Decimal = Field(..., alias="itemsPrice")
    platformFee: Decimal = Field(..., alias="platformFee")
    shippingPrice: Decimal = Field(..., alias="shippingPrice")
    discount: Decimal = Field(..., alias="discount")
    totalPrice: Decimal = Field(..., alias="totalPrice")
    deliveryEstimate: str = Field(..., alias="deliveryEstimate")
    createdAt: datetime = Field(..., alias="created_at")
    updatedAt: datetime = Field(..., alias="updated_at")

    class Config:
        populate_by_name = True
        from_attributes = True

    @field_validator('shippingAddress', mode='before')
    @classmethod
    def get_shipping_address(cls, value, info):
        # If value is already an AddressSchema or dict, return it
        if isinstance(value, (AddressSchema, dict)):
            return value
        # If value is an Order SQLAlchemy object, we can construct shipping details
        obj = info.context.get('obj') if info.context else None
        if not obj:
            obj = value
        if hasattr(obj, 'shipping_fullname'):
            return {
                "fullName": obj.shipping_fullname,
                "email": obj.shipping_email,
                "phone": obj.shipping_phone,
                "address": obj.shipping_address,
                "city": obj.shipping_city,
                "state": obj.shipping_state,
                "postalCode": obj.shipping_postalcode,
                "country": obj.shipping_country
            }
        return value

    @field_validator('billingAddress', mode='before')
    @classmethod
    def get_billing_address(cls, value, info):
        if isinstance(value, (AddressSchema, dict)):
            return value
        obj = info.context.get('obj') if info.context else None
        if not obj:
            obj = value
        if hasattr(obj, 'billing_fullname'):
            return {
                "fullName": obj.billing_fullname,
                "email": obj.billing_email,
                "phone": obj.billing_phone,
                "address": obj.billing_address,
                "city": obj.billing_city,
                "state": obj.billing_state,
                "postalCode": obj.billing_postalcode,
                "country": obj.billing_country
            }
        return value


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
