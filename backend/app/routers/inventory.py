from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.inventory import InventoryLedgerCreate, InventoryRestock, InventoryAllocate, InventoryLedgerResponse
from app.services.inventory_service import InventoryService
from app.middleware.auth import AuthorizeRoles

router = APIRouter(tags=["Inventory"])

@router.post("/inventory/ledgers", response_model=InventoryLedgerResponse, status_code=status.HTTP_201_CREATED)
def create_ledger(
    data: InventoryLedgerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    service = InventoryService(db)
    return service.create_ledger(user=current_user, data=data)

@router.get("/inventory/ledgers", response_model=List[InventoryLedgerResponse])
def get_supplier_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier"))
):
    service = InventoryService(db)
    return service.get_my_ledgers(user=current_user)

@router.get("/inventory/ledgers/{ledger_id}", response_model=InventoryLedgerResponse)
def get_supplier_ledger(
    ledger_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    service = InventoryService(db)
    return service.get_ledger(user=current_user, ledger_id=ledger_id)

@router.get("/retailer/inventory/{variant_id}")
def check_retailer_stock(
    variant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer"))
):
    service = InventoryService(db)
    return service.check_live_stock(user=current_user, variant_id=variant_id)

@router.patch("/inventory/ledgers/{ledger_id}/restock", response_model=InventoryLedgerResponse)
def restock_inventory(
    ledger_id: str,
    data: InventoryRestock,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    service = InventoryService(db)
    return service.restock(user=current_user, ledger_id=ledger_id, data=data)

@router.patch("/inventory/ledgers/{ledger_id}/allocate", response_model=InventoryLedgerResponse)
def allocate_inventory(
    ledger_id: str,
    data: InventoryAllocate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin")) # System-level call
):
    service = InventoryService(db)
    return service.allocate(user=current_user, ledger_id=ledger_id, data=data)
