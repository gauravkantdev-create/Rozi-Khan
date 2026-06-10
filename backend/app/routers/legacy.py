from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.middleware.auth import get_current_user, AuthorizeRoles
from app.models.user import User
from app.models.supplier import Supplier
from app.models.product import Product, ProductCatalog, ProductVariant, ProductImage
from app.models.inventory import InventoryLedger
from app.models.order import Order
from app.schemas.product import ProductCreate
import uuid

router = APIRouter(tags=["Legacy Compatibility API"])

def flatten_product(p: Product, db: Session):
    # Fetch related data to mimic MongoDB structure
    catalog = db.query(ProductCatalog).filter(ProductCatalog.id == p.catalog_id).first()
    supplier = db.query(Supplier).filter(Supplier.id == p.supplier_id).first()
    variant = db.query(ProductVariant).filter(ProductVariant.product_id == p.id).first()
    
    price = float(variant.wholesale_price) if variant else 0.0
    stock = 0
    if variant:
        ledger = db.query(InventoryLedger).filter(InventoryLedger.variant_id == variant.id).first()
        if ledger:
            stock = ledger.quantity_available
            
    images = db.query(ProductImage).filter(ProductImage.product_id == p.id).all()
    image_urls = [img.image_url for img in images]

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
def legacy_get_products(db: Session = Depends(get_db)):
    # Returns all products or supplier products depending on auth?
    # In legacy, GET /products usually returns all products for the marketplace
    products = db.query(Product).filter(Product.status == "ACTIVE").all()
    flat_products = [flatten_product(p, db) for p in products]
    return {"success": True, "products": flat_products}

@router.get("/products/{product_id}")
def legacy_get_product_by_id(product_id: str, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "product": flatten_product(p, db)}

@router.post("/products")
def legacy_create_product(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier", "admin"))
):
    # Data is expected to be { name, description, price, category, stock, supplier, images }
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
    
    return {"success": True, "product": flatten_product(product, db)}

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

    return {"success": True, "product": flatten_product(p, db)}

# --- ORDERS ---

def flatten_order(o: Order, db: Session):
    addr = o.shipping_address or {}
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
            "country": addr.get("Country", "")
        }
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

