from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.middleware.auth import get_current_user, AuthorizeRoles
from app.models.user import User
from app.schemas.order import (
    OrderCreateRequest,
    OrderResponse,
    OrderDashboardResponse,
)
from app.services.order import (
    create_order_service,
    get_my_orders_service,
    get_order_by_id_service,
    get_all_orders_service,
    update_order_status_service,
    cancel_order_service,
)

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_order(
    req_data: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = create_order_service(req_data, current_user.id, db)
    return {
        "success": True,
        "message": "Order created successfully",
        "order": OrderResponse.model_validate(order)
    }

@router.get("/", response_model=OrderDashboardResponse)
def get_all_orders(
    status: Optional[str] = Query(None),
    keyword: Optional[str] = Query(""),
    current_user: User = Depends(AuthorizeRoles("admin")),
    db: Session = Depends(get_db)
):
    return get_all_orders_service(status_filter=status, keyword=keyword, db=db)

@router.get("/my-orders", response_model=dict)
def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = get_my_orders_service(current_user.id, db)
    serialized = [OrderResponse.model_validate(o) for o in orders]
    return {
        "success": True,
        "orders": serialized
    }

@router.get("/{id}", response_model=dict)
def get_order_by_id(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_admin = current_user.role == "admin"
    order = get_order_by_id_service(id, current_user.id, is_admin, db)
    return {
        "success": True,
        "order": OrderResponse.model_validate(order)
    }

@router.patch("/{id}/status", response_model=dict)
def update_order_status(
    id: str,
    req_data: dict, # Contain status and optionally note
    current_user: User = Depends(AuthorizeRoles("admin")),
    db: Session = Depends(get_db)
):
    status_val = req_data.get("status")
    note_val = req_data.get("note")
    order = update_order_status_service(id, status_val, note_val, db)
    return {
        "success": True,
        "message": "Order status updated successfully",
        "order": OrderResponse.model_validate(order)
    }

@router.patch("/{id}/cancel", response_model=dict)
def cancel_order(
    id: str,
    req_data: dict, # Contain optional reason
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reason_val = req_data.get("reason")
    order = cancel_order_service(id, reason_val, current_user.id, db)
    return {
        "success": True,
        "message": "Order cancelled successfully",
        "order": OrderResponse.model_validate(order)
    }
