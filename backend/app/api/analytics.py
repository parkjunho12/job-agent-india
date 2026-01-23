"""
Analytics API Router
Track events and view metrics (admin only)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models.user import User
from app.api.auth import get_current_user
from app.services.analytics_service import AnalyticsService

from app.utils.config import settings

router = APIRouter()


# ============================================
# Request/Response Models
# ============================================

class EventTrackRequest(BaseModel):
    event_type: str
    event_category: str
    event_action: str
    event_label: Optional[str] = None
    event_data: Optional[dict] = None
    page_url: Optional[str] = None
    referrer: Optional[str] = None


# ============================================
# Event Tracking Endpoints
# ============================================

@router.post("/track")
async def track_event(
    request: Request,
    event: EventTrackRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Track a single event (authenticated or anonymous)
    """
    analytics = AnalyticsService(db)
    
    # Extract session ID from headers or generate
    session_id = request.headers.get('X-Session-ID')
    
    result = analytics.track_event(
        event_type=event.event_type,
        event_category=event.event_category,
        event_action=event.event_action,
        user_id=current_user.id if current_user else None,
        session_id=session_id,
        event_label=event.event_label,
        event_data=event.event_data,
        page_url=event.page_url,
        referrer=event.referrer,
        user_agent=request.headers.get('User-Agent'),
        ip_address=request.client.host
    )
    
    return {
        "success": True,
        "event_id": result.id
    }


# ============================================
# Metrics Endpoints (Admin)
# ============================================

@router.get("/overview")
async def get_overview(
    days: int = 14,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get overview metrics (admin only)
    """
    # Simple admin check (you can make this more robust)
    if current_user.email not in settings.ADMIN_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
        
    
    
    analytics = AnalyticsService(db)
    return analytics.get_overview_metrics(days=days)


@router.get("/daily/{date}")
async def get_daily_metrics(
    date: str,  # Format: YYYY-MM-DD
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get metrics for a specific day (admin only)
    """
    if current_user.email not in settings.ADMIN_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    analytics = AnalyticsService(db)
    
    try:
        target_date = datetime.strptime(date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    metrics = analytics.calculate_daily_metrics(target_date)
    
    return {
        "date": metrics.date.strftime('%Y-%m-%d'),
        "signups": metrics.new_signups,
        "active_users": metrics.active_users,
        "jobs_added": metrics.total_jobs_added,
        "analyses": metrics.total_analyses,
        "premium_views": metrics.total_premium_views,
        "generations": metrics.total_generations,
        "conversions": metrics.new_conversions,
        "revenue": metrics.conversion_revenue,
        "funnel": {
            "signup_to_job": metrics.signup_to_first_job_rate,
            "job_to_analysis": metrics.first_job_to_analysis_rate,
            "analysis_to_premium": metrics.analysis_to_premium_rate,
            "premium_to_conversion": metrics.premium_to_conversion_rate,
            "overall_conversion": metrics.overall_conversion_rate
        },
        "averages": {
            "analyses_per_user": metrics.avg_analyses_per_user,
            "days_to_conversion": metrics.avg_days_to_conversion
        }
    }


@router.post("/calculate-daily")
async def calculate_daily_metrics(
    date: Optional[str] = None,  # YYYY-MM-DD, defaults to yesterday
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually trigger daily metrics calculation (admin only)
    """
    if current_user.email not in settings.ADMIN_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    analytics = AnalyticsService(db)
    
    if date:
        target_date = datetime.strptime(date, '%Y-%m-%d')
    else:
        target_date = datetime.utcnow() - timedelta(days=1)
    
    metrics = analytics.calculate_daily_metrics(target_date)
    
    return {
        "success": True,
        "date": metrics.date.strftime('%Y-%m-%d'),
        "metrics_calculated": True
    }