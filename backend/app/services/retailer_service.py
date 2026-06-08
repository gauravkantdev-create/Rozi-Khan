from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.repositories.retailer_repository import RetailerRepository
from app.schemas.retailer import RetailerCreate, RetailerUpdate, RetailerSettingUpdate, RetailerResponse
from app.models.user import User
from app.policies.retailer_policy import RetailerPolicy
from app.events.retailer_events import RetailerEvents

class RetailerService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = RetailerRepository(db)

    def create_profile(self, user: User, data: RetailerCreate) -> RetailerResponse:
        try:
            existing = self.repository.get_by_user_id(user.id)
            if existing:
                raise HTTPException(status_code=400, detail="Retailer profile already exists")
            
            retailer = self.repository.create(user_id=user.id, obj_in=data)
            self.repository.create_settings(retailer.id)
            self.repository.create_subscription(retailer.id)
            
            self.db.commit()
            self.db.refresh(retailer)
            
            RetailerEvents.on_retailer_registered(user.email)
            return retailer
            
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def get_profile(self, user: User) -> RetailerResponse:
        retailer = self.repository.get_by_user_id(user.id)
        if not retailer:
            raise HTTPException(status_code=404, detail="Retailer profile not found")
            
        RetailerPolicy.enforce(RetailerPolicy.can_read_profile(user, retailer))
        return retailer

    def update_profile(self, user: User, data: RetailerUpdate) -> RetailerResponse:
        try:
            retailer = self.repository.get_by_user_id(user.id)
            if not retailer:
                raise HTTPException(status_code=404, detail="Retailer profile not found")
                
            RetailerPolicy.enforce(RetailerPolicy.can_update_profile(user, retailer))
            
            updated = self.repository.update(db_obj=retailer, obj_in=data)
            self.db.commit()
            self.db.refresh(updated)
            return updated
            
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def update_status(self, admin_user: User, retailer_id: str, new_status: str):
        RetailerPolicy.enforce(RetailerPolicy.can_update_status(admin_user))
        
        if new_status not in ["ACTIVE", "SUSPENDED"]:
            raise HTTPException(status_code=400, detail="Invalid status")
            
        try:
            retailer = self.repository.update_status(retailer_id, new_status)
            if not retailer:
                raise HTTPException(status_code=404, detail="Retailer not found")
            
            self.db.commit()
            self.db.refresh(retailer)
            
            if new_status == "SUSPENDED":
                RetailerEvents.on_retailer_suspended(retailer.id)
            elif new_status == "ACTIVE":
                RetailerEvents.on_retailer_activated(retailer.id)
                
            return retailer
            
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
