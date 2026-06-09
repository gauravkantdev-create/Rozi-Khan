from pydantic import BaseModel, conint
from typing import Optional
from datetime import datetime

class InventoryLedgerCreate(BaseModel):
    variant_id: str
    warehouse_id: Optional[str] = "DEFAULT"

class InventoryRestock(BaseModel):
    quantity: conint(gt=0) # Must add at least 1

class InventoryAllocate(BaseModel):
    quantity: conint(gt=0) # Must allocate at least 1

class InventoryLedgerResponse(BaseModel):
    id: str
    supplier_id: str
    variant_id: str
    warehouse_id: str
    quantity_available: int
    quantity_allocated: int
    status: str
    updated_at: datetime

    class Config:
        from_attributes = True
