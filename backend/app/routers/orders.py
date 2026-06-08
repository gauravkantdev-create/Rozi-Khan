from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.order import OrderResponse, CartCheckoutRequest, OrderShipRequest
from app.services.order_service import OrderService
from app.middleware.auth import AuthorizeRoles

router = APIRouter(tags=["Orders"])

@router.post("/orders", response_model=List[OrderResponse], status_code=status.HTTP_201_CREATED)
def create_order(
    data: CartCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer"))
):
    """
    Creates order(s) from a cart. Atomically deducts inventory.
    Splits multi-supplier carts into independent orders.
    """
    service = OrderService(db)
    return service.checkout_cart(user=current_user, data=data)

@router.get("/retailer/orders", response_model=List[OrderResponse])
def get_retailer_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer"))
):
    service = OrderService(db)
    return service.get_retailer_orders(user=current_user)

@router.get("/supplier/orders", response_model=List[OrderResponse])
def get_supplier_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier"))
):
    service = OrderService(db)
    return service.get_supplier_orders(user=current_user)

@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order_details(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer", "supplier", "admin"))
):
    service = OrderService(db)
    return service.get_order(user=current_user, order_id=order_id)

@router.patch("/supplier/orders/{order_id}/ship", response_model=OrderResponse)
def ship_order(
    order_id: str,
    data: OrderShipRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier"))
):
    service = OrderService(db)
    return service.ship_order(user=current_user, order_id=order_id, data=data)
