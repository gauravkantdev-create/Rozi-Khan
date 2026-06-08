from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IntegrationConnect(BaseModel):
    shop_url: str

class IntegrationResponse(BaseModel):
    id: str
    retailer_id: str
    platform_name: str
    shop_url: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
