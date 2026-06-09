from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCatalogCreate, ProductCreate, ProductVariantCreate, ProductImageCreate, ProductResponse, ProductCatalogResponse
from app.models.user import User
from app.models.supplier import Supplier
from app.policies.product_policy import ProductPolicy
from app.events.product_events import ProductEvents

class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ProductRepository(db)

    def create_catalog_item(self, admin_user: User, data: ProductCatalogCreate) -> ProductCatalogResponse:
        if admin_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can create global catalog items")
        try:
            item = self.repository.create_catalog_item(data)
            self.db.commit()
            self.db.refresh(item)
            return item
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def create_product_offer(self, user: User, data: ProductCreate) -> ProductResponse:
        try:
            supplier = self.db.query(Supplier).filter(Supplier.user_id == user.id).first()
            if not supplier:
                raise HTTPException(status_code=404, detail="Supplier profile not found")
                
            ProductPolicy.enforce(ProductPolicy.can_create_offer(user, supplier), "Must be an APPROVED supplier")
            
            product = self.repository.create_product(supplier_id=supplier.id, obj_in=data)
            self.db.commit()
            self.db.refresh(product)
            
            ProductEvents.on_product_created(product.id)
            return product
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def add_variant(self, user: User, product_id: str, data: ProductVariantCreate):
        try:
            product = self.repository.get_product(product_id)
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")
                
            ProductPolicy.enforce(ProductPolicy.can_update_offer(user, product, self.db), "Cannot modify this product")
            
            variant = self.repository.add_variant(product_id, data)
            self.db.commit()
            
            ProductEvents.on_product_updated(product.id)
            return variant
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def update_product_status(self, admin_user: User, product_id: str, new_status: str):
        if admin_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can globally update product status")
            
        valid_statuses = ["DRAFT", "PENDING_APPROVAL", "ACTIVE", "PAUSED", "OUT_OF_STOCK", "DISABLED", "ARCHIVED"]
        if new_status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")
            
        try:
            product = self.repository.update_product_status(product_id, new_status)
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")
                
            self.db.commit()
            self.db.refresh(product)
            
            if new_status == "ARCHIVED":
                ProductEvents.on_product_archived(product.id)
            else:
                ProductEvents.on_product_updated(product.id)
                
            return product
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def get_public_catalog(self, user: User):
        # M5 Retailer catalog endpoint. Must enforce policy.
        pass

    def get_supplier_offers(self, user: User):
        supplier = self.db.query(Supplier).filter(Supplier.user_id == user.id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier profile not found")
        return self.repository.get_products_by_supplier(supplier.id)

    def get_supplier_offer(self, user: User, product_id: str):
        product = self.repository.get_product(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        ProductPolicy.enforce(ProductPolicy.can_read_offer(user, product, self.db))
        return product

    def get_offer_variants(self, user: User, product_id: str):
        product = self.repository.get_product(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        ProductPolicy.enforce(ProductPolicy.can_read_offer(user, product, self.db))
        return self.repository.get_variants_by_product(product_id)

    def update_variant(self, user: User, product_id: str, variant_id: str, wholesale_price: float):
        product = self.repository.get_product(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        ProductPolicy.enforce(ProductPolicy.can_update_offer(user, product, self.db))
        
        variant = self.repository.get_variant_by_id(variant_id)
        if not variant or variant.product_id != product_id:
            raise HTTPException(status_code=404, detail="Variant not found")
            
        updated = self.repository.update_variant(variant, wholesale_price)
        self.db.commit()
        return updated

    def delete_variant(self, user: User, product_id: str, variant_id: str):
        product = self.repository.get_product(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        ProductPolicy.enforce(ProductPolicy.can_update_offer(user, product, self.db))
        
        variant = self.repository.get_variant_by_id(variant_id)
        if not variant or variant.product_id != product_id:
            raise HTTPException(status_code=404, detail="Variant not found")
            
        self.repository.delete_variant(variant)
        self.db.commit()
        return {"success": True}

    def archive_offer(self, user: User, product_id: str):
        product = self.repository.get_product(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        ProductPolicy.enforce(ProductPolicy.can_update_offer(user, product, self.db))
        
        self.repository.delete_product(product)
        self.db.commit()
        ProductEvents.on_product_archived(product_id)
        return {"success": True, "status": "ARCHIVED"}
