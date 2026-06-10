import sqlite3

try:
    conn = sqlite3.connect("dev.db")
    cursor = conn.cursor()
    
    # List tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    print("SQLite Tables:", tables)
    
    if "users" in tables:
        cursor.execute("SELECT id, name, email, role, is_email_verified, password FROM users;")
        users = cursor.fetchall()
        print(f"Total SQLite users: {len(users)}")
        for u in users:
            print(f"ID: {u[0]} | Name: {u[1]} | Email: {u[2]} | Role: {u[3]} | Verified: {u[4]} | Password Hash: {u[5]}")
    else:
        print("No users table in SQLite.")
    conn.close()
except Exception as e:
    print("SQLite check failed:", e)
