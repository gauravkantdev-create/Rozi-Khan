from pydantic import BaseModel, constr
from typing import Optional
from datetime import datetime

class RetailerSettingBase(BaseModel):
    default_profit_margin_percent: float = 20.0
    auto_sync_inventory: bool = True

class RetailerSettingUpdate(RetailerSettingBase):
    pass

class RetailerSettingResponse(RetailerSettingBase):
    id: str

    class Config:
        from_attributes = True

class RetailerSubscriptionResponse(BaseModel):
    id: str
    plan_name: str
    is_active: bool
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RetailerBase(BaseModel):
    store_name: constr(min_length=2, max_length=255)
    business_registration_number: Optional[str] = None

class RetailerCreate(RetailerBase):
    pass

class RetailerUpdate(BaseModel):
    store_name: Optional[constr(min_length=2, max_length=255)] = None
    business_registration_number: Optional[str] = None

class RetailerResponse(RetailerBase):
    id: str
    user_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    settings: Optional[RetailerSettingResponse] = None
    subscription: Optional[RetailerSubscriptionResponse] = None

    class Config:
        from_attributes = True
