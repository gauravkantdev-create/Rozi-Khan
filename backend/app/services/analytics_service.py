from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.supplier import Supplier
from app.models.retailer import Retailer
from app.models.order import Order, OrderItem
from app.models.payment import Wallet, Transaction, Payout
from app.models.retailer_listing import RetailerListing
from fastapi import HTTPException
from collections import defaultdict

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def _get_supplier(self, user: User) -> Supplier:
        supplier = self.db.query(Supplier).filter(Supplier.user_id == user.id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return supplier

    def _get_retailer(self, user: User) -> Retailer:
        retailer = self.db.query(Retailer).filter(Retailer.user_id == user.id).first()
        if not retailer:
            raise HTTPException(status_code=404, detail="Retailer not found")
        return retailer

    def get_admin_dashboard(self):
        # Total GMV
        total_gmv = self.db.query(func.sum(Order.total_amount)).scalar() or 0.0
        
        # Total Revenue (Assuming flat 5% commission taken from payouts)
        # Revenue = GMV - Payouts
        total_payouts = self.db.query(func.sum(Payout.amount)).scalar() or 0.0
        total_revenue = float(total_gmv) - float(total_payouts)

        # Active Users
        active_suppliers = self.db.query(func.count(Supplier.id)).filter(Supplier.verification_status == "APPROVED").scalar() or 0
        active_retailers = self.db.query(func.count(Retailer.id)).filter(Retailer.verification_status == "APPROVED").scalar() or 0

        # Orders by status
        orders_by_status = dict(
            self.db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
        )

        return {
            "total_platform_gmv": float(total_gmv),
            "total_platform_revenue": float(total_revenue),
            "active_suppliers": active_suppliers,
            "active_retailers": active_retailers,
            "orders_by_status": orders_by_status
        }

    def get_supplier_dashboard(self, user: User):
        supplier = self._get_supplier(user)

        # Total Sales Revenue (Orders marked SHIPPED or DELIVERED)
        total_sales = self.db.query(func.sum(Order.total_amount)).filter(
            Order.supplier_id == supplier.id,
            Order.status.in_(["SHIPPED", "DELIVERED"])
        ).scalar() or 0.0

        # Pending Payouts
        pending_payouts = self.db.query(func.sum(Payout.amount)).filter(
            Payout.supplier_id == supplier.id,
            Payout.status == "PENDING"
        ).scalar() or 0.0

        # Total Orders Fulfilled
        orders_fulfilled = self.db.query(func.count(Order.id)).filter(
            Order.supplier_id == supplier.id,
            Order.status.in_(["SHIPPED", "DELIVERED"])
        ).scalar() or 0

        # Top Selling Variants
        top_variants = self.db.query(
            OrderItem.variant_id, 
            func.sum(OrderItem.quantity).label("total_quantity")
        ).join(Order).filter(
            Order.supplier_id == supplier.id
        ).group_by(OrderItem.variant_id).order_by(func.sum(OrderItem.quantity).desc()).limit(5).all()

        top_variants_list = [{"variant_id": v.variant_id, "total_quantity_sold": v.total_quantity} for v in top_variants]

        return {
            "total_sales_revenue": float(total_sales),
            "pending_payouts_total": float(pending_payouts),
            "total_orders_fulfilled": orders_fulfilled,
            "top_selling_variants": top_variants_list
        }

    def get_retailer_dashboard(self, user: User):
        retailer = self._get_retailer(user)

        # Total Inventory Spend
        total_spend = self.db.query(func.sum(Order.total_amount)).filter(
            Order.retailer_id == retailer.id,
            Order.status != "CANCELLED"
        ).scalar() or 0.0

        # Wallet Balance
        wallet = self.db.query(Wallet).filter(Wallet.retailer_id == retailer.id).first()
        wallet_balance = wallet.balance if wallet else 0.0

        # Active Listings
        active_listings = self.db.query(func.count(RetailerListing.id)).filter(
            RetailerListing.retailer_id == retailer.id,
            RetailerListing.status == "ACTIVE"
        ).scalar() or 0

        # Total Orders Placed
        total_orders = self.db.query(func.count(Order.id)).filter(
            Order.retailer_id == retailer.id
        ).scalar() or 0

        return {
            "total_inventory_spend": float(total_spend),
            "wallet_balance": float(wallet_balance),
            "active_listings_count": active_listings,
            "total_orders_placed": total_orders
        }
