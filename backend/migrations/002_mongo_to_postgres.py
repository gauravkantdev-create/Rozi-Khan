import os
import sys
import datetime
from decimal import Decimal
from typing import Any

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from dotenv import load_dotenv
    load_dotenv()
    from pymongo import MongoClient
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.config import settings
    from app.database import Base
    from app.models.user import User
    from app.models.email_otp import EmailOtp
    from app.models.product import Product, ProductImage, ProductReview
    from app.models.order import Order, OrderItem, OrderStatusHistory
    from app.utils.helpers import generate_object_id
except ImportError:
    print("====================================================================")
    print(" ERROR: Missing required migration dependencies.")
    print(" Please install them first: pip install pymongo sqlalchemy psycopg2-binary python-dotenv")
    print("====================================================================")
    sys.exit(1)

def parse_date(val: Any) -> datetime.datetime:
    if isinstance(val, datetime.datetime):
        return val
    if isinstance(val, (int, float)):
        return datetime.datetime.utcfromtimestamp(val / 1000)
    return datetime.datetime.utcnow()

def mongo_id_to_str(val: Any) -> str:
    if not val:
        return ""
    if isinstance(val, dict) and "$oid" in val:
        return val["$oid"]
    return str(val)

def migrate_data():
    mongo_uri = os.getenv("MONGO_URI")
    mongo_db_name = os.getenv("MONGO_DB_NAME", "test")
    
    if not mongo_uri:
        print("Error: MONGO_URI environment variable is missing.")
        print("Please export MONGO_URI before running this script, e.g.:")
        print("set MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority")
        return
        
    print(f"Connecting to MongoDB Atlas: {mongo_uri.split('@')[-1]}")
    mongo_client = MongoClient(mongo_uri)
    mongo_db = mongo_client[mongo_db_name]
    
    print(f"Connecting to PostgreSQL: {settings.DATABASE_URL.split('@')[-1]}")
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # 0. Ensure tables exist in Postgres
    print("Creating tables in PostgreSQL if they do not exist...")
    Base.metadata.create_all(bind=engine)
    
    # Clean up target tables in correct dependency order
    print("Clearing existing PostgreSQL data for clean migration...")
    session.query(OrderStatusHistory).delete()
    session.query(OrderItem).delete()
    session.query(Order).delete()
    session.query(ProductReview).delete()
    session.query(ProductImage).delete()
    session.query(Product).delete()
    session.query(EmailOtp).delete()
    session.query(User).delete()
    session.commit()
    
    # 1. Migrate Users
    print("\n--- Migrating Users ---")
    users_coll = mongo_db["users"]
    mongo_users = list(users_coll.find({}))
    print(f"Found {len(mongo_users)} users in MongoDB.")
    
    for mu in mongo_users:
        u_id = mongo_id_to_str(mu["_id"])
        user = User(
            id=u_id,
            name=mu.get("name", "Unknown User"),
            email=mu.get("email", "unknown@domain.com").lower().strip(),
            password=mu.get("password", ""),
            is_email_verified=mu.get("isEmailVerified", False),
            role=mu.get("role", "user"),
            created_at=parse_date(mu.get("createdAt")),
            updated_at=parse_date(mu.get("updatedAt"))
        )
        session.add(user)
    session.commit()
    print("Users migrated successfully.")
    
    # 2. Migrate Email OTPs
    print("\n--- Migrating Email OTPs ---")
    otps_coll = mongo_db["emailotps"] # collection name in mongodb usually lowercase
    mongo_otps = list(otps_coll.find({}))
    print(f"Found {len(mongo_otps)} OTP records in MongoDB.")
    
    for mo in mongo_otps:
        o_id = mongo_id_to_str(mo["_id"])
        otp_rec = EmailOtp(
            id=o_id,
            email=mo.get("email", "").lower().strip(),
            otp=mo.get("otp", ""),
            expires_at=parse_date(mo.get("expiresAt")),
            verified=mo.get("verified", False),
            created_at=parse_date(mo.get("createdAt")),
            updated_at=parse_date(mo.get("updatedAt"))
        )
        session.add(otp_rec)
    session.commit()
    print("Email OTPs migrated successfully.")
    
    # 3. Migrate Products & Related tables
    print("\n--- Migrating Products & Images & Reviews ---")
    products_coll = mongo_db["products"]
    mongo_products = list(products_coll.find({}))
    print(f"Found {len(mongo_products)} products in MongoDB.")
    
    for mp in mongo_products:
        p_id = mongo_id_to_str(mp["_id"])
        created_by_id = mongo_id_to_str(mp.get("createdBy")) if mp.get("createdBy") else None
        
        # Ensure user exists in Postgres before referencing
        if created_by_id and not session.query(User).filter(User.id == created_by_id).first():
            created_by_id = None
            
        product = Product(
            id=p_id,
            name=mp.get("name", "Unnamed Product"),
            description=mp.get("description", ""),
            price=Decimal(str(mp.get("price", 0.00))),
            category=mp.get("category", "General"),
            stock=int(mp.get("stock", 0)),
            ratings=Decimal(str(mp.get("ratings", 0.00))),
            num_reviews=int(mp.get("numReviews", 0)),
            supplier=mp.get("supplier"),
            created_by=created_by_id,
            created_at=parse_date(mp.get("createdAt")),
            updated_at=parse_date(mp.get("updatedAt"))
        )
        session.add(product)
        
        # Migrate images (array of strings normalized to separate table)
        images = mp.get("images", [])
        for img_url in images:
            p_img = ProductImage(
                id=generate_object_id(),
                product_id=p_id,
                image_url=img_url,
                created_at=product.created_at
            )
            session.add(p_img)
            
        # Migrate reviews (subdocuments array normalized to separate table)
        reviews = mp.get("reviews", [])
        for mr in reviews:
            r_user_id = mongo_id_to_str(mr.get("user"))
            # Ensure reviewer user exists in Postgres
            if not session.query(User).filter(User.id == r_user_id).first():
                continue
                
            p_rev = ProductReview(
                id=generate_object_id(),
                product_id=p_id,
                user_id=r_user_id,
                name=mr.get("name", "Anonymous"),
                rating=int(mr.get("rating", 5)),
                comment=mr.get("comment", ""),
                created_at=parse_date(mr.get("createdAt")),
                updated_at=parse_date(mr.get("updatedAt"))
            )
            session.add(p_rev)
            
    session.commit()
    print("Products, images, and reviews migrated successfully.")
    
    # 4. Migrate Orders & Items & History
    print("\n--- Migrating Orders & Items & Status History ---")
    orders_coll = mongo_db["orders"]
    mongo_orders = list(orders_coll.find({}))
    print(f"Found {len(mongo_orders)} orders in MongoDB.")
    
    for mo in mongo_orders:
        o_id = mongo_id_to_str(mo["_id"])
        o_user_id = mongo_id_to_str(mo.get("user"))
        
        # Ensure order user exists in Postgres
        if not session.query(User).filter(User.id == o_user_id).first():
            print(f"Skipping order {o_id} because user {o_user_id} was not found in users database.")
            continue
            
        shipping = mo.get("shippingAddress", {})
        billing = mo.get("billingAddress", {})
        
        order = Order(
            id=o_id,
            user_id=o_user_id,
            shipping_fullname=shipping.get("fullName", "N/A"),
            shipping_email=shipping.get("email"),
            shipping_phone=shipping.get("phone"),
            shipping_address=shipping.get("address", "N/A"),
            shipping_city=shipping.get("city", "N/A"),
            shipping_state=shipping.get("state", "N/A"),
            shipping_postalcode=shipping.get("postalCode", "N/A"),
            shipping_country=shipping.get("country", "India"),
            
            billing_fullname=billing.get("fullName", "N/A"),
            billing_email=billing.get("email"),
            billing_phone=billing.get("phone"),
            billing_address=billing.get("address", "N/A"),
            billing_city=billing.get("city", "N/A"),
            billing_state=billing.get("state", "N/A"),
            billing_postalcode=billing.get("postalCode", "N/A"),
            billing_country=billing.get("country", "India"),
            
            razorpay_order_id=mo.get("razorpayOrderId"),
            razorpay_payment_id=mo.get("razorpayPaymentId"),
            razorpay_signature=mo.get("razorpaySignature"),
            
            payment_method=mo.get("paymentMethod", "Razorpay"),
            payment_status=mo.get("paymentStatus", "Paid"),
            status=mo.get("status", "Pending"),
            cancel_reason=mo.get("cancelReason"),
            cancelled_at=parse_date(mo.get("cancelledAt")) if mo.get("cancelledAt") else None,
            
            items_price=Decimal(str(mo.get("itemsPrice", 0.00))),
            platform_fee=Decimal(str(mo.get("platformFee", 0.00))),
            shipping_price=Decimal(str(mo.get("shippingPrice", 0.00))),
            discount=Decimal(str(mo.get("discount", 0.00))),
            total_price=Decimal(str(mo.get("totalPrice", 0.00))),
            delivery_estimate=mo.get("deliveryEstimate", "5-8 business days"),
            
            created_at=parse_date(mo.get("createdAt")),
            updated_at=parse_date(mo.get("updatedAt"))
        )
        session.add(order)
        
        # Migrate order items (subdocuments array normalized to separate table)
        order_items = mo.get("orderItems", [])
        for oi in order_items:
            prod_id = mongo_id_to_str(oi.get("productId")) if oi.get("productId") else None
            # Nullify FK reference if product does not exist
            if prod_id and not session.query(Product).filter(Product.id == prod_id).first():
                prod_id = None
                
            item = OrderItem(
                id=generate_object_id(),
                order_id=o_id,
                product_id=prod_id,
                name=oi.get("name", "Unknown Item"),
                price=Decimal(str(oi.get("price", 0.00))),
                image=oi.get("image"),
                category=oi.get("category"),
                supplier=oi.get("supplier", "RoziKhan Verified Supplier"),
                quantity=int(oi.get("quantity", 1))
            )
            session.add(item)
            
        # Migrate status history (subdocuments array normalized to separate table)
        history = mo.get("statusHistory", [])
        for h in history:
            h_rec = OrderStatusHistory(
                id=generate_object_id(),
                order_id=o_id,
                status=h.get("status", "Pending"),
                note=h.get("note"),
                changed_at=parse_date(h.get("changedAt"))
            )
            session.add(h_rec)
            
    session.commit()
    print("Orders, order items, and status logs migrated successfully.")
    
    print("\n=======================================================")
    print(" SUCCESS: Database Migration from MongoDB to PostgreSQL complete!")
    print("=======================================================")

if __name__ == "__main__":
    migrate_data()
