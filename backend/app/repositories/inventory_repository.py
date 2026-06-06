from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.inventory import InventoryLedger
from typing import Optional, List

class InventoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, ledger_id: str) -> Optional[InventoryLedger]:
        return self.db.query(InventoryLedger).filter(InventoryLedger.id == ledger_id).first()

    def get_by_variant_id(self, variant_id: str) -> Optional[InventoryLedger]:
        return self.db.query(InventoryLedger).filter(InventoryLedger.variant_id == variant_id).first()

    def get_all_by_supplier(self, supplier_id: str) -> List[InventoryLedger]:
        return self.db.query(InventoryLedger).filter(InventoryLedger.supplier_id == supplier_id).all()

    def create(self, supplier_id: str, variant_id: str, warehouse_id: str = "DEFAULT") -> InventoryLedger:
        db_obj = InventoryLedger(
            supplier_id=supplier_id,
            variant_id=variant_id,
            warehouse_id=warehouse_id,
            quantity_available=0,
            quantity_allocated=0,
            status="OUT_OF_STOCK"
        )
        self.db.add(db_obj)
        self.db.flush()
        return db_obj

    def restock(self, ledger_id: str, quantity: int) -> InventoryLedger:
        """Uses SELECT FOR UPDATE to safely restock."""
        # Row level lock
        ledger = self.db.execute(
            select(InventoryLedger).filter_by(id=ledger_id).with_for_update()
        ).scalar_one()
        
        ledger.quantity_available += quantity
        if ledger.quantity_available > 0:
            ledger.status = "IN_STOCK"
            
        self.db.add(ledger)
        self.db.flush()
        return ledger

    def allocate(self, ledger_id: str, quantity: int) -> InventoryLedger:
        """Uses SELECT FOR UPDATE to safely allocate stock."""
        ledger = self.db.execute(
            select(InventoryLedger).filter_by(id=ledger_id).with_for_update()
        ).scalar_one()
        
        if ledger.quantity_available < quantity:
            raise ValueError("Insufficient stock available for allocation.")
            
        ledger.quantity_available -= quantity
        ledger.quantity_allocated += quantity
        
        if ledger.quantity_available == 0:
            ledger.status = "OUT_OF_STOCK"
            
        self.db.add(ledger)
        self.db.flush()
        return ledger
