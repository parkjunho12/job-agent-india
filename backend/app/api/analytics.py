"""
Complete Analytics API Router
All endpoints integrated
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional, List
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
# Admin Authorization
# ============================================

def require_admin(current_user: User = Depends(get_current_user)):
    """Require admin access"""
    admin_emails = settings.ADMIN_EMAILS
    
    if current_user.email not in admin_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user


# ============================================
# Event Tracking Endpoints (Public)
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
# Overview Endpoints (Admin)
# ============================================

@router.get("/overview")
async def get_overview(
    days: int = 14,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get overview metrics with trends (admin only)
    
    Returns:
    - period_days: Number of days analyzed
    - total_signups: Total new signups
    - total_analyses: Total job analyses
    - total_conversions: Total conversions
    - total_revenue: Total revenue
    - active_users_7d: Active users in last 7 days
    - users_with_analysis: Users with 1+ analyses
    - trends: Comparison with previous period
    - goals: Progress toward goals
    """
    analytics = AnalyticsService(db)
    
    # Get base overview
    overview = analytics.get_overview_metrics(days=days)
    
    # Get trends
    trends_data = analytics.get_overview_with_trends(days=days)
    overview['trends'] = trends_data['trends']
    
    return overview


@router.get("/funnel-details")
async def get_funnel_details(
    days: int = 14,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get detailed funnel breakdown (admin only)
    
    Returns:
    - total_signups: Total signups in period
    - users_with_job: Users who added a job
    - users_with_analysis: Users who ran analysis
    - users_with_premium: Users who viewed premium
    - users_converted: Users who converted
    - Rates for each stage
    """
    analytics = AnalyticsService(db)
    return analytics.get_funnel_details(days=days)


@router.get("/timeline")
async def get_timeline(
    days: int = 14,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get daily timeline data for charts (admin only)
    
    Returns array of daily metrics:
    - date: Date string (YYYY-MM-DD)
    - signups: Daily signups
    - analyses: Daily analyses
    - conversions: Daily conversions
    - revenue: Daily revenue
    - premium_views: Daily premium views
    - generations: Daily content generations
    - active_users: Daily active users
    - conversion_rate: Daily conversion rate
    """
    analytics = AnalyticsService(db)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    timeline = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        
        # Get or calculate daily metrics
        metrics = analytics.calculate_daily_metrics(date)
        
        timeline.append({
            'date': date.strftime('%Y-%m-%d'),
            'signups': metrics.new_signups,
            'analyses': metrics.total_analyses,
            'conversions': metrics.new_conversions,
            'revenue': float(metrics.conversion_revenue or 0),
            'premium_views': metrics.total_premium_views,
            'generations': metrics.total_generations,
            'active_users': metrics.active_users,
            'conversion_rate': float(metrics.overall_conversion_rate or 0)
        })
    
    return timeline


@router.get("/realtime-status")
async def get_realtime_status(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get real-time status metrics (admin only)
    
    Returns:
    - active_users_now: Users active in last 15 minutes
    - today_signups: Signups today
    - today_analyses: Analyses today
    - active_sessions: Sessions in last 30 minutes
    - system_health: System health score (0-100)
    - timestamp: Current timestamp
    """
    analytics = AnalyticsService(db)
    
    # Active users (last 15 minutes)
    fifteen_min_ago = datetime.utcnow() - timedelta(minutes=15)
    active_now = analytics.get_active_users_count(since=fifteen_min_ago)
    
    # Today's metrics
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_signups = analytics.get_signups_count(since=today_start)
    today_analyses = analytics.get_analyses_count(since=today_start)
    
    # Active sessions (last 30 minutes)
    thirty_min_ago = datetime.utcnow() - timedelta(minutes=30)
    active_sessions = analytics.get_active_sessions_count(since=thirty_min_ago)
    
    # System health
    system_health = analytics.calculate_system_health()
    
    return {
        'active_users_now': active_now,
        'today_signups': today_signups,
        'today_analyses': today_analyses,
        'active_sessions': active_sessions,
        'system_health': system_health,
        'timestamp': datetime.utcnow().isoformat()
    }


@router.get("/advanced-metrics")
async def get_advanced_metrics(
    days: int = 14,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get advanced calculated metrics (admin only)
    
    Returns:
    - velocity: Daily average rates (signups, analyses, conversions)
    - scores: Engagement and health scores (0-100)
    - time_metrics: Average time to key actions
    - revenue_metrics: Revenue per user, LTV, ARPU
    - growth: Growth rate and momentum
    """
    analytics = AnalyticsService(db)
    advanced = analytics.calculate_advanced_metrics(days=days)
    
    return {
        'velocity': {
            'signup_velocity': advanced['signup_velocity'],
            'analysis_velocity': advanced['analysis_velocity'],
            'conversion_velocity': advanced['conversion_velocity']
        },
        'scores': {
            'engagement_score': advanced['engagement_score'],
            'health_score': advanced['health_score']
        },
        'time_metrics': {
            'avg_time_to_first_job': advanced['avg_time_to_first_job'],
            'avg_time_to_first_analysis': advanced['avg_time_to_first_analysis'],
            'avg_time_to_conversion': advanced['avg_time_to_conversion']
        },
        'revenue_metrics': {
            'revenue_per_user': advanced['revenue_per_user'],
            'ltv': advanced['ltv'],
            'arpu': advanced['arpu']
        },
        'growth': {
            'growth_rate': advanced['growth_rate'],
            'momentum': advanced['momentum']
        }
    }


@router.get("/cohorts")
async def get_cohort_analysis(
    weeks: int = 4,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get cohort retention analysis (admin only)
    
    Returns:
    - cohorts: Array of weekly cohorts with retention rates
    - summary: Average retention rates across cohorts
    """
    analytics = AnalyticsService(db)
    cohorts = analytics.calculate_cohort_retention(weeks=weeks)
    
    # Calculate summary
    def calc_avg_retention(week: int) -> float:
        values = []
        for cohort in cohorts:
            if week < len(cohort.get('retention', [])):
                retention = cohort['retention'][week]
                if retention is not None:
                    values.append(retention)
        return sum(values) / len(values) if values else 0.0
    
    return {
        'cohorts': cohorts,
        'summary': {
            'avg_week_1_retention': round(calc_avg_retention(1), 1),
            'avg_week_2_retention': round(calc_avg_retention(2), 1),
            'avg_week_3_retention': round(calc_avg_retention(3), 1)
        }
    }


@router.get("/user-segments")
async def get_user_segments(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get user segmentation data (admin only)
    
    Returns:
    - by_activity: Power users, active, inactive
    - by_conversion: Converted, viewed premium, never viewed
    - by_engagement: High, medium, low, no engagement
    """
    analytics = AnalyticsService(db)
    
    return {
        'by_activity': analytics.segment_by_activity(),
        'by_conversion': analytics.segment_by_conversion(),
        'by_engagement': analytics.segment_by_engagement()
    }


@router.get("/conversion-paths")
async def get_conversion_paths(
    limit: int = 10,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get most common conversion paths (admin only)
    
    Returns:
    - paths: Array of conversion paths with counts
    - total_conversions: Total converted users
    """
    analytics = AnalyticsService(db)
    paths = analytics.get_conversion_paths(limit=limit)
    
    return {
        'paths': paths,
        'total_conversions': sum(p['count'] for p in paths)
    }


# ============================================
# Daily Metrics Endpoints (Admin)
# ============================================

@router.get("/daily/{date}")
async def get_daily_metrics(
    date: str,  # Format: YYYY-MM-DD
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get metrics for a specific day (admin only)
    
    Args:
    - date: Date string in YYYY-MM-DD format
    
    Returns:
    - date: Date string
    - signups: New signups
    - active_users: Active users
    - jobs_added: Jobs added
    - analyses: Analyses performed
    - premium_views: Premium content views
    - generations: Content generations
    - conversions: Conversions
    - revenue: Revenue
    - funnel: Funnel rates
    - averages: Average metrics
    """
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
        "revenue": float(metrics.conversion_revenue or 0),
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
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Manually trigger daily metrics calculation (admin only)
    
    Args:
    - date: Optional date string (YYYY-MM-DD). Defaults to yesterday.
    
    Returns:
    - success: True if successful
    - date: Date that was calculated
    - metrics_calculated: True
    """
    analytics = AnalyticsService(db)
    
    if date:
        try:
            target_date = datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    else:
        target_date = datetime.utcnow() - timedelta(days=1)
    
    metrics = analytics.calculate_daily_metrics(target_date)
    
    return {
        "success": True,
        "date": metrics.date.strftime('%Y-%m-%d'),
        "metrics_calculated": True
    }


@router.post("/calculate-range")
async def calculate_range_metrics(
    start_date: str,  # YYYY-MM-DD
    end_date: str,    # YYYY-MM-DD
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Calculate metrics for a date range (admin only)
    
    Args:
    - start_date: Start date (YYYY-MM-DD)
    - end_date: End date (YYYY-MM-DD)
    
    Returns:
    - success: True if successful
    - start_date: Start date
    - end_date: End date
    - days_calculated: Number of days calculated
    - dates: Array of dates calculated
    """
    analytics = AnalyticsService(db)
    
    try:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    if (end - start).days > 90:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Date range cannot exceed 90 days"
        )
    
    if start > end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before end date"
        )
    
    # Calculate for each day
    calculated = []
    current = start
    while current <= end:
        metrics = analytics.calculate_daily_metrics(current)
        calculated.append(current.strftime('%Y-%m-%d'))
        current += timedelta(days=1)
    
    return {
        "success": True,
        "start_date": start_date,
        "end_date": end_date,
        "days_calculated": len(calculated),
        "dates": calculated
    }