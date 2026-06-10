from app.database import SessionLocal
from app.models.user import User
from app.services.auth import _is_bcrypt_hash, verify_password
from passlib.hash import sha256_crypt

db = SessionLocal()
try:
    users = db.query(User).all()
    for u in users:
        is_bcrypt = _is_bcrypt_hash(u.password)
        is_sha256 = u.password.startswith("$5$")
        print(f"Email: {u.email}")
        print(f"  Hash: {u.password}")
        print(f"  Is Bcrypt: {is_bcrypt}")
        print(f"  Is Sha256: {is_sha256}")
        
        # Test default password
        try:
            ver = verify_password("Password123!", u.password)
            print(f"  Verifies with 'Password123!': {ver}")
        except Exception as e:
            print(f"  Verification error: {e}")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
