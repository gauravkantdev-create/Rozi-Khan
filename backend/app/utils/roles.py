VALID_ROLES = ["admin", "seller", "supplier", "user"]

def get_user_role(user) -> str:
    if not user:
        return "user"
    
    # Check top-level attribute
    role = getattr(user, "role", "user")
    if role in VALID_ROLES:
        return role
        
    return "user"
