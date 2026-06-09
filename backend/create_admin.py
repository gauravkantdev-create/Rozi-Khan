from app.database import SessionLocal
from app.models.user import User
from app.services.auth import hash_password
from app.utils.helpers import generate_object_id

db = SessionLocal()
existing = db.query(User).filter(User.email == "admin@rozikhan.com").first()
if not existing:
    user = User(
        id=generate_object_id(),
        name="Admin",
        email="admin@rozikhan.com",
        password=hash_password("Password123!"),
        role="admin",  # Assuming role is admin
        is_email_verified=True
    )
    db.add(user)
    db.commit()
    print("User created successfully")
else:
    print("User already exists")
