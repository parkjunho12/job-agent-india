"""
Admin API Router
Advanced admin features with analytics and user management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, and_, or_
from typing import Optional, List
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.analytics import AnalyticsEvent, ConversionFunnel, DailyMetrics
from app.api.auth import get_current_user
from app.services.analytics_service import AnalyticsService

from app.models.billing import Subscription, PlanType


from app.utils.config import settings

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)):
    """Require admin access"""
    # TODO: Add proper admin role check
    admin_emails = settings.ADMIN_EMAILS
    
    if current_user.email not in admin_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user


# ============================================
# User Management
# ============================================

@router.get("/users")
async def get_users(
    search: Optional[str] = Query(None),
    plan: Optional[str] = Query('all'),
    status: Optional[str] = Query('all'),
    sort: Optional[str] = Query('created_desc'),
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all users with filtering and sorting
    """
    # Base query
    query = (
        db.query(User, Subscription, ConversionFunnel)
        .outerjoin(Subscription, Subscription.user_id == User.id)
        .outerjoin(ConversionFunnel, ConversionFunnel.user_id == User.id)
    )
    
    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.email.ilike(search_term),
                User.full_name.ilike(search_term)
            )
        )
    
    
    if plan and plan != 'all':
        plan_lower = plan.lower()
        if plan_lower == "free":
            query = query.filter(
                or_(
                    Subscription.id.is_(None),
                    Subscription.plan == PlanType.FREE,       # Enum 기반
                    Subscription.plan == "free"              # 혹시 문자열로 저장된 경우 대비
                )
            )
        else:
            # plan이 Enum이면 PlanType으로 매핑 시도
            # 실패하면 문자열 비교로 fallback
            plan_enum = None
            try:
                plan_enum = PlanType[plan_upper]  # 사용자가 'PRO' 같은 걸 넣는 경우
            except Exception:
                try:
                    plan_enum = PlanType(plan_lower)  # 사용자가 'pro' 같은 value를 넣는 경우
                except Exception:
                    plan_enum = None

            if plan_enum is not None:
                query = query.filter(Subscription.plan == plan_enum)
            else:
                query = query.filter(Subscription.plan == plan_lower)

    # Status filter (active = used in last 30 days)
    if status and status != 'all':
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        active_user_ids_subq = (
            db.query(AnalyticsEvent.user_id.distinct().label("user_id"))
            .filter(
                and_(
                    AnalyticsEvent.created_at >= thirty_days_ago,
                    AnalyticsEvent.user_id.isnot(None)
                )
            )
            .subquery()
        )

        if status == 'active':
            query = query.filter(User.id.in_(db.query(active_user_ids_subq.c.user_id)))
        elif status == 'inactive':
            query = query.filter(~User.id.in_(db.query(active_user_ids_subq.c.user_id)))

    # Sorting
    if sort == 'created_desc':
        query = query.order_by(desc(User.created_at))
    elif sort == 'created_asc':
        query = query.order_by(asc(User.created_at))
    elif sort == 'name_asc':
        query = query.order_by(asc(User.full_name))
    elif sort == 'revenue_desc':
        # funnel conversion_amount가 없으면 0으로 정렬
        query = query.order_by(desc(func.coalesce(ConversionFunnel.conversion_amount, 0.0)))

    # Pagination
    total = query.count()
    rows = query.offset(offset).limit(limit).all()

    # Build response rows
    users_data = []
    for user, sub, funnel in rows:
        # plan은 user.get_plan()을 사용해도 되고, 여기서 subscription으로 직접 구성해도 됨
        plan_name = "free"
        if sub and sub.plan:
            plan_name = getattr(sub.plan, "value", sub.plan)  # Enum이면 value

        users_data.append({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'plan': plan_name,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'total_jobs': funnel.total_jobs_added if funnel else 0,
            'total_analyses': funnel.total_analyses if funnel else 0,
            'total_revenue': float(funnel.conversion_amount) if funnel and funnel.conversion_amount else 0.0,
            'converted': bool(funnel.converted) if funnel else False
        })

    # Overall stats (조인 기반으로 계산)
    total_users = db.query(func.count(User.id)).scalar() or 0

    free_users = (
        db.query(func.count(User.id))
        .outerjoin(Subscription, Subscription.user_id == User.id)
        .filter(or_(Subscription.id.is_(None), Subscription.plan == PlanType.FREE, Subscription.plan == "free"))
        .scalar() or 0
    )

    paid_users = (
        db.query(func.count(User.id))
        .join(Subscription, Subscription.user_id == User.id)
        .filter(and_(Subscription.plan.isnot(None), Subscription.plan != PlanType.FREE, Subscription.plan != "free"))
        .scalar() or 0
    )

    active_7d = (
        db.query(func.count(func.distinct(AnalyticsEvent.user_id)))
        .filter(
            and_(
                AnalyticsEvent.created_at >= datetime.utcnow() - timedelta(days=7),
                AnalyticsEvent.user_id.isnot(None)
            )
        )
        .scalar() or 0
    )

    stats = {
        'total': total_users,
        'free': free_users,
        'paid': paid_users,
        'active_7d': active_7d
    }

    return {
        'users': users_data,
        'stats': stats,
        'total': total,
        'limit': limit,
        'offset': offset
    }


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get detailed user information
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Funnel
    funnel = db.query(ConversionFunnel).filter(ConversionFunnel.user_id == user_id).first()

    # Subscription
    sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()

    # Recent events
    recent_events = (
        db.query(AnalyticsEvent)
        .filter(AnalyticsEvent.user_id == user_id)
        .order_by(desc(AnalyticsEvent.created_at))
        .limit(20)
        .all()
    )

    # Jobs
    jobs = db.query(Job).filter(Job.user_id == user_id).all()

    plan_name = "free"
    credits = 0
    if sub:
        if sub.plan:
            plan_name = getattr(sub.plan, "value", sub.plan)
        credits = int(getattr(sub, "credits", 0) or 0)

    return {
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'plan': plan_name,
            'credits': credits,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            # 아래 2개는 User에 없다면 제거하세요(당신 User 모델엔 stripe_* 없음)
            # 'stripe_customer_id': getattr(user, "stripe_customer_id", None),
            # 'stripe_subscription_id': getattr(user, "stripe_subscription_id", None),
        },
        'funnel': {
            'total_jobs': funnel.total_jobs_added if funnel else 0,
            'total_analyses': funnel.total_analyses if funnel else 0,
            'total_premium_views': funnel.total_premium_views if funnel else 0,
            'total_generations': funnel.total_generations if funnel else 0,
            'converted': funnel.converted if funnel else False,
            'conversion_amount': float(funnel.conversion_amount) if funnel and funnel.conversion_amount else 0.0,
            'days_to_conversion': funnel.days_to_conversion if funnel else None
        },
        'recent_activity': [
            {
                'event_type': e.event_type,
                'event_category': e.event_category,
                'created_at': e.created_at.isoformat()
            }
            for e in recent_events
        ],
        'jobs': [
            {
                'id': j.id,
                'company': j.company,
                'title': j.title,
                'status': j.status,
                'created_at': j.created_at.isoformat()
            }
            for j in jobs
        ]
    }


# ============================================
# System Stats
# ============================================

@router.get("/system/health")
async def get_system_health(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get system health metrics
    """
    # Database stats
    total_users = db.query(func.count(User.id)).scalar()
    total_jobs = db.query(func.count(Job.id)).scalar()
    total_events = db.query(func.count(AnalyticsEvent.id)).scalar()
    
    # Recent activity (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    signups_24h = db.query(func.count(User.id)).filter(
        User.created_at >= yesterday
    ).scalar()
    events_24h = db.query(func.count(AnalyticsEvent.id)).filter(
        AnalyticsEvent.created_at >= yesterday
    ).scalar()
    
    return {
        'database': {
            'total_users': total_users,
            'total_jobs': total_jobs,
            'total_events': total_events
        },
        'activity_24h': {
            'signups': signups_24h,
            'events': events_24h
        },
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }


# ============================================
# Reports
# ============================================

@router.get("/reports/daily")
async def get_daily_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get daily metrics report
    """
    # Parse dates
    if start_date:
        start = datetime.strptime(start_date, '%Y-%m-%d')
    else:
        start = datetime.utcnow() - timedelta(days=30)
    
    if end_date:
        end = datetime.strptime(end_date, '%Y-%m-%d')
    else:
        end = datetime.utcnow()
    
    # Get daily metrics
    metrics = db.query(DailyMetrics).filter(
        and_(
            DailyMetrics.date >= start,
            DailyMetrics.date <= end
        )
    ).order_by(DailyMetrics.date).all()
    
    return {
        'start_date': start.strftime('%Y-%m-%d'),
        'end_date': end.strftime('%Y-%m-%d'),
        'metrics': [
            {
                'date': m.date.strftime('%Y-%m-%d'),
                'signups': m.new_signups,
                'active_users': m.active_users,
                'analyses': m.total_analyses,
                'conversions': m.new_conversions,
                'revenue': m.conversion_revenue,
                'conversion_rate': m.overall_conversion_rate
            }
            for m in metrics
        ]
    }