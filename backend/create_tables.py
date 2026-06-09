from app.database import engine, Base
from app.models import *
import app.models.user
import app.models.product
import app.models.order
import app.models.email_otp
import app.models.payment
import app.models.supplier
import app.models.retailer
import app.models.retailer_listing
import app.models.inventory
import app.models.integration

print("Creating all missing tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
