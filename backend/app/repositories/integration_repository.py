from sqlalchemy.orm import Session
from app.models.integration import PlatformIntegration
from typing import Optional, List

class IntegrationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, integration_id: str) -> Optional[PlatformIntegration]:
        return self.db.query(PlatformIntegration).filter(PlatformIntegration.id == integration_id).first()

    def get_all_by_retailer(self, retailer_id: str) -> List[PlatformIntegration]:
        return self.db.query(PlatformIntegration).filter(PlatformIntegration.retailer_id == retailer_id).all()

    def get_active_by_retailer(self, retailer_id: str) -> List[PlatformIntegration]:
        return self.db.query(PlatformIntegration).filter(
            PlatformIntegration.retailer_id == retailer_id,
            PlatformIntegration.status == "ACTIVE"
        ).all()

    def create_or_update(self, retailer_id: str, platform_name: str, shop_url: str, access_token: str) -> PlatformIntegration:
        integration = self.db.query(PlatformIntegration).filter(
            PlatformIntegration.retailer_id == retailer_id,
            PlatformIntegration.platform_name == platform_name,
            PlatformIntegration.shop_url == shop_url
        ).first()

        if integration:
            integration.access_token = access_token
            integration.status = "ACTIVE"
        else:
            integration = PlatformIntegration(
                retailer_id=retailer_id,
                platform_name=platform_name,
                shop_url=shop_url,
                access_token=access_token,
                status="ACTIVE"
            )
            self.db.add(integration)
            
        self.db.flush()
        return integration
