from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.repositories.integration_repository import IntegrationRepository
from app.models.user import User
from app.models.retailer import Retailer
from app.services.platforms.shopify_service import ShopifyService
from typing import List
import secrets
import json
import base64

class IntegrationService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = IntegrationRepository(db)

    def get_my_integrations(self, user: User):
        retailer = self.db.query(Retailer).filter(Retailer.user_id == user.id).first()
        if not retailer:
            raise HTTPException(status_code=404, detail="Retailer not found")
        return self.repository.get_all_by_retailer(retailer.id)

    def initiate_shopify_oauth(self, user: User, shop_url: str) -> str:
        retailer = self.db.query(Retailer).filter(Retailer.user_id == user.id).first()
        if not retailer:
            raise HTTPException(status_code=404, detail="Retailer not found")
            
        # Create a state token to prevent CSRF. Encode retailer_id in state for callback parsing.
        state_data = {"retailer_id": retailer.id, "nonce": secrets.token_hex(16)}
        state_str = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()
        
        # In production, redirect_uri comes from config
        redirect_uri = "https://rozi-khan.vercel.app/api/integrations/shopify/callback"
        
        return ShopifyService.generate_install_url(shop_url, state_str, redirect_uri)

    def process_shopify_callback(self, shop: str, code: str, state: str):
        try:
            # Parse state to get retailer_id
            state_json = base64.urlsafe_b64decode(state.encode()).decode()
            state_data = json.loads(state_json)
            retailer_id = state_data.get("retailer_id")
            
            if not retailer_id:
                raise ValueError("Invalid state parameter")
                
            # Exchange code for permanent token
            access_token = ShopifyService.exchange_token(shop, code)
            
            # Save to DB
            integration = self.repository.create_or_update(
                retailer_id=retailer_id,
                platform_name="shopify",
                shop_url=shop,
                access_token=access_token
            )
            self.db.commit()
            return integration
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=400, detail=f"OAuth failed: {str(e)}")
