"""
Complete Analytics Service
All features integrated in one file
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, distinct, cast, Numeric, or_
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import uuid

from app.models.analytics import AnalyticsEvent, ConversionFunnel, DailyMetrics
from app.models.user import User
from app.models.job import Job


class AnalyticsService:
    """
    Complete analytics service with all features
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============================================
    # EVENT TRACKING
    # ============================================
    
    def track_event(
        self,
        event_type: str,
        event_category: str,
        event_action: str,
        user_id: Optional[int] = None,
        session_id: Optional[str] = None,
        event_label: Optional[str] = None,
        event_data: Optional[Dict] = None,
        page_url: Optional[str] = None,
        referrer: Optional[str] = None,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ):
        """Track a single event"""
        event = AnalyticsEvent(
            user_id=user_id,
            session_id=session_id or str(uuid.uuid4()),
            event_type=event_type,
            event_category=event_category,
            event_action=event_action,
            event_label=event_label,
            event_data=event_data,
            page_url=page_url,
            referrer=referrer,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        self.db.add(event)
        self.db.commit()
        
        # Update funnel if user exists
        if user_id:
            self._update_funnel(user_id, event_type, event_category)
        
        return event
    
    def _update_funnel(self, user_id: int, event_type: str, event_category: str):
        """Update user's conversion funnel progress"""
        funnel = self.db.query(ConversionFunnel).filter(
            ConversionFunnel.user_id == user_id
        ).first()
        
        if not funnel:
            funnel = ConversionFunnel(user_id=user_id)
            self.db.add(funnel)
        
        now = datetime.utcnow()
        
        # Update funnel stages
        if event_category == 'signup' and not funnel.stage_signup:
            funnel.stage_signup = now
        
        elif event_type == 'job_added':
            funnel.total_jobs_added += 1
            if not funnel.stage_first_job_added:
                funnel.stage_first_job_added = now
        
        elif event_type == 'job_analyzed':
            funnel.total_analyses += 1
            if not funnel.stage_first_analysis:
                funnel.stage_first_analysis = now
            elif funnel.total_analyses == 2 and not funnel.stage_second_analysis:
                funnel.stage_second_analysis = now
            elif funnel.total_analyses == 3 and not funnel.stage_third_analysis:
                funnel.stage_third_analysis = now
        
        elif event_type == 'premium_viewed':
            funnel.total_premium_views += 1
            if not funnel.stage_first_premium_view:
                funnel.stage_first_premium_view = now
        
        elif event_type == 'content_generated':
            funnel.total_generations += 1
        
        elif event_category == 'conversion':
            funnel.converted = True
            if not funnel.stage_first_conversion:
                funnel.stage_first_conversion = now
                if funnel.stage_signup:
                    funnel.days_to_conversion = (now - funnel.stage_signup).days
            
            # Update conversion details
            funnel.conversion_type = event_type.replace('conversion_', '')
        
        funnel.updated_at = now
        self.db.commit()
    
    # ============================================
    # QUICK EVENT HELPERS
    # ============================================
    
    def track_signup(self, user_id: int, session_id: str, referrer: Optional[str] = None):
        """Track user signup"""
        return self.track_event(
            event_type='signup',
            event_category='signup',
            event_action='account_created',
            user_id=user_id,
            session_id=session_id,
            referrer=referrer
        )
    
    def track_job_added(self, user_id: int, job_id: int):
        """Track job added"""
        return self.track_event(
            event_type='job_added',
            event_category='usage',
            event_action='job_created',
            user_id=user_id,
            event_data={'job_id': job_id}
        )
    
    def track_analysis(self, user_id: int, job_id: int, is_premium: bool):
        """Track job analysis"""
        return self.track_event(
            event_type='job_analyzed',
            event_category='usage',
            event_action='analysis_completed',
            user_id=user_id,
            event_data={
                'job_id': job_id,
                'is_premium': is_premium
            }
        )
    
    def track_premium_viewed(self, user_id: int, job_id: int):
        """Track premium content view"""
        return self.track_event(
            event_type='premium_viewed',
            event_category='engagement',
            event_action='premium_content_viewed',
            user_id=user_id,
            event_data={'job_id': job_id}
        )
    
    def track_generation(self, user_id: int, job_id: int, generation_type: str):
        """Track content generation"""
        return self.track_event(
            event_type='content_generated',
            event_category='engagement',
            event_action=f'generated_{generation_type}',
            user_id=user_id,
            event_data={
                'job_id': job_id,
                'type': generation_type
            }
        )
    
    def track_conversion(self, user_id: int, conversion_type: str, amount: float):
        """Track payment conversion"""
        event = self.track_event(
            event_type=f'conversion_{conversion_type}',
            event_category='conversion',
            event_action='payment_completed',
            user_id=user_id,
            event_data={
                'type': conversion_type,
                'amount': amount
            }
        )
        
        # Update funnel conversion amount
        funnel = self.db.query(ConversionFunnel).filter(
            ConversionFunnel.user_id == user_id
        ).first()
        if funnel:
            funnel.conversion_amount = amount
            self.db.commit()
        
        return event
    
    # ============================================
    # DAILY METRICS CALCULATION
    # ============================================
    
    def calculate_daily_metrics(self, date: datetime) -> DailyMetrics:
        """Calculate metrics for a specific day"""
        start_date = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
        
        # Check if already calculated
        existing = self.db.query(DailyMetrics).filter(
            DailyMetrics.date == start_date
        ).first()
        
        if existing:
            return existing
        
        # New signups
        new_signups = self.db.query(func.count(User.id)).filter(
            and_(
                User.created_at >= start_date,
                User.created_at < end_date
            )
        ).scalar() or 0
        
        # Active users
        active_users = self.db.query(func.count(distinct(AnalyticsEvent.user_id))).filter(
            and_(
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date,
                AnalyticsEvent.user_id.isnot(None)
            )
        ).scalar() or 0
        
        # Usage metrics
        total_jobs_added = self.db.query(func.count(Job.id)).filter(
            and_(
                Job.created_at >= start_date,
                Job.created_at < end_date
            )
        ).scalar() or 0
        
        total_analyses = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_type == 'job_analyzed',
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date
            )
        ).scalar() or 0
        
        total_premium_views = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_type == 'premium_viewed',
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date
            )
        ).scalar() or 0
        
        total_generations = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_type == 'content_generated',
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date
            )
        ).scalar() or 0
        
        # Conversions
        new_conversions = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_category == 'conversion',
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date
            )
        ).scalar() or 0
        
        # Revenue
        events = self.db.query(AnalyticsEvent.event_data).filter(
            and_(
                AnalyticsEvent.event_category == 'conversion',
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date
            )
        ).all()
       
        conversion_revenue = 0.0
        for (edata,) in events:
            if not edata:
                continue
            try:
                conversion_revenue += float(edata.get("amount") or 0)
            except (TypeError, ValueError):
                continue

        
        
        # Funnel rates
        funnel_metrics = self._calculate_funnel_rates(start_date, end_date)
        
        # Create metrics record
        metrics = DailyMetrics(
            date=start_date,
            new_signups=new_signups,
            active_users=active_users,
            total_jobs_added=total_jobs_added,
            total_analyses=total_analyses,
            total_premium_views=total_premium_views,
            total_generations=total_generations,
            new_conversions=new_conversions,
            conversion_revenue=conversion_revenue,
            **funnel_metrics
        )
        
        self.db.add(metrics)
        self.db.commit()
        self.db.refresh(metrics)
        
        return metrics
    
    def _calculate_funnel_rates(self, start_date: datetime, end_date: datetime) -> Dict:
        """Calculate funnel conversion rates"""
        # Get all users who signed up in this period
        signups = self.db.query(ConversionFunnel).join(User).filter(
            and_(
                User.created_at >= start_date,
                User.created_at < end_date
            )
        ).all()
        
        if not signups:
            return {
                'signup_to_first_job_rate': 0.0,
                'first_job_to_analysis_rate': 0.0,
                'analysis_to_premium_rate': 0.0,
                'premium_to_conversion_rate': 0.0,
                'overall_conversion_rate': 0.0,
                'avg_analyses_per_user': 0.0,
                'avg_days_to_conversion': 0.0
            }
        
        total_signups = len(signups)
        
        # Calculate rates
        with_first_job = sum(1 for s in signups if s.stage_first_job_added)
        with_analysis = sum(1 for s in signups if s.stage_first_analysis)
        with_premium = sum(1 for s in signups if s.stage_first_premium_view)
        converted = sum(1 for s in signups if s.converted)
        
        total_analyses = sum(s.total_analyses for s in signups)
        conversion_days = [s.days_to_conversion for s in signups if s.days_to_conversion]
        
        return {
            'signup_to_first_job_rate': (with_first_job / total_signups * 100) if total_signups > 0 else 0.0,
            'first_job_to_analysis_rate': (with_analysis / with_first_job * 100) if with_first_job > 0 else 0.0,
            'analysis_to_premium_rate': (with_premium / with_analysis * 100) if with_analysis > 0 else 0.0,
            'premium_to_conversion_rate': (converted / with_premium * 100) if with_premium > 0 else 0.0,
            'overall_conversion_rate': (converted / total_signups * 100) if total_signups > 0 else 0.0,
            'avg_analyses_per_user': (total_analyses / total_signups) if total_signups > 0 else 0.0,
            'avg_days_to_conversion': (sum(conversion_days) / len(conversion_days)) if conversion_days else 0.0
        }
    
    # ============================================
    # OVERVIEW METRICS
    # ============================================
    
    def get_live_revenue(self, since: datetime, until: Optional[datetime] = None) -> float:
        if until is None:
            until = datetime.utcnow()

        # conversion 이벤트 정의를 명확히: event_category='conversion' + amount 존재
        amount_expr = self._json_amount_expr(AnalyticsEvent.event_data)

        revenue = (
            self.db.query(func.coalesce(func.sum(amount_expr), 0))
            .filter(
                AnalyticsEvent.created_at >= since,
                AnalyticsEvent.created_at < until,
                AnalyticsEvent.event_category == "conversion",
                AnalyticsEvent.event_data.isnot(None),  # null 방지
            )
            .scalar()
            or 0
        )
        return float(revenue)
    
    def get_overview_metrics(self, days: int = 14) -> Dict:
        """Get overview metrics for the past N days"""
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Calculate daily metrics for the period
        for i in range(days):
            d = today - timedelta(days=i)
            self.calculate_daily_metrics(d)
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Aggregate daily metrics
        metrics = self.db.query(
            func.sum(DailyMetrics.new_signups).label('total_signups'),
            func.sum(DailyMetrics.total_analyses).label('total_analyses'),
            func.sum(DailyMetrics.new_conversions).label('total_conversions'),
            func.sum(DailyMetrics.conversion_revenue).label('total_revenue'),
            func.avg(DailyMetrics.overall_conversion_rate).label('avg_conversion_rate'),
            func.avg(DailyMetrics.avg_analyses_per_user).label('avg_analyses_per_user')
        ).filter(
            DailyMetrics.date >= start_date
        ).first()
        
        # Current active users (last 7 days)
        active_users = self.db.query(func.count(distinct(AnalyticsEvent.user_id))).filter(
            and_(
                AnalyticsEvent.created_at >= datetime.utcnow() - timedelta(days=7),
                AnalyticsEvent.user_id.isnot(None)
            )
        ).scalar() or 0
        
        # Users with 1+ analyses
        users_with_analysis = self.db.query(func.count(ConversionFunnel.id)).filter(
            ConversionFunnel.total_analyses >= 1
        ).scalar() or 0
        
        return {
            'period_days': days,
            'total_signups': int(metrics.total_signups or 0),
            'total_analyses': int(metrics.total_analyses or 0),
            'total_conversions': int(metrics.total_conversions or 0),
            'total_revenue': float(metrics.total_revenue or 0.0),
            'avg_conversion_rate': float(metrics.avg_conversion_rate or 0.0),
            'avg_analyses_per_user': float(metrics.avg_analyses_per_user or 0.0),
            'active_users_7d': active_users,
            'users_with_analysis': users_with_analysis,
            
            # Goal tracking
            'goals': {
                'signups': {
                    'target': 50,
                    'current': int(metrics.total_signups or 0),
                    'progress': ((metrics.total_signups or 0) / 50 * 100)
                },
                'free_usage_rate': {
                    'target': 40.0,
                    'current': (users_with_analysis / (metrics.total_signups or 1) * 100) if metrics.total_signups else 0,
                    'progress': ((users_with_analysis / (metrics.total_signups or 1) * 100) / 40 * 100) if metrics.total_signups else 0
                },
                'conversion_rate': {
                    'target': 5.0,
                    'current': float(metrics.avg_conversion_rate or 0.0),
                    'progress': (float(metrics.avg_conversion_rate or 0.0) / 5.0 * 100)
                }
            }
        }
    
    # ============================================
    # FUNNEL DETAILS
    # ============================================
    
    def get_funnel_details(self, days: int = 14) -> Dict:
        """Get detailed funnel breakdown"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get all users in this period
        total_signups = self.db.query(func.count(User.id)).filter(
            User.created_at >= start_date
        ).scalar() or 0
        
        if total_signups == 0:
            return {
                'total_signups': 0,
                'users_with_job': 0,
                'users_with_analysis': 0,
                'users_with_premium': 0,
                'users_converted': 0,
                'signup_to_job_rate': 0,
                'job_to_analysis_rate': 0,
                'analysis_to_premium_rate': 0,
                'premium_to_conversion_rate': 0
            }
        
        # Count users at each funnel stage
        users_with_job = self.db.query(func.count(distinct(ConversionFunnel.user_id))).join(
            User
        ).filter(
            and_(
                User.created_at >= start_date,
                ConversionFunnel.stage_first_job_added.isnot(None)
            )
        ).scalar() or 0
        
        users_with_analysis = self.db.query(func.count(distinct(ConversionFunnel.user_id))).join(
            User
        ).filter(
            and_(
                User.created_at >= start_date,
                ConversionFunnel.stage_first_analysis.isnot(None)
            )
        ).scalar() or 0
        
        users_with_premium = self.db.query(func.count(distinct(ConversionFunnel.user_id))).join(
            User
        ).filter(
            and_(
                User.created_at >= start_date,
                ConversionFunnel.stage_first_premium_view.isnot(None)
            )
        ).scalar() or 0
        
        users_converted = self.db.query(func.count(distinct(ConversionFunnel.user_id))).join(
            User
        ).filter(
            and_(
                User.created_at >= start_date,
                ConversionFunnel.converted == True
            )
        ).scalar() or 0
        
        # Calculate rates
        signup_to_job_rate = (users_with_job / total_signups * 100) if total_signups > 0 else 0
        job_to_analysis_rate = (users_with_analysis / users_with_job * 100) if users_with_job > 0 else 0
        analysis_to_premium_rate = (users_with_premium / users_with_analysis * 100) if users_with_analysis > 0 else 0
        premium_to_conversion_rate = (users_converted / users_with_premium * 100) if users_with_premium > 0 else 0
        
        return {
            'total_signups': total_signups,
            'users_with_job': users_with_job,
            'users_with_analysis': users_with_analysis,
            'users_with_premium': users_with_premium,
            'users_converted': users_converted,
            'signup_to_job_rate': round(signup_to_job_rate, 1),
            'job_to_analysis_rate': round(job_to_analysis_rate, 1),
            'analysis_to_premium_rate': round(analysis_to_premium_rate, 1),
            'premium_to_conversion_rate': round(premium_to_conversion_rate, 1)
        }
    
    # ============================================
    # TRENDS CALCULATION
    # ============================================
    
    def get_overview_with_trends(self, days: int = 14) -> Dict:
        """Get overview metrics with trend comparison"""
        current_start = datetime.utcnow() - timedelta(days=days)
        previous_start = datetime.utcnow() - timedelta(days=days * 2)
        previous_end = current_start
        
        # Current period metrics
        current_signups = self.db.query(func.count(User.id)).filter(
            User.created_at >= current_start
        ).scalar() or 0
        
        current_analyses = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_type == 'job_analyzed',
                AnalyticsEvent.created_at >= current_start
            )
        ).scalar() or 0
        
        current_conversions = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_category == 'conversion',
                AnalyticsEvent.created_at >= current_start
            )
        ).scalar() or 0
        
        amount_expr = self._json_amount_expr(AnalyticsEvent.event_data)
        current_revenue = self.db.query(
            func.coalesce(func.sum(amount_expr), 0)
        ).filter(
            and_(
                AnalyticsEvent.event_category == 'conversion',
                AnalyticsEvent.created_at >= current_start
            )
        ).scalar() or 0
        
        # Previous period metrics
        previous_signups = self.db.query(func.count(User.id)).filter(
            and_(
                User.created_at >= previous_start,
                User.created_at < previous_end
            )
        ).scalar() or 0
        
        previous_analyses = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_type == 'job_analyzed',
                AnalyticsEvent.created_at >= previous_start,
                AnalyticsEvent.created_at < previous_end
            )
        ).scalar() or 0
        
        previous_conversions = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_category == 'conversion',
                AnalyticsEvent.created_at >= previous_start,
                AnalyticsEvent.created_at < previous_end
            )
        ).scalar() or 0
        
        previous_revenue = self.db.query(
            func.coalesce(func.sum(amount_expr), 0)
        ).filter(
            and_(
                AnalyticsEvent.event_category == 'conversion',
                AnalyticsEvent.created_at >= previous_start,
                AnalyticsEvent.created_at < previous_end
            )
        ).scalar() or 0
        
        current_revenue = float(current_revenue or 0.0)
        previous_revenue = float(previous_revenue or 0.0)
        
        # Calculate trends
        def calculate_change(current, previous):
            if previous == 0:
                return 100 if current > 0 else 0
            return round(((current - previous) / previous * 100), 1)
        
        trends = {
            'signups': calculate_change(current_signups, previous_signups),
            'signups_change': calculate_change(current_signups, previous_signups),
            'analyses_change': calculate_change(current_analyses, previous_analyses),
            'conversions_change': calculate_change(current_conversions, previous_conversions),
            'revenue_change': calculate_change(current_revenue, previous_revenue),
            'engagement': 0,
            'conversion': 0
        }
        
        return {
            'current': {
                'signups': current_signups,
                'analyses': current_analyses,
                'conversions': current_conversions,
                'revenue': current_revenue
            },
            'previous': {
                'signups': previous_signups,
                'analyses': previous_analyses,
                'conversions': previous_conversions,
                'revenue': previous_revenue
            },
            'trends': trends
        }
    
    # ============================================
    # REAL-TIME STATUS
    # ============================================
    
    def get_active_users_count(self, since: datetime) -> int:
        """Get count of active users since timestamp"""
        return self.db.query(func.count(distinct(AnalyticsEvent.user_id))).filter(
            and_(
                AnalyticsEvent.created_at >= since,
                AnalyticsEvent.user_id.isnot(None)
            )
        ).scalar() or 0
    
    def get_signups_count(self, since: datetime) -> int:
        """Get count of signups since timestamp"""
        return self.db.query(func.count(User.id)).filter(
            User.created_at >= since
        ).scalar() or 0
    
    def get_analyses_count(self, since: datetime) -> int:
        """Get count of analyses since timestamp"""
        return self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_type == 'job_analyzed',
                AnalyticsEvent.created_at >= since
            )
        ).scalar() or 0
    
    def get_active_sessions_count(self, since: datetime) -> int:
        """Get count of active sessions"""
        return self.db.query(func.count(distinct(AnalyticsEvent.session_id))).filter(
            AnalyticsEvent.created_at >= since
        ).scalar() or 0
    
    def calculate_system_health(self) -> float:
        """Calculate system health score (0-100)"""
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        
        recent_events = self.db.query(func.count(AnalyticsEvent.id)).filter(
            AnalyticsEvent.created_at >= one_hour_ago
        ).scalar() or 0
        
        recent_errors = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_type == 'error',
                AnalyticsEvent.created_at >= one_hour_ago
            )
        ).scalar() or 0
        
        if recent_events == 0:
            return 95.0
        
        error_rate = recent_errors / recent_events
        health = max(0, 100 - (error_rate * 100))
        
        return round(health, 1)
    
    # ============================================
    # ADVANCED METRICS
    # ============================================
    
    def calculate_advanced_metrics(self, days: int = 14) -> Dict:
        """Calculate all advanced metrics"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get base data
        total_signups = self.db.query(func.count(User.id)).filter(
            User.created_at >= start_date
        ).scalar() or 0
        
        total_analyses = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_type == 'job_analyzed',
                AnalyticsEvent.created_at >= start_date
            )
        ).scalar() or 0
        
        total_conversions = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_category == 'conversion',
                AnalyticsEvent.created_at >= start_date
            )
        ).scalar() or 0
        
        amount_expr = self._json_amount_expr(AnalyticsEvent.event_data)
        total_revenue = self.db.query(
            func.coalesce(func.sum(amount_expr), 0)
        ).filter(
            and_(
                AnalyticsEvent.event_category == 'conversion',
                AnalyticsEvent.created_at >= start_date
            )
        ).scalar() or 0
        
        total_revenue = float(total_revenue)
        
        # Velocity (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_signups = self.db.query(func.count(User.id)).filter(
            User.created_at >= seven_days_ago
        ).scalar() or 0
        
        recent_analyses = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_type == 'job_analyzed',
                AnalyticsEvent.created_at >= seven_days_ago
            )
        ).scalar() or 0
        
        recent_conversions = self.db.query(func.count(AnalyticsEvent.id)).filter(
            and_(
                AnalyticsEvent.event_category == 'conversion',
                AnalyticsEvent.created_at >= seven_days_ago
            )
        ).scalar() or 0
        
        signup_velocity = recent_signups / 7
        analysis_velocity = recent_analyses / 7
        conversion_velocity = recent_conversions / 7
        
        # Engagement score
        users_with_analysis = self.db.query(func.count(ConversionFunnel.id)).filter(
            ConversionFunnel.total_analyses >= 1
        ).scalar() or 0
        
        analysis_rate = (users_with_analysis / total_signups) if total_signups > 0 else 0
        avg_analyses = (total_analyses / total_signups) if total_signups > 0 else 0
        
        users_with_premium = self.db.query(func.count(ConversionFunnel.id)).filter(
            ConversionFunnel.total_premium_views >= 1
        ).scalar() or 0
        
        premium_rate = (users_with_premium / total_signups) if total_signups > 0 else 0
        
        engagement_score = min(100, (
            (analysis_rate * 40) +
            (min(avg_analyses / 10, 1) * 30) +
            (premium_rate * 30)
        ) * 100)
        
        # Health score
        signup_goal_rate = min(total_signups / 50, 1)
        engagement_goal_rate = min(analysis_rate / 0.4, 1)
        conversion_goal_rate = min((total_conversions / total_signups) / 0.05, 1) if total_signups > 0 else 0
        
        health_score = ((signup_goal_rate + engagement_goal_rate + conversion_goal_rate) / 3) * 100
        
        # Time metrics
        funnels = self.db.query(ConversionFunnel).join(User).filter(
            User.created_at >= start_date
        ).all()
        
        time_to_job = []
        time_to_analysis = []
        time_to_conversion = []
        
        for funnel in funnels:
            if funnel.stage_signup and funnel.stage_first_job_added:
                days_diff = (funnel.stage_first_job_added - funnel.stage_signup).total_seconds() / 86400
                time_to_job.append(days_diff)
            
            if funnel.stage_signup and funnel.stage_first_analysis:
                days_diff = (funnel.stage_first_analysis - funnel.stage_signup).total_seconds() / 86400
                time_to_analysis.append(days_diff)
            
            if funnel.days_to_conversion:
                time_to_conversion.append(funnel.days_to_conversion)
        
        avg_time_to_first_job = sum(time_to_job) / len(time_to_job) if time_to_job else 0
        avg_time_to_first_analysis = sum(time_to_analysis) / len(time_to_analysis) if time_to_analysis else 0
        avg_time_to_conversion = sum(time_to_conversion) / len(time_to_conversion) if time_to_conversion else 0
        
        # Revenue metrics
        revenue_per_user = total_revenue / total_signups if total_signups > 0 else 0
        ltv = total_revenue / total_conversions if total_conversions > 0 else 0
        
        # Growth rate
        previous_start = start_date - timedelta(days=days)
        previous_signups = self.db.query(func.count(User.id)).filter(
            and_(
                User.created_at >= previous_start,
                User.created_at < start_date
            )
        ).scalar() or 0
        
        growth_rate = ((total_signups - previous_signups) / previous_signups * 100) if previous_signups > 0 else 0
        
        # Momentum
        three_days_ago = datetime.utcnow() - timedelta(days=3)
        six_days_ago = datetime.utcnow() - timedelta(days=6)
        
        recent_3_signups = self.db.query(func.count(User.id)).filter(
            User.created_at >= three_days_ago
        ).scalar() or 0
        
        previous_3_signups = self.db.query(func.count(User.id)).filter(
            and_(
                User.created_at >= six_days_ago,
                User.created_at < three_days_ago
            )
        ).scalar() or 0
        
        if recent_3_signups > previous_3_signups * 1.2:
            momentum = 'accelerating'
        elif recent_3_signups < previous_3_signups * 0.8:
            momentum = 'decelerating'
        else:
            momentum = 'stable'
        
        return {
            'signup_velocity': round(signup_velocity, 1),
            'analysis_velocity': round(analysis_velocity, 1),
            'conversion_velocity': round(conversion_velocity, 2),
            'engagement_score': round(engagement_score, 0),
            'health_score': round(health_score, 0),
            'avg_time_to_first_job': round(avg_time_to_first_job, 1),
            'avg_time_to_first_analysis': round(avg_time_to_first_analysis, 1),
            'avg_time_to_conversion': round(avg_time_to_conversion, 1),
            'revenue_per_user': round(revenue_per_user, 2),
            'ltv': round(ltv, 2),
            'arpu': round(revenue_per_user, 2),
            'growth_rate': round(growth_rate, 1),
            'momentum': momentum
        }
    
    # ============================================
    # COHORT ANALYSIS
    # ============================================
    
    def calculate_cohort_retention(self, weeks: int = 4) -> List[Dict]:
        """Calculate weekly cohort retention"""
        cohorts = []
        
        for week_offset in range(weeks):
            cohort_start = datetime.utcnow() - timedelta(weeks=weeks - week_offset)
            cohort_end = cohort_start + timedelta(weeks=1)
            
            cohort_users = self.db.query(User.id).filter(
                and_(
                    User.created_at >= cohort_start,
                    User.created_at < cohort_end
                )
            ).all()
            
            user_ids = [u.id for u in cohort_users]
            cohort_size = len(user_ids)
            
            if cohort_size == 0:
                continue
            
            retention = [100.0]
            
            for retention_week in range(1, 4):
                week_start = cohort_end + timedelta(weeks=retention_week - 1)
                week_end = week_start + timedelta(weeks=1)
                
                if week_end > datetime.utcnow():
                    retention.append(None)
                    continue
                
                active_count = self.db.query(func.count(distinct(AnalyticsEvent.user_id))).filter(
                    and_(
                        AnalyticsEvent.user_id.in_(user_ids),
                        AnalyticsEvent.created_at >= week_start,
                        AnalyticsEvent.created_at < week_end
                    )
                ).scalar() or 0
                
                retention_rate = (active_count / cohort_size * 100) if cohort_size > 0 else 0
                retention.append(round(retention_rate, 1))
            
            cohorts.append({
                'cohort_week': cohort_start.strftime('%b %d-%d'),
                'users': cohort_size,
                'retention': retention
            })
        
        return cohorts
    
    # ============================================
    # USER SEGMENTATION
    # ============================================
    
    def segment_by_activity(self) -> Dict:
        """Segment users by activity level"""
        power_users = self.db.query(func.count(ConversionFunnel.id)).filter(
            ConversionFunnel.total_analyses >= 10
        ).scalar() or 0
        
        active_users = self.db.query(func.count(ConversionFunnel.id)).filter(
            and_(
                ConversionFunnel.total_analyses >= 1,
                ConversionFunnel.total_analyses < 10
            )
        ).scalar() or 0
        
        inactive_users = self.db.query(func.count(User.id)).filter(
            ~User.id.in_(
                self.db.query(ConversionFunnel.user_id).filter(
                    ConversionFunnel.total_analyses >= 1
                )
            )
        ).scalar() or 0
        
        return {
            'power_users': power_users,
            'active_users': active_users,
            'inactive_users': inactive_users
        }
    
    def segment_by_conversion(self) -> Dict:
        """Segment users by conversion status"""
        converted = self.db.query(func.count(ConversionFunnel.id)).filter(
            ConversionFunnel.converted == True
        ).scalar() or 0
        
        viewed_premium = self.db.query(func.count(ConversionFunnel.id)).filter(
            and_(
                ConversionFunnel.total_premium_views >= 1,
                ConversionFunnel.converted == False
            )
        ).scalar() or 0
        
        never_viewed = self.db.query(func.count(ConversionFunnel.id)).filter(
            ConversionFunnel.total_premium_views == 0
        ).scalar() or 0
        
        return {
            'converted': converted,
            'viewed_premium_not_converted': viewed_premium,
            'never_viewed_premium': never_viewed
        }
    
    def segment_by_engagement(self) -> Dict:
        """Segment users by engagement level"""
        high = self.db.query(func.count(ConversionFunnel.id)).filter(
            ConversionFunnel.total_analyses >= 5
        ).scalar() or 0
        
        medium = self.db.query(func.count(ConversionFunnel.id)).filter(
            and_(
                ConversionFunnel.total_analyses >= 2,
                ConversionFunnel.total_analyses < 5
            )
        ).scalar() or 0
        
        low = self.db.query(func.count(ConversionFunnel.id)).filter(
            ConversionFunnel.total_analyses == 1
        ).scalar() or 0
        
        none = self.db.query(func.count(User.id)).filter(
            ~User.id.in_(
                self.db.query(ConversionFunnel.user_id).filter(
                    ConversionFunnel.total_analyses >= 1
                )
            )
        ).scalar() or 0
        
        return {
            'high_engagement': high,
            'medium_engagement': medium,
            'low_engagement': low,
            'no_engagement': none
        }
    
    # ============================================
    # CONVERSION PATHS
    # ============================================
    
    def get_conversion_paths(self, limit: int = 10) -> List[Dict]:
        """Get most common conversion paths"""
        converted_funnels = self.db.query(ConversionFunnel).filter(
            ConversionFunnel.converted == True
        ).all()
        
        paths = {}
        
        for funnel in converted_funnels:
            path_steps = ['signup']
            
            if funnel.stage_first_job_added:
                path_steps.append('job')
            
            if funnel.stage_first_analysis:
                path_steps.append('analysis')
            
            if funnel.stage_first_premium_view:
                path_steps.append('premium')
            
            path_steps.append('converted')
            
            path_key = ' → '.join(path_steps)
            
            if path_key not in paths:
                paths[path_key] = {
                    'path': path_key,
                    'steps': path_steps,
                    'count': 0,
                    'avg_days': []
                }
            
            paths[path_key]['count'] += 1
            
            if funnel.days_to_conversion:
                paths[path_key]['avg_days'].append(funnel.days_to_conversion)
        
        result = []
        for path_data in paths.values():
            avg_days = sum(path_data['avg_days']) / len(path_data['avg_days']) if path_data['avg_days'] else 0
            
            result.append({
                'path': path_data['path'],
                'steps': path_data['steps'],
                'count': path_data['count'],
                'avg_days_to_conversion': round(avg_days, 1)
            })
        
        result.sort(key=lambda x: x['count'], reverse=True)
        return result[:limit]
    
    # ============================================
    # HELPER METHODS
    # ============================================
    
    def _json_amount_expr(self, column):
        """Helper for JSON amount extraction (database-agnostic)"""
        dialect = self.db.get_bind().dialect.name
        if dialect == "postgresql":
            return cast(column.op("->>")("amount"), Numeric(12, 2))
        return cast(func.json_extract(column, "$.amount"), Numeric(12, 2))