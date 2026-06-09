from sqlalchemy.orm import Session
from app.models.supplier import Supplier, SupplierDocument, SupplierSetting
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierDocumentCreate
from typing import Optional, List

class SupplierRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, supplier_id: str) -> Optional[Supplier]:
        return self.db.query(Supplier).filter(Supplier.id == supplier_id).first()

    def get_all(self, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[Supplier]:
        query = self.db.query(Supplier)
        if status:
            query = query.filter(Supplier.verification_status == status)
        return query.offset(skip).limit(limit).all()

    def get_by_user_id(self, user_id: str) -> Optional[Supplier]:
        return self.db.query(Supplier).filter(Supplier.user_id == user_id).first()

    def create(self, user_id: str, obj_in: SupplierCreate) -> Supplier:
        db_obj = Supplier(
            user_id=user_id,
            company_name=obj_in.company_name,
            tax_id=obj_in.tax_id,
            warehouse_address=obj_in.warehouse_address
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Supplier, obj_in: SupplierUpdate) -> Supplier:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update_verification_status(self, supplier_id: str, status: str) -> Optional[Supplier]:
        db_obj = self.get_by_id(supplier_id)
        if db_obj:
            db_obj.verification_status = status
            self.db.add(db_obj)
            self.db.commit()
            self.db.refresh(db_obj)
        return db_obj

    def add_document(self, supplier_id: str, doc_in: SupplierDocumentCreate) -> SupplierDocument:
        db_doc = SupplierDocument(
            supplier_id=supplier_id,
            document_type=doc_in.document_type,
            file_url=doc_in.file_url
        )
        self.db.add(db_doc)
        self.db.commit()
        self.db.refresh(db_doc)
        return db_doc

    def get_documents(self, supplier_id: str) -> List[SupplierDocument]:
        return self.db.query(SupplierDocument).filter(SupplierDocument.supplier_id == supplier_id).all()

    def get_settings(self, supplier_id: str) -> Optional[SupplierSetting]:
        return self.db.query(SupplierSetting).filter(SupplierSetting.supplier_id == supplier_id).first()

    def create_settings(self, supplier_id: str) -> SupplierSetting:
        db_settings = SupplierSetting(supplier_id=supplier_id)
        self.db.add(db_settings)
        self.db.commit()
        self.db.refresh(db_settings)
        return db_settings
