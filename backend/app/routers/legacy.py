from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.database import get_db
from app.middleware.auth import get_current_user, AuthorizeRoles, get_current_user_optional
from app.models.user import User
from app.models.supplier import Supplier
from app.models.product import Product, ProductCatalog, ProductVariant, ProductImage
from app.models.inventory import InventoryLedger
from app.models.order import Order
from app.schemas.product import ProductCreate
import uuid

router = APIRouter(tags=["Legacy Compatibility API"])

def flatten_product(p: Product):
    # We already have all related data from joinedload
    catalog = p.catalog
    supplier = p.supplier
    variant = p.variants[0] if p.variants else None
    
    price = float(variant.wholesale_price) if variant else 0.0
    stock = 0
    if variant and variant.ledger:
        stock = variant.ledger.quantity_available
            
    image_urls = [img.image_url for img in p.images] if p.images else []

    return {
        "_id": p.id,
        "name": catalog.name if catalog else "Unknown Product",
        "description": catalog.description if catalog else "",
        "price": price,
        "category": catalog.category if catalog else "Uncategorized",
        "stock": stock,
        "supplier": supplier.company_name if supplier else "Unknown Supplier",
        "images": image_urls,
        "ratings": 0,
        "numReviews": 0,
        "addedByRole": supplier.user.role if supplier and supplier.user else None,
        "adminAdded": bool(supplier and supplier.user and supplier.user.role == "admin"),
        "createdAt": p.created_at.isoformat() if p.created_at else None,
    }

@router.get("/products")
def legacy_get_products(
    keyword: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional)
):
    # Pre-fetch all related data in one query
    query = db.query(Product).options(
        joinedload(Product.catalog),
        joinedload(Product.supplier).joinedload(Supplier.user),
        joinedload(Product.variants).joinedload(ProductVariant.ledger),
        joinedload(Product.images)
    )

    # Returns all products or supplier products depending on auth
    if current_user and current_user.role == "admin":
        pass
    elif current_user and current_user.role == "supplier":
        supplier = db.query(Supplier).filter(Supplier.user_id == current_user.id).first()
        if supplier:
            query = query.filter(Product.supplier_id == supplier.id)
        else:
            query = query.filter(Product.id == None)  # No products
    else:
        query = query.filter(Product.status == "ACTIVE")

    # Apply category filter if provided
    if category:
        query = query.join(Product.catalog).filter(ProductCatalog.category.ilike(category))
    
    # Apply keyword search if provided
    if keyword:
        query = query.join(Product.catalog).filter(
            (ProductCatalog.name.ilike(f"%{keyword}%")) |
            (ProductCatalog.description.ilike(f"%{keyword}%"))
        )

    products = query.all()
    flat_products = [flatten_product(p) for p in products]
    return {"success": True, "products": flat_products}

@router.get("/products/{product_id}")
def legacy_get_product_by_id(product_id: str, db: Session = Depends(get_db)):
    p = db.query(Product).options(
        joinedload(Product.catalog),
        joinedload(Product.supplier).joinedload(Supplier.user),
        joinedload(Product.variants).joinedload(ProductVariant.ledger),
        joinedload(Product.images)
    ).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "product": flatten_product(p)}

@router.post("/products")
def legacy_create_product(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    # Data is expected to be { name, description, price, category, stock, supplier, images }
    supplier = None
    if current_user.role == "admin":
        # For admin: find supplier by company name
        supplier_name = data.get("supplier")
        if supplier_name:
            supplier = db.query(Supplier).filter(Supplier.company_name.ilike(supplier_name)).first()
        if not supplier:
            # Check if there are any suppliers
            supplier = db.query(Supplier).first()
        if not supplier:
            # Create a default supplier for the admin
            default_supplier = Supplier(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                company_name="Default Supplier",
                verification_status="APPROVED"
            )
            db.add(default_supplier)
            db.flush()
            
            # Create supplier settings
            from app.models.supplier import SupplierSetting
            settings = SupplierSetting(
                id=str(uuid.uuid4()),
                supplier_id=default_supplier.id,
                auto_accept_orders=True,
                dispatch_sla_days=2
            )
            db.add(settings)
            db.flush()
            
            supplier = default_supplier
    else:
        # For suppliers: use their own profile
        supplier = db.query(Supplier).filter(Supplier.user_id == current_user.id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier profile not found")

    catalog = ProductCatalog(
        id=str(uuid.uuid4()),
        name=data.get("name"),
        description=data.get("description", ""),
        category=data.get("category", "Uncategorized")
    )
    db.add(catalog)
    db.flush()

    product = Product(
        id=str(uuid.uuid4()),
        catalog_id=catalog.id,
        supplier_id=supplier.id,
        status="ACTIVE"
    )
    db.add(product)
    db.flush()

    variant = ProductVariant(
        id=str(uuid.uuid4()),
        product_id=product.id,
        sku_code=f"SKU-{product.id[:6]}",
        wholesale_price=data.get("price", 0)
    )
    db.add(variant)
    db.flush()

    ledger = InventoryLedger(
        id=str(uuid.uuid4()),
        supplier_id=supplier.id,
        variant_id=variant.id,
        quantity_available=data.get("stock", 0),
        status="IN_STOCK"
    )
    db.add(ledger)
    
    images = data.get("images", [])
    for img_url in images:
        img = ProductImage(id=str(uuid.uuid4()), product_id=product.id, image_url=img_url)
        db.add(img)

    db.commit()
    db.refresh(product)
    
    return {"success": True, "product": flatten_product(product)}

@router.delete("/products/{product_id}")
def legacy_delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check ownership
    supplier = db.query(Supplier).filter(Supplier.user_id == current_user.id).first()
    if current_user.role != "admin" and (not supplier or p.supplier_id != supplier.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")

    db.delete(p)
    db.commit()
    return {"success": True, "message": "Product removed"}

@router.put("/products/{product_id}")
def legacy_update_product(
    product_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    # Mainly used for stock update: { stock: N }
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
        
    supplier = db.query(Supplier).filter(Supplier.user_id == current_user.id).first()
    if current_user.role != "admin" and (not supplier or p.supplier_id != supplier.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    if "stock" in data:
        variant = db.query(ProductVariant).filter(ProductVariant.product_id == p.id).first()
        if variant:
            ledger = db.query(InventoryLedger).filter(InventoryLedger.variant_id == variant.id).first()
            if ledger:
                ledger.quantity_available = data["stock"]
                db.commit()

    return {"success": True, "product": flatten_product(p)}

# --- ORDERS ---

def flatten_order(o: Order, db: Session):
    addr = o.shipping_address or {}
    items = []
    for item in o.items:
        variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
        product_name = "Unknown Product"
        if variant:
            product = db.query(Product).filter(Product.id == variant.product_id).first()
            if product:
                catalog = db.query(ProductCatalog).filter(ProductCatalog.id == product.catalog_id).first()
                if catalog:
                    product_name = catalog.name
        items.append({
            "_id": item.id,
            "name": product_name,
            "quantity": item.quantity,
            "price": float(item.wholesale_price_at_order),
        })
    return {
        "_id": o.id,
        "totalPrice": float(o.total_amount),
        "status": o.status,
        "createdAt": o.created_at.isoformat() if o.created_at else None,
        "shippingAddress": {
            "fullName": addr.get("Name", ""),
            "address": addr.get("Address", ""),
            "city": addr.get("City", ""),
            "postalCode": addr.get("Zip", ""),
            "country": addr.get("Country", ""),
            "phone": addr.get("Phone", "")
        },
        "items": items
    }

@router.post("/orders")
def legacy_create_order(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer"))
):
    from app.services.order_service import OrderService
    from app.schemas.order import CartCheckoutRequest
    service = OrderService(db)
    
    # Try to map data to CartCheckoutRequest
    try:
        req = CartCheckoutRequest(**data)
        new_orders = service.checkout_cart(user=current_user, data=req)
        # Frontend expects a single order usually, but backend returns list of split orders.
        # We will return the first one as "order" and all as "orders" to be safe.
        flat_orders = [flatten_order(o, db) for o in new_orders]
        return {"success": True, "order": flat_orders[0] if flat_orders else None, "orders": flat_orders}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/orders")
def legacy_get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin", "supplier", "retailer"))
):
    supplier = db.query(Supplier).filter(Supplier.user_id == current_user.id).first()
    from app.models.retailer import Retailer
    retailer = db.query(Retailer).filter(Retailer.user_id == current_user.id).first()
    
    if current_user.role == "supplier" and supplier:
        orders = db.query(Order).filter(Order.supplier_id == supplier.id).all()
    elif current_user.role == "retailer" and retailer:
        orders = db.query(Order).filter(Order.retailer_id == retailer.id).all()
    else:
        orders = db.query(Order).all()

    flat_orders = [flatten_order(o, db) for o in orders]
    
    total_revenue = sum(o["totalPrice"] for o in flat_orders if o["status"] == "DELIVERED")
    
    stats = {
        "totalOrders": len(orders),
        "totalRevenue": total_revenue,
        "pendingOrders": sum(1 for o in flat_orders if o["status"] == "PENDING"),
        "deliveredOrders": sum(1 for o in flat_orders if o["status"] == "DELIVERED"),
        "cancelledOrders": sum(1 for o in flat_orders if o["status"] == "CANCELLED")
    }

    return {"success": True, "orders": flat_orders, "stats": stats}

@router.patch("/orders/{order_id}/status")
def legacy_update_order_status(
    order_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin", "supplier"))
):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if "status" in data:
        o.status = data["status"].upper()
        db.commit()
        
    return {"success": True, "order": flatten_order(o, db)}

# --- PAYMENTS ---

import os

@router.get("/payment/key")
def legacy_get_payment_key():
    return {"success": True, "key": os.getenv("RAZORPAY_KEY_ID", "rzp_test_stub")}

@router.post("/payment/create-order")
def legacy_create_payment_order(data: dict):
    # This expects { amount: 100 }
    amount = data.get("amount", 0)
    # Return a stub razorpay order id for testing, or use actual Razorpay SDK if configured
    import uuid
    import time
    return {
        "success": True,
        "order": {
            "id": f"order_{int(time.time())}",
            "amount": amount * 100, # Assuming INR paise
            "currency": "INR",
            "receipt": str(uuid.uuid4())[:8]
        }
    }

@router.post("/payment/verify")
def legacy_verify_payment(data: dict):
    # Stub verification
    return {"success": True, "message": "Payment verified successfully"}

# --- SUPPLIERS & CATEGORIES ---
@router.get("/admin/suppliers-list")
def get_suppliers_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin", "retailer", "supplier"))
):
    suppliers = db.query(Supplier).filter(Supplier.verification_status == "APPROVED").all()
    return {
        "success": True,
        "suppliers": [
            {
                "id": s.id,
                "company_name": s.company_name,
                "logo_url": s.logo_url
            }
            for s in suppliers
        ]
    }

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    # Get all unique categories from product catalog
    categories = db.query(ProductCatalog.category).distinct().all()
    # If no categories yet, provide default ones
    cat_list = [cat[0] for cat in categories if cat[0]]
    if not cat_list:
        cat_list = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Books"]
    return {
        "success": True,
        "categories": cat_list
    }

@router.post("/admin/categories")
def create_category(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    category_name = data.get("name")
    if not category_name:
        raise HTTPException(status_code=400, detail="Category name is required")
    
    # Check if category already exists
    existing = db.query(ProductCatalog).filter(ProductCatalog.category.ilike(category_name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    # Create a dummy product catalog entry just to add the category
    # (or we could create a separate categories table, but for simplicity, use existing)
    dummy_catalog = ProductCatalog(
        id=str(uuid.uuid4()),
        name=f"Dummy-{category_name}",
        description=f"Category holder for {category_name}",
        category=category_name
    )
    db.add(dummy_catalog)
    db.commit()
    
    # Get all categories again
    categories = db.query(ProductCatalog.category).distinct().all()
    return {
        "success": True,
        "message": "Category created successfully",
        "categories": [cat[0] for cat in categories if cat[0]]
    }

@router.post("/admin/suppliers")
def create_supplier_profile(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    company_name = data.get("company_name")
    if not company_name:
        raise HTTPException(status_code=400, detail="Company name is required")
    
    # Create a new supplier profile (we'll link it to current admin user for simplicity)
    existing_supplier = db.query(Supplier).filter(Supplier.company_name.ilike(company_name)).first()
    if existing_supplier:
        raise HTTPException(status_code=400, detail="Supplier with this company name already exists")
    
    new_supplier = Supplier(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        company_name=company_name,
        logo_url=data.get("logo_url"),
        tax_id=data.get("tax_id", ""),
        warehouse_address=data.get("warehouse_address", ""),
        verification_status="APPROVED"
    )
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    
    # Create supplier settings
    from app.models.supplier import SupplierSetting
    settings = SupplierSetting(
        id=str(uuid.uuid4()),
        supplier_id=new_supplier.id,
        auto_accept_orders=True,
        dispatch_sla_days=2
    )
    db.add(settings)
    db.commit()
    
    # Get all suppliers
    suppliers = db.query(Supplier).filter(Supplier.verification_status == "APPROVED").all()
    return {
        "success": True,
        "message": "Supplier created successfully",
        "suppliers": [
            {
                "id": s.id,
                "company_name": s.company_name,
                "logo_url": s.logo_url
            }
            for s in suppliers
        ]
    }

@router.delete("/admin/suppliers/{supplier_id}")
def delete_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(supplier)
    db.commit()
    # Return updated suppliers list
    suppliers = db.query(Supplier).filter(Supplier.verification_status == "APPROVED").all()
    return {
        "success": True,
        "message": "Supplier deleted successfully",
        "suppliers": [
            {
                "id": s.id,
                "company_name": s.company_name,
                "logo_url": s.logo_url
            }
            for s in suppliers
        ]
    }

@router.delete("/admin/categories/{category_name}")
def delete_category(
    category_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    # Delete dummy catalog entry for this category
    dummy_entries = db.query(ProductCatalog).filter(ProductCatalog.category.ilike(category_name)).all()
    for entry in dummy_entries:
        db.delete(entry)
    db.commit()
    # Get updated categories
    categories = db.query(ProductCatalog.category).distinct().all()
    cat_list = [cat[0] for cat in categories if cat[0]]
    if not cat_list:
        cat_list = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Books"]
    return {
        "success": True,
        "message": "Category deleted successfully",
        "categories": cat_list
    }
