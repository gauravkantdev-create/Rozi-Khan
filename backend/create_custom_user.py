import sys
from app.database import SessionLocal
from app.models.user import User
from app.services.auth import hash_password
from app.utils.helpers import generate_object_id

def create_or_update_user(email: str, password: str, name: str = "Custom User", role: str = "admin"):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.lower().strip()).first()
        hashed = hash_password(password)
        if user:
            user.password = hashed
            user.name = name
            user.role = role
            user.is_email_verified = True
            db.commit()
            print(f"✅ Successfully updated password/details for existing user: {email}")
        else:
            new_user = User(
                id=generate_object_id(),
                name=name,
                email=email.lower().strip(),
                password=hashed,
                role=role,
                is_email_verified=True
            )
            db.add(new_user)
            db.commit()
            print(f"✅ Successfully created new user: {email}")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_custom_user.py <email> <password> [name] [role]")
        print("Example: python create_custom_user.py testuser@example.com MySecurePassword123 'Test User' admin")
    else:
        email = sys.argv[1]
        password = sys.argv[2]
        name = sys.argv[3] if len(sys.argv) > 3 else "Custom User"
        role = sys.argv[4] if len(sys.argv) > 4 else "admin"
        create_or_update_user(email, password, name, role)
