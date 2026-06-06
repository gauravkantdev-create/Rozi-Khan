from fastapi import APIRouter, Depends, Request, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.platforms.shopify_service import ShopifyService
import logging

logger = logging.getLogger(__name__)

# This router is strictly for unauthenticated, HMAC-verified incoming webhooks.
router = APIRouter(tags=["Webhooks"])

@router.post("/webhooks/shopify")
async def shopify_webhook_receiver(
    request: Request,
    x_shopify_topic: str = Header(None),
    x_shopify_shop_domain: str = Header(None),
    x_shopify_hmac_sha256: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Ingests all webhooks from Shopify.
    MUST pass HMAC signature verification.
    """
    # 1. Read raw body for HMAC check
    body = await request.body()
    
    # 2. Verify Cryptographic Signature
    if not ShopifyService.verify_webhook(body, x_shopify_hmac_sha256):
        logger.warning(f"Invalid Webhook Signature from {x_shopify_shop_domain}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid HMAC signature")

    # 3. Parse JSON
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # 4. Route based on topic
    logger.info(f"Received Valid Webhook: {x_shopify_topic} from {x_shopify_shop_domain}")
    
    if x_shopify_topic == "orders/create":
        # Hand off to Order Service (M8)
        pass
    elif x_shopify_topic == "app/uninstalled":
        # Disconnect integration in DB
        pass

    return {"status": "success"}
