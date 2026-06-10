from app.services.auth import verify_password

hashed = "$2b$12$k1n7Z5MUg7eBPlaA4k11TuGTvwmZNGsRLrT9qnVfeddsGXgeKu.R."
plain = "Password123!"

try:
    result = verify_password(plain, hashed)
    print("Verification result:", result)
except Exception as e:
    import traceback
    print("Verification failed with error:")
    traceback.print_exc()
