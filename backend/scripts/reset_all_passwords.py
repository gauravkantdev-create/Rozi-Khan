import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

# Use sha256_crypt to avoid bcrypt backend issues
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

NEW_PASSWORD = "user123"

def reset_passwords():
    db = SessionLocal()
    users = db.query(User).all()
    for user in users:
        # Hash password with sha256_crypt (bcrypt backend problematic in this env)
        user.password = pwd_context.hash(NEW_PASSWORD)
    db.commit()
    print(f"Updated password for {len(users)} users to '{NEW_PASSWORD}'.")

if __name__ == "__main__":
    reset_passwords()
