from app.database import engine
from sqlalchemy import inspect, create_engine

local_engine = create_engine("postgresql://postgres:postgres@localhost:5432/rozikhan")
try:
    inspector = inspect(local_engine)
    print("Local DB Tables:", inspector.get_table_names())
except Exception as e:
    print("Error:", e)
