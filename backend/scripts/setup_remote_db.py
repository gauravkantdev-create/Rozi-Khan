import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the database URL
db_url = os.getenv("DATABASE_URL")

if not db_url or "localhost" in db_url:
    print("❌ Please update your local backend/.env file so that DATABASE_URL points to your live Render PostgreSQL URL before running this script.")
    sys.exit(1)

print(f"Connecting to database...")

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print("Executing migrations/001_initial_schema.sql...")
        with open("migrations/001_initial_schema.sql", "r") as f:
            sql_script = f.read()
            # Execute the raw SQL
            conn.execute(text(sql_script))
            conn.commit()
            
    print("✅ Successfully created tables in the Render database!")
except Exception as e:
    print(f"❌ Error creating tables: {e}")
