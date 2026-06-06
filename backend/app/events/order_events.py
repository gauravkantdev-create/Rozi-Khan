import logging

logger = logging.getLogger(__name__)

class OrderEvents:
    @staticmethod
    def on_order_created(order_id: str, supplier_id: str):
        logger.info(f"Event Triggered: OrderRoutedToSupplier for order {order_id} to supplier {supplier_id}")
        # In the future, this dispatches a Celery task to email the supplier
        pass

    @staticmethod
    def on_order_shipped(order_id: str, tracking_number: str):
        logger.info(f"Event Triggered: OrderShipped for order {order_id}. Tracking: {tracking_number}")
        # In the future, this dispatches a Celery task to push webhook back to Retailer's Shopify
        pass

    @staticmethod
    def on_order_cancelled(order_id: str):
        logger.info(f"Event Triggered: OrderCancelled for order {order_id}")
        # Triggers Inventory un-allocation
        pass
