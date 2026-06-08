import os
import sys
from datetime import datetime

# Add the backend directory to sys.path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models import Base
from app.models.user import User
from app.models.supplier import Supplier
from app.models.retailer import Retailer
from app.models.product import ProductCatalog, Product, ProductVariant
from app.models.inventory import InventoryLedger
from app.models.payment import Wallet, Transaction
from app.services.auth import hash_password
import uuid

def generate_uuid():
    return str(uuid.uuid4())

from sqlalchemy import text

def seed_database():
    print("🧹 Dropping and recreating public schema (CASCADE)...")
    db = SessionLocal()
    try:
        db.execute(text("DROP SCHEMA public CASCADE;"))
        db.execute(text("CREATE SCHEMA public;"))
        db.commit()
    except Exception as e:
        print(f"Error dropping schema: {e}")
        db.rollback()
        
    print("🏗️ Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    try:
        print("👤 Creating Users...")
        default_password = hash_password("Password123!")

        # Admin
        admin = User(id=generate_uuid(), name="System Admin", email="admin@rozikhan.com", password=default_password, role="admin", is_email_verified=True)
        
        # Suppliers
        sup1 = User(id=generate_uuid(), name="Supplier One", email="supplier1@rozikhan.com", password=default_password, role="supplier", is_email_verified=True)
        sup2 = User(id=generate_uuid(), name="Supplier Two", email="supplier2@rozikhan.com", password=default_password, role="supplier", is_email_verified=True)
        
        # Retailers
        ret1 = User(id=generate_uuid(), name="Retailer One", email="retailer1@rozikhan.com", password=default_password, role="retailer", is_email_verified=True)
        ret2 = User(id=generate_uuid(), name="Retailer Two", email="retailer2@rozikhan.com", password=default_password, role="retailer", is_email_verified=True)
        
        db.add_all([admin, sup1, sup2, ret1, ret2])
        db.commit()

        print("🏢 Creating Profiles...")
        s1_profile = Supplier(user_id=sup1.id, company_name="Tech Gadgets Wholesale", verification_status="APPROVED")
        s2_profile = Supplier(user_id=sup2.id, company_name="Home Goods Wholesale", verification_status="APPROVED")
        
        r1_profile = Retailer(user_id=ret1.id, store_name="Retailer One Store", status="ACTIVE")
        r2_profile = Retailer(user_id=ret2.id, store_name="Retailer Two Store", status="ACTIVE")
        
        db.add_all([s1_profile, s2_profile, r1_profile, r2_profile])
        db.commit()

        print("💰 Funding Retailer Wallets ($5,000 each)...")
        w1 = Wallet(retailer_id=r1_profile.id, balance=5000.00)
        w2 = Wallet(retailer_id=r2_profile.id, balance=5000.00)
        db.add_all([w1, w2])
        db.flush()

        t1 = Transaction(wallet_id=w1.id, type="DEPOSIT", amount=5000.00)
        t2 = Transaction(wallet_id=w2.id, type="DEPOSIT", amount=5000.00)
        db.add_all([t1, t2])
        db.commit()

        print("📦 Creating Product Catalog & Inventory...")
        
        # Supplier 1: Tech Gadgets
        pc1 = ProductCatalog(name="Wireless Gaming Mouse", description="High precision gaming mouse", category="Electronics", brand="TechGear")
        db.add(pc1)
        db.flush()
        
        p1 = Product(catalog_id=pc1.id, supplier_id=s1_profile.id, status="ACTIVE")
        db.add(p1)
        db.flush()
        
        v1 = ProductVariant(product_id=p1.id, sku_code="MOUSE-BLK", wholesale_price=25.00, attributes='{"color": "Black"}')
        v2 = ProductVariant(product_id=p1.id, sku_code="MOUSE-WHT", wholesale_price=25.00, attributes='{"color": "White"}')
        db.add_all([v1, v2])
        db.flush()
        
        i1 = InventoryLedger(supplier_id=s1_profile.id, variant_id=v1.id, quantity_available=100, status="IN_STOCK")
        i2 = InventoryLedger(supplier_id=s1_profile.id, variant_id=v2.id, quantity_available=100, status="IN_STOCK")
        db.add_all([i1, i2])

        # Supplier 2: Home Goods
        pc2 = ProductCatalog(name="Cold Brew Coffee Maker", description="Glass pitcher coffee maker", category="Home", brand="KitchenPro")
        db.add(pc2)
        db.flush()
        
        p2 = Product(catalog_id=pc2.id, supplier_id=s2_profile.id, status="ACTIVE")
        db.add(p2)
        db.flush()
        
        v3 = ProductVariant(product_id=p2.id, sku_code="CM-100", wholesale_price=15.00, attributes='{"size": "1 Liter"}')
        db.add(v3)
        db.flush()
        
        i3 = InventoryLedger(supplier_id=s2_profile.id, variant_id=v3.id, quantity_available=50, status="IN_STOCK")
        db.add(i3)
        
        db.commit()
        
        print("✅ Database Seeding Complete!")
        print("---")
        print("Login Credentials:")
        print("Admin:    admin@rozikhan.com / Password123!")
        print("Supplier: supplier1@rozikhan.com / Password123!")
        print("Retailer: retailer1@rozikhan.com / Password123!")

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
