from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.middleware.auth import AuthorizeRoles
from app.schemas.analytics import AdminAnalyticsResponse, SupplierAnalyticsResponse, RetailerAnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(tags=["Analytics"])

@router.get("/analytics/admin", response_model=AdminAnalyticsResponse)
def get_admin_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("admin"))
):
    service = AnalyticsService(db)
    return service.get_admin_dashboard()

@router.get("/analytics/supplier", response_model=SupplierAnalyticsResponse)
def get_supplier_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("supplier"))
):
    service = AnalyticsService(db)
    return service.get_supplier_dashboard(user=current_user)

@router.get("/analytics/retailer", response_model=RetailerAnalyticsResponse)
def get_retailer_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthorizeRoles("retailer"))
):
    service = AnalyticsService(db)
    return service.get_retailer_dashboard(user=current_user)
