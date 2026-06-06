from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.repositories.inventory_repository import InventoryRepository
from app.schemas.inventory import InventoryLedgerCreate, InventoryRestock, InventoryAllocate, InventoryLedgerResponse
from app.models.user import User
from app.models.supplier import Supplier
from app.models.product import ProductVariant, Product
from app.policies.inventory_policy import InventoryPolicy
from app.events.inventory_events import InventoryEvents

class InventoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = InventoryRepository(db)

    def create_ledger(self, user: User, data: InventoryLedgerCreate) -> InventoryLedgerResponse:
        try:
            supplier = self.db.query(Supplier).filter(Supplier.user_id == user.id).first()
            if not supplier:
                raise HTTPException(status_code=404, detail="Supplier profile not found")
                
            variant = self.db.query(ProductVariant).filter(ProductVariant.id == data.variant_id).first()
            if not variant:
                raise HTTPException(status_code=404, detail="Variant not found")
                
            # Verify supplier owns the variant's product
            product = self.db.query(Product).filter(Product.id == variant.product_id).first()
            if product.supplier_id != supplier.id:
                raise HTTPException(status_code=403, detail="You do not own this product variant")

            ledger = self.repository.create(
                supplier_id=supplier.id,
                variant_id=data.variant_id,
                warehouse_id=data.warehouse_id
            )
            self.db.commit()
            self.db.refresh(ledger)
            return ledger
            
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=400, detail="Ledger already exists for this variant")
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def restock(self, user: User, ledger_id: str, data: InventoryRestock) -> InventoryLedgerResponse:
        try:
            # We must get the ledger first to verify ownership, but without locking to prevent blocking reads
            ledger = self.repository.get_by_id(ledger_id)
            if not ledger:
                raise HTTPException(status_code=404, detail="Ledger not found")
                
            InventoryPolicy.enforce(InventoryPolicy.can_manage_ledger(user, ledger, self.db))
            
            # Now call the repository which uses SELECT FOR UPDATE
            updated = self.repository.restock(ledger_id, data.quantity)
            self.db.commit()
            self.db.refresh(updated)
            
            InventoryEvents.on_inventory_restocked(updated.id)
            return updated
            
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def allocate(self, user: User, ledger_id: str, data: InventoryAllocate) -> InventoryLedgerResponse:
        # Expected to be called by Order service (Admin or System level user)
        if user.role != "admin":
            raise HTTPException(status_code=403, detail="Only system/admin can manually trigger allocation")
            
        try:
            updated = self.repository.allocate(ledger_id, data.quantity)
            self.db.commit()
            self.db.refresh(updated)
            
            InventoryEvents.on_inventory_allocated(updated.id, data.quantity)
            if updated.quantity_available == 0:
                InventoryEvents.on_inventory_depleted(updated.variant_id)
                
            return updated
            
        except ValueError as e:
            self.db.rollback()
            raise HTTPException(status_code=400, detail=str(e)) # Insufficient stock
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def get_my_ledgers(self, user: User):
        supplier = self.db.query(Supplier).filter(Supplier.user_id == user.id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return self.repository.get_all_by_supplier(supplier.id)

    def get_ledger(self, user: User, ledger_id: str):
        ledger = self.repository.get_by_id(ledger_id)
        if not ledger:
            raise HTTPException(status_code=404, detail="Ledger not found")
        InventoryPolicy.enforce(InventoryPolicy.can_manage_ledger(user, ledger, self.db))
        return ledger

    def check_live_stock(self, user: User, variant_id: str):
        InventoryPolicy.enforce(
            InventoryPolicy.can_retailer_read_stock(user, variant_id, self.db),
            "You can only check stock for variants belonging to products you have imported."
        )
        ledger = self.repository.get_by_variant_id(variant_id)
        if not ledger:
            return {"variant_id": variant_id, "quantity_available": 0, "status": "OUT_OF_STOCK"}
            
        return {
            "variant_id": variant_id,
            "quantity_available": ledger.quantity_available,
            "status": ledger.status
        }
