from app.database import engine, Base
from app.models.user import User
from app.models.email_otp import EmailOtp
from app.models.product import Product
from app.models.order import Order
from app.models.payment import Payment
from app.models.supplier import Supplier
from app.models.retailer import Retailer
from app.models.retailer_listing import RetailerListing
from app.models.inventory import InventoryTransaction
from app.models.integration import PlatformIntegration

print("Tables known to Base:")
for table_name in Base.metadata.tables.keys():
    print(" -", table_name)

print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
