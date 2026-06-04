import os
import time
import re

PASSWORD_RULE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$")
EMAIL_RULE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

def generate_object_id() -> str:
    """
    Generates a 24-character hexadecimal string compatible with MongoDB ObjectId format.
    4 bytes (timestamp) + 5 bytes (random) + 3 bytes (counter/random) = 12 bytes = 24 hex characters.
    """
    timestamp = int(time.time())
    timestamp_bytes = timestamp.to_bytes(4, byteorder='big')
    random_bytes = os.urandom(5)
    counter_bytes = os.urandom(3)
    oid_bytes = timestamp_bytes + random_bytes + counter_bytes
    return oid_bytes.hex()

def is_strong_password(password: str) -> bool:
    return bool(PASSWORD_RULE.match(password))

def normalize_email(email: str) -> str:
    if not email:
        return ""
    return email.lower().strip()

def is_valid_email(email: str) -> bool:
    if not email:
        return False
    return bool(EMAIL_RULE.match(email))
