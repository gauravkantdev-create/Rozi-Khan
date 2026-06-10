import urllib.request
import json
import sqlite3
from app.database import SessionLocal
from app.models.email_otp import EmailOtp

# 1. Send OTP request to the running backend
url = "http://127.0.0.1:8000/api/auth/send-otp"
data = {"email": "find_db_test@rozikhan.com"}

req = urllib.request.Request(
    url,
    data=json.dumps(data).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)

print("Sending OTP request to running backend...")
try:
    with urllib.request.urlopen(req) as response:
        print(f"Backend response status: {response.status}")
        print("Response:", response.read().decode("utf-8"))
except Exception as e:
    print("Error sending OTP request:", e)

# 2. Check local SQLite database (dev.db)
print("\n--- Checking Local SQLite (dev.db) ---")
try:
    conn = sqlite3.connect("dev.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM email_otps WHERE email='find_db_test@rozikhan.com';")
    rows = cursor.fetchall()
    print(f"Found {len(rows)} records in SQLite dev.db:")
    for r in rows:
        print(r)
    conn.close()
except Exception as e:
    print("SQLite check failed:", e)

# 3. Check configured PostgreSQL database (via app.database settings)
print("\n--- Checking Configured PostgreSQL ---")
try:
    db = SessionLocal()
    otps = db.query(EmailOtp).filter(EmailOtp.email == "find_db_test@rozikhan.com").all()
    print(f"Found {len(otps)} records in PostgreSQL:")
    for o in otps:
        print(f"Email: {o.email} | OTP: {o.otp} | Expires: {o.expires_at}")
    db.close()
except Exception as e:
    print("PostgreSQL check failed:", e)
