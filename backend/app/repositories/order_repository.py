from sqlalchemy.orm import Session
from app.models.order import Order, OrderItem, OrderStatusHistory
from typing import Optional, List, Dict, Any

class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, order_id: str) -> Optional[Order]:
        return self.db.query(Order).filter(Order.id == order_id).first()

    def get_all_by_retailer(self, retailer_id: str) -> List[Order]:
        return self.db.query(Order).filter(Order.retailer_id == retailer_id).order_by(Order.created_at.desc()).all()

    def get_all_by_supplier(self, supplier_id: str) -> List[Order]:
        return self.db.query(Order).filter(Order.supplier_id == supplier_id).order_by(Order.created_at.desc()).all()

    def create_order(
        self, 
        retailer_id: str, 
        supplier_id: str, 
        shipping_address: Dict[str, Any], 
        total_amount: float,
        retailer_order_reference: Optional[str] = None
    ) -> Order:
        order = Order(
            retailer_id=retailer_id,
            supplier_id=supplier_id,
            retailer_order_reference=retailer_order_reference,
            shipping_address=shipping_address,
            total_amount=total_amount,
            status="PENDING"
        )
        self.db.add(order)
        self.db.flush()
        
        # Log creation status
        self.add_status_history(order.id, "PENDING", "System")
        return order

    def add_order_item(self, order_id: str, variant_id: str, quantity: int, wholesale_price: float) -> OrderItem:
        item = OrderItem(
            order_id=order_id,
            variant_id=variant_id,
            quantity=quantity,
            wholesale_price_at_order=wholesale_price
        )
        self.db.add(item)
        self.db.flush()
        return item

    def update_status(self, db_obj: Order, status: str, changed_by: str, tracking_number: Optional[str] = None) -> Order:
        db_obj.status = status
        if tracking_number:
            db_obj.tracking_number = tracking_number
            
        self.db.add(db_obj)
        self.db.flush()
        
        self.add_status_history(db_obj.id, status, changed_by)
        return db_obj

    def add_status_history(self, order_id: str, status: str, changed_by: str):
        history = OrderStatusHistory(
            order_id=order_id,
            status=status,
            changed_by=changed_by
        )
        self.db.add(history)
        self.db.flush()
