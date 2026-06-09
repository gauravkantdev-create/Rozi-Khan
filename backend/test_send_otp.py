#!/usr/bin/env python
import sys
import os
sys.path.insert(0, os.getcwd())

from sqlalchemy import inspect
from app.database import SessionLocal, engine, Base
import app.models as models

# Check tables
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tables in database: {tables}")

for table in tables:
    columns = [c["name"] for c in inspector.get_columns(table)]
    print(f"  {table}: {columns}")

# Try calling send_otp service
print("\n--- Testing send_otp_service ---")
from app.services.auth import send_register_otp_service

db = SessionLocal()
try:
    result = send_register_otp_service("debug@test.com", db)
    print(f"Success: {result}")
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
finally:
    db.close()
