from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()
try:
    users = db.query(User).all()
    print(f"Total users found: {len(users)}")
    for u in users:
        print(f"ID: {u.id} | Name: {u.name} | Email: {u.email} | Role: {u.role} | Verified: {u.is_email_verified} | Password Hash: {u.password}")
except Exception as e:
    print("Error querying users:", e)
finally:
    db.close()
