from sqlalchemy import create_engine
from app.database import Base
from app.models import *

local_engine = create_engine("postgresql://postgres:postgres@localhost:5432/rozikhan")
Base.metadata.create_all(bind=local_engine)
print("Local DB Tables created!")
