import hmac
import hashlib
import time
import razorpay
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal

from app.config import settings
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.product import Product
from app.schemas.payment import PaymentVerificationRequest
from app.services.order import validate_address
from app.utils.helpers import generate_object_id

client = None

def get_razorpay_client():
    global client
    if not client:
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            raise HTTPException(
                status_code=500,
                detail="Razorpay credentials not found in environment variables. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
            )
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    return client

def create_razorpay_order_service(amount: float):
    if not amount or amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid amount is required"
        )
        
    options = {
        "amount": int(round(amount * 100)), # Amount in paise
        "currency": "INR",
        "receipt": f"receipt_{int(time.time() * 1000)}"
    }
    
    try:
        rz = get_razorpay_client()
        rz_order = rz.order.create(data=options)
        return {
            "success": True,
            "order": {
                "id": rz_order["id"],
                "amount": rz_order["amount"],
                "currency": rz_order["currency"]
            },
            "key": settings.RAZORPAY_KEY_ID
        }
    except Exception as e:
        print("[razorpay] Order creation failed:", str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to create Razorpay order"
        )

def verify_payment_service(req_data: PaymentVerificationRequest, user_id: str, db: Session):
    rz_order_id = req_data.razorpay_order_id
    rz_payment_id = req_data.razorpay_payment_id
    rz_signature = req_data.razorpay_signature
    
    if not rz_order_id or not rz_payment_id or not rz_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing payment verification data"
        )
        
    # Signature Verification using HMAC SHA256
    if not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Razorpay key secret not configured on server"
        )
        
    msg = f"{rz_order_id}|{rz_payment_id}"
    expected = hmac.new(
        key=settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg=msg.encode("utf-8"),
        digestmod=hashlib.sha256
    ).hexdigest()
    
    # Secure string comparison
    if not hmac.compare_digest(expected, rz_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed — invalid signature"
        )
        
    # Valid signature! Now create order in database
    order_data = req_data.orderData
    
    if not order_data.orderItems:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No order items provided"
        )
        
    validate_address(order_data.shippingAddress, "Shipping")
    validate_address(order_data.billingAddress, "Billing")
    
    calculated_items_price = Decimal("0.00")
    normalized_items = []
    
    for item in order_data.orderItems:
        qty = max(item.quantity, 1)
        price_val = Decimal(str(item.price))
        
        if item.productId:
            # Check stock
            prod = db.query(Product).filter(Product.id == item.productId).first()
            if prod:
                if prod.stock < qty:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"{prod.name} has only {prod.stock} units available"
                    )
                # Deduct stock
                prod.stock -= qty
                
        calculated_items_price += price_val * qty
        normalized_items.append(item)
        
    items_price = Decimal(str(order_data.itemsPrice)) if order_data.itemsPrice is not None else calculated_items_price
    platform_fee = Decimal(str(order_data.platformFee or 0.00))
    shipping_price = Decimal(str(order_data.shippingPrice or 0.00))
    discount = Decimal(str(order_data.discount or 0.00))
    total_price = Decimal(str(order_data.totalPrice)) if order_data.totalPrice is not None else (items_price + platform_fee + shipping_price - discount)
    
    order_id = generate_object_id()
    order_status = "Processing"
    
    order = Order(
        id=order_id,
        user_id=user_id,
        shipping_fullname=order_data.shippingAddress.fullName,
        shipping_email=order_data.shippingAddress.email,
        shipping_phone=order_data.shippingAddress.phone,
        shipping_address=order_data.shippingAddress.address,
        shipping_city=order_data.shippingAddress.city,
        shipping_state=order_data.shippingAddress.state,
        shipping_postalcode=order_data.shippingAddress.postalCode,
        shipping_country=order_data.shippingAddress.country or "India",
        
        billing_fullname=order_data.billingAddress.fullName,
        billing_email=order_data.billingAddress.email,
        billing_phone=order_data.billingAddress.phone,
        billing_address=order_data.billingAddress.address,
        billing_city=order_data.billingAddress.city,
        billing_state=order_data.billingAddress.state,
        billing_postalcode=order_data.billingAddress.postalCode,
        billing_country=order_data.billingAddress.country or "India",
        
        payment_method="Razorpay",
        razorpay_order_id=rz_order_id,
        razorpay_payment_id=rz_payment_id,
        razorpay_signature=rz_signature,
        payment_status="Paid",
        status=order_status,
        
        items_price=items_price,
        platform_fee=platform_fee,
        shipping_price=shipping_price,
        discount=discount,
        total_price=total_price
    )
    
    db.add(order)
    
    # Create order items
    for item in normalized_items:
        order_item = OrderItem(
            id=generate_object_id(),
            order_id=order_id,
            product_id=item.productId,
            name=item.name,
            price=Decimal(str(item.price)),
            image=item.image,
            category=item.category,
            supplier=item.supplier or "RoziKhan Verified Supplier",
            quantity=item.quantity
        )
        db.add(order_item)
        
    # Create status history log
    history = OrderStatusHistory(
        id=generate_object_id(),
        order_id=order_id,
        status=order_status,
        note="Payment verified via Razorpay"
    )
    db.add(history)
    
    db.commit()
    db.refresh(order)
    return order
