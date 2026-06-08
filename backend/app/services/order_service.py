from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.repositories.order_repository import OrderRepository
from app.models.user import User
from app.models.retailer import Retailer
from app.models.product import ProductVariant, Product
from app.schemas.order import CartCheckoutRequest, OrderShipRequest
from app.policies.order_policy import OrderPolicy
from app.events.order_events import OrderEvents
from app.services.inventory_service import InventoryService
from app.services.payment_service import PaymentService
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = OrderRepository(db)
        self.inventory_service = InventoryService(db)
        self.payment_service = PaymentService(db)

    def checkout_cart(self, user: User, data: CartCheckoutRequest):
        """
        The core engine of Rozi Khan:
        Takes a multi-item cart, groups items by Supplier, allocates inventory atomically,
        and creates an independent Order for each Supplier.
        """
        try:
            retailer = self.db.query(Retailer).filter(Retailer.user_id == user.id).first()
            if not retailer:
                raise HTTPException(status_code=404, detail="Retailer not found")

            # 1. Group items by Supplier
            supplier_groups = defaultdict(list)
            for item in data.items:
                variant = self.db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
                if not variant:
                    raise HTTPException(status_code=404, detail=f"Variant {item.variant_id} not found")
                
                product = self.db.query(Product).filter(Product.id == variant.product_id).first()
                supplier_groups[product.supplier_id].append({
                    "variant_id": item.variant_id,
                    "quantity": item.quantity,
                    "wholesale_price": variant.wholesale_price
                })

            created_orders = []

            # 2. Process each Supplier Order independently but within the same overarching DB transaction
            for supplier_id, items in supplier_groups.items():
                total_amount = sum(i["quantity"] * i["wholesale_price"] for i in items)
                
                # Create the Order header
                order = self.repository.create_order(
                    retailer_id=retailer.id,
                    supplier_id=supplier_id,
                    shipping_address=data.shipping_address,
                    total_amount=total_amount,
                    retailer_order_reference=data.retailer_order_reference
                )

                # Add items and allocate inventory
                for item in items:
                    # CRITICAL: Atomic Inventory Deduction (M6)
                    try:
                        self.inventory_service.allocate_stock(
                            variant_id=item["variant_id"], 
                            quantity=item["quantity"]
                        )
                    except HTTPException as e:
                        # If inventory fails, rollback the entire transaction
                        logger.error(f"Inventory allocation failed for Variant {item['variant_id']}")
                        raise HTTPException(status_code=400, detail=f"Out of stock for variant {item['variant_id']}")

                    self.repository.add_order_item(
                        order_id=order.id,
                        variant_id=item["variant_id"],
                        quantity=item["quantity"],
                        wholesale_price=item["wholesale_price"]
                    )

                # CRITICAL (M9): Deduct Wallet. If it fails, raises HTTP 402 and rolls back.
                self.payment_service.deduct_wallet_for_order(
                    retailer_id=retailer.id,
                    amount=float(total_amount),
                    order_id=order.id
                )

                created_orders.append(order)

            # 3. Commit the mega-transaction
            self.db.commit()

            # 4. Dispatch Events
            for order in created_orders:
                self.db.refresh(order)
                OrderEvents.on_order_created(order.id, order.supplier_id)

            return created_orders

        except Exception as e:
            self.db.rollback()
            raise

    def get_retailer_orders(self, user: User):
        retailer = self.db.query(Retailer).filter(Retailer.user_id == user.id).first()
        if not retailer:
            raise HTTPException(status_code=404, detail="Retailer not found")
        return self.repository.get_all_by_retailer(retailer.id)

    def get_supplier_orders(self, user: User):
        supplier = self.db.query(Supplier).filter(Supplier.user_id == user.id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return self.repository.get_all_by_supplier(supplier.id)

    def get_order(self, user: User, order_id: str):
        order = self.repository.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
        # ABAC Policy Check
        if user.role == "retailer":
            OrderPolicy.enforce(OrderPolicy.can_retailer_view(user, order, self.db))
        elif user.role == "supplier":
            OrderPolicy.enforce(OrderPolicy.can_supplier_manage(user, order, self.db))
            
        return order

    def ship_order(self, user: User, order_id: str, data: OrderShipRequest):
        order = self.repository.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
        OrderPolicy.enforce(OrderPolicy.can_supplier_manage(user, order, self.db))
        
        if order.status not in ["PENDING", "PROCESSING"]:
            raise HTTPException(status_code=400, detail="Order cannot be shipped from its current state")
            
        updated = self.repository.update_status(
            db_obj=order, 
            status="SHIPPED", 
            changed_by="Supplier", 
            tracking_number=data.tracking_number
        )
        
        # CRITICAL (M9): Generate Payout for Supplier
        self.payment_service.create_supplier_payout(
            supplier_id=order.supplier_id,
            order_id=order.id,
            order_amount=float(order.total_amount)
        )
        
        self.db.commit()
        
        OrderEvents.on_order_shipped(updated.id, updated.tracking_number)
        return updated
