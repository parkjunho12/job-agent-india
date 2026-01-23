"""
Analytics Service
Track events and calculate conversion metrics
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
from sqlalchemy import Float
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import uuid

from app.models.analytics import AnalyticsEvent, ConversionFunnel, DailyMetrics
from app.models.user import User
from app.models.job import Job


class AnalyticsService:
    """
    Service for tracking analytics events and calculating metrics
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============================================
    # Event Tracking
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
        """
        Track a single event
        """
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
        """
        Update user's conversion funnel progress
        """
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
            
            # Update conversion details from event data
            funnel.conversion_type = event_type.replace('conversion_', '')
        
        funnel.updated_at = now
        self.db.commit()
    
    # ============================================
    # Quick Event Helpers
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
        """Track content generation (cover letter, answers, etc.)"""
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
    # Metrics Calculation
    # ============================================
    
    def calculate_daily_metrics(self, date: datetime) -> DailyMetrics:
        """
        Calculate metrics for a specific day
        """
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
        
        
        # Active users (users who did anything)
        active_users = self.db.query(func.count(func.distinct(AnalyticsEvent.user_id))).filter(
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
        
        
        events = self.db.query(AnalyticsEvent.event_data).filter(
            and_(
                AnalyticsEvent.event_category == 'conversion',
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at < end_date
            )
        ).all()

        conversion_revenue = sum(
            float((e.event_data or {}).get("amount", 0) or 0)
            for e in events
        )
        
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
        """
        Calculate funnel conversion rates
        """
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
    
    def get_overview_metrics(self, days: int = 14) -> Dict:
        """
        Get overview metrics for the past N days
        """
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
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
        
        print(start_date)
        
        # Current active users (last 7 days)
        active_users = self.db.query(func.count(func.distinct(AnalyticsEvent.user_id))).filter(
            and_(
                AnalyticsEvent.created_at >= datetime.utcnow() - timedelta(days=7),
                AnalyticsEvent.user_id.isnot(None)
            )
        ).scalar() or 0
        
        # Users with 1+ analyses (free tier usage)
        users_with_analysis = self.db.query(func.count(ConversionFunnel.id)).filter(
            ConversionFunnel.total_analyses >= 1
        ).scalar() or 0
        
        return {
            'period_days': days,
            'total_signups': metrics.total_signups or 0,
            'total_analyses': metrics.total_analyses or 0,
            'total_conversions': metrics.total_conversions or 0,
            'total_revenue': float(metrics.total_revenue or 0.0),
            'avg_conversion_rate': float(metrics.avg_conversion_rate or 0.0),
            'avg_analyses_per_user': float(metrics.avg_analyses_per_user or 0.0),
            'active_users_7d': active_users,
            'users_with_analysis': users_with_analysis,
            
            # Goal tracking (2 weeks)
            'goals': {
                'signups': {
                    'target': 50,
                    'current': metrics.total_signups or 0,
                    'progress': ((metrics.total_signups or 0) / 50 * 100)
                },
                'free_usage_rate': {
                    'target': 40.0,  # 40% use 1+ of 3 free analyses
                    'current': (users_with_analysis / (metrics.total_signups or 1) * 100) if metrics.total_signups else 0,
                    'progress': ((users_with_analysis / (metrics.total_signups or 1) * 100) / 40 * 100) if metrics.total_signups else 0
                },
                'conversion_rate': {
                    'target': 5.0,  # 5% conversion
                    'current': float(metrics.avg_conversion_rate or 0.0),
                    'progress': (float(metrics.avg_conversion_rate or 0.0) / 5.0 * 100)
                }
            }
        }