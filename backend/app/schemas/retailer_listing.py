from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class RetailerListingCreate(BaseModel):
    product_id: str
    retail_price_override: Optional[float] = None

class RetailerListingUpdate(BaseModel):
    retail_price_override: Optional[float] = None
    sync_status: Optional[str] = None # e.g., to PAUSE the sync

class RetailerListingResponse(BaseModel):
    id: str
    retailer_id: str
    product_id: str
    snapshot_data: Any # The immutable JSON blob
    retail_price_override: Optional[float] = None
    sync_status: str
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
