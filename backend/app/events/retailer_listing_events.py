import logging

logger = logging.getLogger(__name__)

class RetailerListingEvents:
    @staticmethod
    def on_listing_imported(listing_id: str):
        logger.info(f"Event Triggered: RetailerProductImported for listing {listing_id}")
        # Dispatch Celery task to push to Shopify
        pass

    @staticmethod
    def on_price_override_changed(listing_id: str):
        logger.info(f"Event Triggered: RetailerPriceOverrideChanged for listing {listing_id}")
        # Dispatch Celery task to sync price to Shopify
        pass

    @staticmethod
    def on_listing_disabled_or_removed(listing_id: str):
        logger.info(f"Event Triggered: RetailerListingDisabled for listing {listing_id}")
        # Dispatch Celery task to hide item on Shopify
        pass
