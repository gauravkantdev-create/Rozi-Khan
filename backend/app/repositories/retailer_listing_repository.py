from sqlalchemy.orm import Session
from app.models.retailer_listing import RetailerListing
from typing import Optional, List, Dict, Any

class RetailerListingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, listing_id: str) -> Optional[RetailerListing]:
        return self.db.query(RetailerListing).filter(RetailerListing.id == listing_id).first()

    def get_by_retailer_and_product(self, retailer_id: str, product_id: str) -> Optional[RetailerListing]:
        return self.db.query(RetailerListing).filter(
            RetailerListing.retailer_id == retailer_id,
            RetailerListing.product_id == product_id
        ).first()

    def get_all_by_retailer(self, retailer_id: str) -> List[RetailerListing]:
        return self.db.query(RetailerListing).filter(RetailerListing.retailer_id == retailer_id).all()

    def create(self, retailer_id: str, product_id: str, snapshot_data: Dict[str, Any], retail_price_override: Optional[float] = None) -> RetailerListing:
        db_obj = RetailerListing(
            retailer_id=retailer_id,
            product_id=product_id,
            snapshot_data=snapshot_data,
            retail_price_override=retail_price_override
        )
        self.db.add(db_obj)
        self.db.flush()
        return db_obj

    def update(self, db_obj: RetailerListing, retail_price_override: Optional[float] = None, sync_status: Optional[str] = None) -> RetailerListing:
        if retail_price_override is not None:
            db_obj.retail_price_override = retail_price_override
        if sync_status is not None:
            db_obj.sync_status = sync_status
            
        self.db.add(db_obj)
        self.db.flush()
        return db_obj

    def delete(self, db_obj: RetailerListing):
        self.db.delete(db_obj)
        self.db.flush()
