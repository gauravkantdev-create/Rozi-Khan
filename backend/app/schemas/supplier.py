from pydantic import BaseModel, constr, HttpUrl, Field
from typing import Optional, List
from datetime import datetime

class SupplierSettingBase(BaseModel):
    auto_accept_orders: bool = True
    dispatch_sla_days: int = 2

class SupplierSettingResponse(SupplierSettingBase):
    id: str

    class Config:
        from_attributes = True

class SupplierDocumentBase(BaseModel):
    document_type: str = Field(..., description="E.g., BUSINESS_REGISTRATION, TAX_ID, BANK_DETAILS")
    file_url: str

class SupplierDocumentCreate(SupplierDocumentBase):
    pass

class SupplierDocumentResponse(SupplierDocumentBase):
    id: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class SupplierBase(BaseModel):
    company_name: constr(min_length=2, max_length=255)
    tax_id: Optional[str] = None
    warehouse_address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    company_name: Optional[constr(min_length=2, max_length=255)] = None
    tax_id: Optional[str] = None
    warehouse_address: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: str
    user_id: str
    verification_status: str
    created_at: datetime
    updated_at: datetime
    
    settings: Optional[SupplierSettingResponse] = None
    documents: List[SupplierDocumentResponse] = []

    class Config:
        from_attributes = True
