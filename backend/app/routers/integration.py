from fastapi import APIRouter, Depends, status, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.integration import IntegrationConnect, IntegrationResponse
from app.services.integration_service import IntegrationService
from app.middleware.auth import AuthorizeRoles

router = APIRouter(tags=["Integrations"])

@router.get("/integrations", response_model=List[IntegrationResponse])
def get_my_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer"))
):
    service = IntegrationService(db)
    return service.get_my_integrations(user=current_user)

@router.post("/integrations/shopify/install")
def install_shopify(
    data: IntegrationConnect,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer"))
):
    """
    Returns the Shopify OAuth authorize URL. 
    The frontend should redirect the user to this URL.
    """
    service = IntegrationService(db)
    auth_url = service.initiate_shopify_oauth(user=current_user, shop_url=data.shop_url)
    return {"auth_url": auth_url}

@router.get("/integrations/shopify/callback")
def shopify_callback(
    shop: str = Query(...),
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Public endpoint. Shopify redirects here after the user approves the app.
    """
    service = IntegrationService(db)
    service.process_shopify_callback(shop=shop, code=code, state=state)
    
    # Redirect back to the React frontend dashboard
    return RedirectResponse(url="https://rozi-khan.vercel.app/dashboard/settings/integrations?status=success")
