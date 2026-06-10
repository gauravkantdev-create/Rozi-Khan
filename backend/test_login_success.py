from app.services.auth import login_user_service
from app.database import SessionLocal

db = SessionLocal()
try:
    res = login_user_service("admin@rozikhan.com", "Password123!", db)
    print("Success! Result:")
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
