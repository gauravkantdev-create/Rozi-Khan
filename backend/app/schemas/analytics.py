from pydantic import BaseModel
from typing import Dict, Any, List

class AdminAnalyticsResponse(BaseModel):
    total_platform_gmv: float
    total_platform_revenue: float
    active_suppliers: int
    active_retailers: int
    orders_by_status: Dict[str, int]

class VariantSalesMetrics(BaseModel):
    variant_id: str
    total_quantity_sold: int

class SupplierAnalyticsResponse(BaseModel):
    total_sales_revenue: float
    pending_payouts_total: float
    total_orders_fulfilled: int
    top_selling_variants: List[VariantSalesMetrics]

class RetailerAnalyticsResponse(BaseModel):
    total_inventory_spend: float
    wallet_balance: float
    active_listings_count: int
    total_orders_placed: int
