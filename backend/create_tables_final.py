from app.database import engine, Base
from app.models import *

print("Tables to be created:")
for t in Base.metadata.tables.keys():
    print(" -", t)

Base.metadata.create_all(bind=engine)
print("Creation executed!")
