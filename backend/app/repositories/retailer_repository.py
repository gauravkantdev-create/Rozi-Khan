from sqlalchemy.orm import Session
from app.models.retailer import Retailer, RetailerSetting, RetailerSubscription
from app.schemas.retailer import RetailerCreate, RetailerUpdate, RetailerSettingUpdate
from typing import Optional, List

class RetailerRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, retailer_id: str) -> Optional[Retailer]:
        return self.db.query(Retailer).filter(Retailer.id == retailer_id).first()

    def get_all(self, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[Retailer]:
        query = self.db.query(Retailer)
        if status:
            query = query.filter(Retailer.verification_status == status)
        return query.offset(skip).limit(limit).all()

    def get_by_user_id(self, user_id: str) -> Optional[Retailer]:
        return self.db.query(Retailer).filter(Retailer.user_id == user_id).first()

    def create(self, user_id: str, obj_in: RetailerCreate) -> Retailer:
        db_obj = Retailer(
            user_id=user_id,
            store_name=obj_in.store_name,
            business_registration_number=obj_in.business_registration_number
        )
        self.db.add(db_obj)
        self.db.flush()  # Flush to get ID, but leave commit to service UoW
        return db_obj

    def update(self, db_obj: Retailer, obj_in: RetailerUpdate) -> Retailer:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.flush()
        return db_obj

    def update_status(self, retailer_id: str, status: str) -> Optional[Retailer]:
        db_obj = self.get_by_id(retailer_id)
        if db_obj:
            db_obj.status = status
            self.db.add(db_obj)
            self.db.flush()
        return db_obj

    def get_settings(self, retailer_id: str) -> Optional[RetailerSetting]:
        return self.db.query(RetailerSetting).filter(RetailerSetting.retailer_id == retailer_id).first()

    def create_settings(self, retailer_id: str) -> RetailerSetting:
        db_settings = RetailerSetting(retailer_id=retailer_id)
        self.db.add(db_settings)
        self.db.flush()
        return db_settings

    def update_settings(self, db_settings: RetailerSetting, obj_in: RetailerSettingUpdate) -> RetailerSetting:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_settings, field, value)
        self.db.add(db_settings)
        self.db.flush()
        return db_settings

    def create_subscription(self, retailer_id: str) -> RetailerSubscription:
        db_sub = RetailerSubscription(retailer_id=retailer_id)
        self.db.add(db_sub)
        self.db.flush()
        return db_sub
