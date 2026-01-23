"""
Analytics Event Models
Track user behavior and conversion metrics
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class AnalyticsEvent(Base):
    """
    Track all user events for funnel analysis
    """
    __tablename__ = "analytics_events"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User info
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    session_id = Column(String(255), index=True)  # Track anonymous users too
    
    # Event details
    event_type = Column(String(100), nullable=False, index=True)
    event_category = Column(String(50), nullable=False, index=True)  # signup, analysis, conversion, etc.
    event_action = Column(String(100), nullable=False)  # button_click, form_submit, etc.
    event_label = Column(String(255))  # Additional context
    
    # Event data
    event_data = Column(JSON)  # Flexible metadata
    
    # Context
    page_url = Column(String(500))
    referrer = Column(String(500))
    user_agent = Column(String(500))
    ip_address = Column(String(50))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", backref="analytics_events")
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_event_user_category', 'user_id', 'event_category'),
        Index('idx_event_session_category', 'session_id', 'event_category'),
        Index('idx_event_type_created', 'event_type', 'created_at'),
    )


class ConversionFunnel(Base):
    """
    Track user progress through conversion funnel
    """
    __tablename__ = "conversion_funnels"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User info
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    session_id = Column(String(255), index=True)
    
    # Funnel stages (timestamps)
    stage_signup = Column(DateTime)
    stage_first_job_added = Column(DateTime)
    stage_first_analysis = Column(DateTime)
    stage_second_analysis = Column(DateTime)
    stage_third_analysis = Column(DateTime)
    stage_first_premium_view = Column(DateTime)
    stage_first_conversion = Column(DateTime)
    
    # Conversion details
    converted = Column(Boolean, default=False, index=True)
    conversion_type = Column(String(50))  # 'subscription', 'per_job', 'credits'
    conversion_amount = Column(Float)
    days_to_conversion = Column(Integer)
    
    # Usage metrics
    total_jobs_added = Column(Integer, default=0)
    total_analyses = Column(Integer, default=0)
    total_premium_views = Column(Integer, default=0)
    total_generations = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="conversion_funnel")
    
    # Indexes
    __table_args__ = (
        Index('idx_funnel_converted_created', 'converted', 'created_at'),
        Index('idx_funnel_stage_analysis', 'stage_first_analysis'),
    )


class DailyMetrics(Base):
    """
    Daily aggregated metrics for dashboard
    """
    __tablename__ = "daily_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    
    date = Column(DateTime, unique=True, index=True)
    
    # User metrics
    new_signups = Column(Integer, default=0)
    active_users = Column(Integer, default=0)
    
    # Usage metrics
    total_jobs_added = Column(Integer, default=0)
    total_analyses = Column(Integer, default=0)
    total_premium_views = Column(Integer, default=0)
    total_generations = Column(Integer, default=0)
    
    # Conversion metrics
    new_conversions = Column(Integer, default=0)
    conversion_revenue = Column(Float, default=0.0)
    
    # Funnel metrics (%)
    signup_to_first_job_rate = Column(Float)  # Users who add first job
    first_job_to_analysis_rate = Column(Float)  # Users who analyze
    analysis_to_premium_rate = Column(Float)  # Users who view premium
    premium_to_conversion_rate = Column(Float)  # Users who convert
    overall_conversion_rate = Column(Float)  # Signups to paid
    
    # Engagement metrics
    avg_analyses_per_user = Column(Float)
    avg_days_to_conversion = Column(Float)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)