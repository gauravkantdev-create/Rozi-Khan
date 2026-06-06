import logging

logger = logging.getLogger(__name__)

# Placeholder for Celery tasks
# from app.tasks.product_tasks import disable_products_task
# from app.tasks.email_tasks import send_welcome_email_task

class SupplierEvents:
    @staticmethod
    def on_supplier_suspended(supplier_id: str):
        logger.info(f"Event Triggered: SupplierSuspended for supplier {supplier_id}")
        # Dispatch async task
        # disable_products_task.delay(supplier_id)
        pass

    @staticmethod
    def on_supplier_approved(supplier_email: str):
        logger.info(f"Event Triggered: SupplierApproved for email {supplier_email}")
        # Dispatch async task
        # send_welcome_email_task.delay(supplier_email)
        pass
