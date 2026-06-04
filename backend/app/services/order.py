import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from decimal import Decimal

from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreateRequest, AddressSchema
from app.utils.helpers import generate_object_id

def validate_address(address: AddressSchema, label: str):
    if not address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{label} details are required"
        )
    if not address.fullName.strip() or not address.address.strip() or not address.city.strip() or not address.state.strip() or not address.postalCode.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required fields in {label} address"
        )

def create_order_service(req_data: OrderCreateRequest, user_id: str, db: Session):
    if not req_data.orderItems:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No order items provided"
        )
        
    validate_address(req_data.shippingAddress, "Shipping")
    validate_address(req_data.billingAddress, "Billing")
    
    # Process order items and validate stock
    calculated_items_price = Decimal("0.00")
    normalized_items = []
    
    for item in req_data.orderItems:
        qty = max(item.quantity, 1)
        price_val = Decimal(str(item.price))
        
        if not item.name or price_val < Decimal("0.00") or qty < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Each order item must include name, price, and quantity"
            )
            
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
        
    # Financial Totals
    items_price = Decimal(str(req_data.itemsPrice)) if req_data.itemsPrice is not None else calculated_items_price
    platform_fee = Decimal(str(req_data.platformFee or 0.00))
    shipping_price = Decimal(str(req_data.shippingPrice or 0.00))
    discount = Decimal(str(req_data.discount or 0.00))
    total_price = Decimal(str(req_data.totalPrice)) if req_data.totalPrice is not None else (items_price + platform_fee + shipping_price - discount)
    
    order_id = generate_object_id()
    
    pay_status = "Pending" if req_data.paymentMethod == "Cash on delivery" else "Paid"
    order_status = "Processing"
    
    # Create order object
    order = Order(
        id=order_id,
        user_id=user_id,
        shipping_fullname=req_data.shippingAddress.fullName,
        shipping_email=req_data.shippingAddress.email,
        shipping_phone=req_data.shippingAddress.phone,
        shipping_address=req_data.shippingAddress.address,
        shipping_city=req_data.shippingAddress.city,
        shipping_state=req_data.shippingAddress.state,
        shipping_postalcode=req_data.shippingAddress.postalCode,
        shipping_country=req_data.shippingAddress.country or "India",
        
        billing_fullname=req_data.billingAddress.fullName,
        billing_email=req_data.billingAddress.email,
        billing_phone=req_data.billingAddress.phone,
        billing_address=req_data.billingAddress.address,
        billing_city=req_data.billingAddress.city,
        billing_state=req_data.billingAddress.state,
        billing_postalcode=req_data.billingAddress.postalCode,
        billing_country=req_data.billingAddress.country or "India",
        
        payment_method=req_data.paymentMethod or "Razorpay",
        payment_status=pay_status,
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
        note="Order placed by customer"
    )
    db.add(history)
    
    db.commit()
    db.refresh(order)
    return order

def get_my_orders_service(user_id: str, db: Session):
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    return orders

def get_order_by_id_service(order_id: str, user_id: str, is_admin: bool, db: Session):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    if order.user_id != user_id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: you cannot access this order"
        )
    return order

def get_all_orders_service(status_filter: Optional[str], keyword: Optional[str], db: Session):
    query = db.query(Order).join(User)
    
    if status_filter and status_filter in ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]:
        query = query.filter(Order.status == status_filter)
        
    if keyword:
        keyword_clean = keyword.strip()
        query = query.filter(
            or_(
                Order.id.ilike(f"%{keyword_clean}%"),
                User.name.ilike(f"%{keyword_clean}%"),
                User.email.ilike(f"%{keyword_clean}%"),
                Order.shipping_fullname.ilike(f"%{keyword_clean}%"),
                Order.shipping_city.ilike(f"%{keyword_clean}%"),
                Order.status.ilike(f"%{keyword_clean}%")
            )
        )
        
    orders = query.order_by(Order.created_at.desc()).all()
    
    # Calculate stats for all orders
    all_orders = db.query(Order).all()
    
    stats = {
        "totalOrders": 0,
        "totalRevenue": 0.0,
        "pendingOrders": 0,
        "processingOrders": 0,
        "deliveredOrders": 0,
        "cancelledOrders": 0
    }
    
    for o in all_orders:
        stats["totalOrders"] += 1
        stats["totalRevenue"] += float(o.total_price)
        if o.status == "Pending":
            stats["pendingOrders"] += 1
        elif o.status == "Processing":
            stats["processingOrders"] += 1
        elif o.status == "Delivered":
            stats["deliveredOrders"] += 1
        elif o.status == "Cancelled":
            stats["cancelledOrders"] += 1
            
    return {
        "success": True,
        "orders": orders,
        "stats": stats
    }

def update_order_status_service(order_id: str, new_status: str, note: Optional[str], db: Session):
    VALID_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order status"
        )
        
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    order.status = new_status
    
    # Add status history log
    note_val = note or f"Status updated to {new_status}"
    history = OrderStatusHistory(
        id=generate_object_id(),
        order_id=order_id,
        status=new_status,
        note=note_val
    )
    db.add(history)
    
    if new_status == "Cancelled" and not order.cancelled_at:
        order.cancel_reason = note or "Cancelled by admin"
        order.cancelled_at = datetime.datetime.utcnow()
        
    db.commit()
    db.refresh(order)
    return order

def cancel_order_service(order_id: str, reason: Optional[str], user_id: str, db: Session):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    if order.status in ["Shipped", "Delivered", "Cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be cancelled after it is {order.status.lower()}"
        )
        
    cancel_reason_val = reason or "Cancelled by customer"
    order.status = "Cancelled"
    order.cancel_reason = cancel_reason_val
    order.cancelled_at = datetime.datetime.utcnow()
    
    # Add status history log
    history = OrderStatusHistory(
        id=generate_object_id(),
        order_id=order_id,
        status="Cancelled",
        note=cancel_reason_val
    )
    db.add(history)
    
    db.commit()
    db.refresh(order)
    return order
