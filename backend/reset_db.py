from database import engine, Base
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os

print("Dropping and recreating public schema...")
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Vivek%402006@localhost:5432/scaler_ag")

try:
    conn = psycopg2.connect(SQLALCHEMY_DATABASE_URL)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    cursor.execute("DROP SCHEMA public CASCADE;")
    cursor.execute("CREATE SCHEMA public;")
    cursor.close()
    conn.close()
    print("Database reset complete.")
except Exception as e:
    print(f"Error resetting database: {e}")
