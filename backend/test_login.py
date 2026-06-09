from app.services.auth import login_user_service
from app.database import SessionLocal
db = SessionLocal()
try:
    login_user_service("admin@rozikhan.com", "password", db)
except Exception as e:
    import traceback
    traceback.print_exc()
