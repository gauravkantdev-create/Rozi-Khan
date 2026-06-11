import jwt
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import Optional

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.utils.roles import get_user_role

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized, token missing"
        )
    
    token = authorization.split(" ")[1]
    
    try:
        decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = decoded.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authorized, token invalid"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized, token failed"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorized, user not found"
        )
    
    # Expose role utility check
    user.role = get_user_role(user)
    return user


def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    
    try:
        decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = decoded.get("id")
        if not user_id:
            return None
    except jwt.PyJWTError:
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    
    user.role = get_user_role(user)
    return user


class AuthorizeRoles:
    def __init__(self, *roles: str):
        self.roles = roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        user_role = get_user_role(current_user)
        if user_role not in self.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: insufficient permissions"
            )
        return current_user
