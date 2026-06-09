from app.database import SessionLocal, engine, Base
import app.models as models
from app.services.auth import send_register_otp_service, register_user_service
from app.models.email_otp import EmailOtp

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()
email = "testuser@example.com"
name = "Test User"
password = "Test@1234"

# Generate OTP and print it
send_register_otp_service(email, db)
otp_row = db.query(EmailOtp).filter(EmailOtp.email == email).order_by(EmailOtp.created_at.desc()).first()
if otp_row:
    otp = otp_row.otp
    print(f"Generated OTP for {email}: {otp}")
else:
    raise SystemExit("Failed to create OTP record")

# Register user using the OTP
result = register_user_service(name=name, email=email, password=password, otp=otp, db=db)
print("Registration result:", result)

db.close()
