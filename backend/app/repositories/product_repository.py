from sqlalchemy.orm import Session
from app.models.product import ProductCatalog, Product, ProductVariant, ProductImage
from app.schemas.product import ProductCatalogCreate, ProductCreate, ProductVariantCreate, ProductImageCreate
from typing import Optional, List

class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_catalog_item(self, obj_in: ProductCatalogCreate) -> ProductCatalog:
        db_obj = ProductCatalog(**obj_in.model_dump())
        self.db.add(db_obj)
        self.db.flush()
        return db_obj

    def get_catalog_item(self, catalog_id: str) -> Optional[ProductCatalog]:
        return self.db.query(ProductCatalog).filter(ProductCatalog.id == catalog_id).first()

    def get_all_catalog_items(self) -> List[ProductCatalog]:
        return self.db.query(ProductCatalog).all()

    def create_product(self, supplier_id: str, obj_in: ProductCreate) -> Product:
        db_obj = Product(
            catalog_id=obj_in.catalog_id,
            supplier_id=supplier_id
        )
        self.db.add(db_obj)
        self.db.flush()
        return db_obj

    def get_product(self, product_id: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.id == product_id).first()

    def update_product_status(self, product_id: str, status: str) -> Optional[Product]:
        db_obj = self.get_product(product_id)
        if db_obj:
            db_obj.status = status
            self.db.add(db_obj)
            self.db.flush()
        return db_obj

    def get_products_by_supplier(self, supplier_id: str) -> List[Product]:
        return self.db.query(Product).filter(Product.supplier_id == supplier_id).all()

    def get_variants_by_product(self, product_id: str) -> List[ProductVariant]:
        return self.db.query(ProductVariant).filter(ProductVariant.product_id == product_id).all()

    def get_variant_by_id(self, variant_id: str) -> Optional[ProductVariant]:
        return self.db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()

    def update_variant(self, variant: ProductVariant, wholesale_price: Optional[float] = None) -> ProductVariant:
        if wholesale_price is not None:
            variant.wholesale_price = wholesale_price
        self.db.add(variant)
        self.db.flush()
        return variant

    def delete_variant(self, variant: ProductVariant):
        self.db.delete(variant)
        self.db.flush()

    def delete_product(self, product: Product):
        product.status = "ARCHIVED"
        self.db.add(product)
        self.db.flush()

    def add_variant(self, product_id: str, obj_in: ProductVariantCreate) -> ProductVariant:
        db_obj = ProductVariant(
            product_id=product_id,
            sku_code=obj_in.sku_code,
            wholesale_price=obj_in.wholesale_price,
            attributes=obj_in.attributes
        )
        self.db.add(db_obj)
        self.db.flush()
        return db_obj

    def add_image(self, product_id: str, obj_in: ProductImageCreate) -> ProductImage:
        db_obj = ProductImage(
            product_id=product_id,
            image_url=obj_in.image_url,
            is_primary=obj_in.is_primary
        )
        self.db.add(db_obj)
        self.db.flush()
        return db_obj
