from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.repositories.retailer_listing_repository import RetailerListingRepository
from app.schemas.retailer_listing import RetailerListingCreate, RetailerListingUpdate, RetailerListingResponse
from app.models.user import User
from app.models.product import Product, ProductCatalog, ProductVariant
from app.models.retailer import RetailerSetting
from app.policies.retailer_listing_policy import RetailerListingPolicy
from app.events.retailer_listing_events import RetailerListingEvents
from decimal import Decimal

class RetailerListingService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = RetailerListingRepository(db)

    def import_product(self, user: User, data: RetailerListingCreate) -> RetailerListingResponse:
        retailer = RetailerListingPolicy.can_import(user, self.db)

        # Ensure product exists and is active
        product = self.db.query(Product).filter(Product.id == data.product_id).first()
        if not product or product.status != "ACTIVE":
            raise HTTPException(status_code=400, detail="Product is not available for import.")

        # Build Immutable Snapshot
        catalog = self.db.query(ProductCatalog).filter(ProductCatalog.id == product.catalog_id).first()
        variants = self.db.query(ProductVariant).filter(ProductVariant.product_id == product.id).all()
        
        snapshot_data = {
            "catalog_name": catalog.name,
            "description": catalog.description,
            "brand": catalog.brand,
            "supplier_id": product.supplier_id,
            "variants": [
                {
                    "sku_code": v.sku_code,
                    "wholesale_price": float(v.wholesale_price),
                    "attributes": v.attributes
                } for v in variants
            ]
        }

        # Calculate Default Retail Price if not provided
        retail_price = data.retail_price_override
        if retail_price is None:
            settings = self.db.query(RetailerSetting).filter(RetailerSetting.retailer_id == retailer.id).first()
            margin = Decimal(settings.default_profit_margin_percent) if settings else Decimal('20.0')
            # Example: Apply margin to the lowest wholesale price variant
            if variants:
                lowest_wholesale = min([v.wholesale_price for v in variants])
                calculated_price = float(lowest_wholesale * (Decimal('1') + (margin / Decimal('100'))))
                retail_price = round(calculated_price, 2)
            else:
                retail_price = 0.0

        try:
            listing = self.repository.create(
                retailer_id=retailer.id,
                product_id=product.id,
                snapshot_data=snapshot_data,
                retail_price_override=retail_price
            )
            self.db.commit()
            self.db.refresh(listing)
            
            RetailerListingEvents.on_listing_imported(listing.id)
            return listing
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=400, detail="Product already imported.")
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def get_my_listings(self, user: User):
        retailer = RetailerListingPolicy.can_import(user, self.db) # Validates role and sub
        return self.repository.get_all_by_retailer(retailer.id)

    def get_listing(self, user: User, listing_id: str):
        listing = self.repository.get_by_id(listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        RetailerListingPolicy.enforce(RetailerListingPolicy.can_modify_listing(user, listing, self.db))
        return listing

    def update_listing(self, user: User, listing_id: str, data: RetailerListingUpdate) -> RetailerListingResponse:
        listing = self.repository.get_by_id(listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found.")
            
        RetailerListingPolicy.enforce(RetailerListingPolicy.can_modify_listing(user, listing, self.db))
        
        try:
            updated = self.repository.update(
                db_obj=listing,
                retail_price_override=data.retail_price_override,
                sync_status=data.sync_status
            )
            self.db.commit()
            self.db.refresh(updated)
            
            if data.retail_price_override is not None:
                RetailerListingEvents.on_price_override_changed(listing.id)
                
            return updated
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def remove_listing(self, user: User, listing_id: str):
        listing = self.repository.get_by_id(listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found.")
            
        RetailerListingPolicy.enforce(RetailerListingPolicy.can_modify_listing(user, listing, self.db))
        
        try:
            self.repository.delete(listing)
            self.db.commit()
            RetailerListingEvents.on_listing_disabled_or_removed(listing_id)
            return {"success": True, "message": "Listing removed successfully"}
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
