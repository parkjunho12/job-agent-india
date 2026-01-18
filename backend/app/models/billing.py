"""
Billing Models - 4-Tier System with BASIC
backend/app/models/billing.py
"""

import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.db.database import Base


# ============================================
# Enums
# ============================================

class SubscriptionStatus(enum.Enum):
    """Subscription status"""
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    UNPAID = "unpaid"
    TRIALING = "trialing"


class PlanType(enum.Enum):
    """Plan types - 4 tiers"""
    FREE = "free"              # 3 analyses
    PAY_PER_JOB = "pay_per_job"  # $2.99 per job
    BASIC = "basic"            # $9/month, 25 analyses
    PRO = "pro"                # $29/month, 100 analyses


class TransactionType(enum.Enum):
    """Transaction types"""
    SUBSCRIPTION = "subscription"
    ONE_TIME = "one_time"
    CREDIT_PURCHASE = "credit_purchase"


# ============================================
# Database Models
# ============================================

class Subscription(Base):
    """User subscription"""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Plan info
    plan = Column(Enum(PlanType, name="plan_type"), default=PlanType.FREE, nullable=False)
    status = Column(Enum(SubscriptionStatus, name="subscription_status"), default=SubscriptionStatus.ACTIVE, nullable=False)
    
    # Stripe info
    stripe_customer_id = Column(String(255), unique=True, nullable=True, index=True)
    stripe_subscription_id = Column(String(255), unique=True, nullable=True, index=True)
    stripe_price_id = Column(String(255), nullable=True)
    
    # Credits (for FREE and PAY_PER_JOB users)
    credits = Column(Integer, default=3, nullable=False)
    
    # Billing dates
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end = Column(Boolean, default=False, nullable=False)
    canceled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="subscription")


class UsageCounter(Base):
    """Monthly usage counter"""
    __tablename__ = "usage_counters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Period info
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    
    # Counters
    analyses_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="usage_counters")


class Transaction(Base):
    """Payment transactions"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Transaction info
    type = Column(Enum(TransactionType, name="transaction_type"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="usd", nullable=False)
    status = Column(String(50), nullable=False)
    
    # Stripe info
    stripe_payment_intent_id = Column(String(255), unique=True, nullable=True, index=True)
    stripe_invoice_id = Column(String(255), unique=True, nullable=True)
    stripe_charge_id = Column(String(255), unique=True, nullable=True)
    
    # Details
    description = Column(Text, nullable=True)
    credits_added = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="transactions")


# ============================================
# Pydantic Schemas
# ============================================

class PlanLimits(BaseModel):
    """Plan limits and pricing"""
    analyses_per_month: int
    price_monthly: float
    price_per_job: Optional[float] = None
    credits_on_signup: int = 0
    features: list[str] = []


class SubscriptionResponse(BaseModel):
    """Subscription response"""
    id: int
    user_id: int
    plan: str
    status: str
    credits: int
    stripe_customer_id: Optional[str]
    stripe_subscription_id: Optional[str]
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UsageResponse(BaseModel):
    """Usage response"""
    year: int
    month: int
    analyses_count: int
    analyses_limit: int
    analyses_remaining: int
    credits: int
    plan: str


class OneTimePaymentRequest(BaseModel):
    """One-time payment request"""
    amount: float = 2.99
    description: str = "Job Analysis"
    credits: int = 1


class CheckoutSessionRequest(BaseModel):
    """Create checkout session"""
    plan: str  # 'basic' or 'pro'
    success_url: str
    cancel_url: str


class PortalSessionRequest(BaseModel):
    """Customer portal session"""
    return_url: str


# ============================================
# Plan Configuration
# ============================================

PLAN_LIMITS = {
    PlanType.FREE: PlanLimits(
        analyses_per_month=3,
        price_monthly=0.0,
        credits_on_signup=3,
        features=[
            "3 job analyses",
            "Match scoring",
            "Basic insights",
            "Community support"
        ]
    ),
    PlanType.PAY_PER_JOB: PlanLimits(
        analyses_per_month=999999,  # Unlimited with credits
        price_monthly=0.0,
        price_per_job=2.99,
        credits_on_signup=0,
        features=[
            "Pay only for what you use",
            "Full AI analysis",
            "Gap analysis",
            "ATS keywords",
            "Application template",
            "No monthly commitment"
        ]
    ),
    PlanType.BASIC: PlanLimits(
        analyses_per_month=25,
        price_monthly=9.99,
        credits_on_signup=0,
        features=[
            "25 analyses per month",
            "Full AI analysis",
            "Gap analysis",
            "ATS keywords",
            "Email support",
            "Save job history"
        ]
    ),
    PlanType.PRO: PlanLimits(
        analyses_per_month=100,
        price_monthly=29.99,
        credits_on_signup=0,
        features=[
            "100 analyses per month",
            "Everything in Basic",
            "Priority support",
            "Advanced analytics",
            "Custom templates",
            "Batch processing",
            "Export reports"
        ]
    ),
}


def get_plan_limits(plan: PlanType) -> PlanLimits:
    """Get limits for a plan"""
    return PLAN_LIMITS.get(plan, PLAN_LIMITS[PlanType.FREE])


# ============================================
# Pricing Tiers (for UI)
# ============================================

PRICING_TIERS = [
    {
        "id": "free",
        "name": "Try Free",
        "price": 0,
        "period": "",
        "description": "Perfect for testing",
        "features": [
            "3 job analyses",
            "Match scoring",
            "Basic insights"
        ],
        "cta": "Start Free",
        "highlighted": False
    },
    {
        "id": "pay_per_job",
        "name": "Pay Per Job",
        "price": 2.99,
        "period": "per job",
        "description": "No commitment needed",
        "features": [
            "Full AI analysis",
            "Gap analysis",
            "ATS keywords",
            "Application template",
            "Pay only what you use"
        ],
        "cta": "Get Started",
        "highlighted": False
    },
    {
        "id": "basic",
        "name": "Basic",
        "price": 9.99,
        "period": "per month",
        "description": "For casual job seekers",
        "features": [
            "25 analyses/month",
            "Full AI analysis",
            "Gap analysis",
            "Email support",
            "Save job history"
        ],
        "cta": "Choose Basic",
        "highlighted": False
    },
    {
        "id": "pro",
        "name": "Pro",
        "price": 29.99,
        "period": "per month",
        "description": "For serious job seekers",
        "features": [
            "100 analyses/month",
            "Everything in Basic",
            "Priority support",
            "Advanced analytics",
            "Batch processing",
            "Export reports"
        ],
        "cta": "Choose Pro",
        "highlighted": True,
        "badge": "BEST VALUE"
    }
]


# ============================================
# Plan Comparison (for landing page)
# ============================================

PLAN_COMPARISON = {
    "analyses": {
        "label": "Job Analyses",
        "free": "3",
        "pay_per_job": "Unlimited*",
        "basic": "25/month",
        "pro": "100/month"
    },
    "match_scoring": {
        "label": "Match Scoring",
        "free": True,
        "pay_per_job": True,
        "basic": True,
        "pro": True
    },
    "gap_analysis": {
        "label": "Gap Analysis",
        "free": "Basic",
        "pay_per_job": True,
        "basic": True,
        "pro": "Advanced"
    },
    "ats_keywords": {
        "label": "ATS Keywords",
        "free": False,
        "pay_per_job": True,
        "basic": True,
        "pro": True
    },
    "templates": {
        "label": "Application Templates",
        "free": False,
        "pay_per_job": True,
        "basic": True,
        "pro": "Custom"
    },
    "support": {
        "label": "Support",
        "free": "Community",
        "pay_per_job": "Email",
        "basic": "Email",
        "pro": "Priority"
    },
    "analytics": {
        "label": "Analytics",
        "free": False,
        "pay_per_job": False,
        "basic": "Basic",
        "pro": "Advanced"
    },
    "batch_processing": {
        "label": "Batch Processing",
        "free": False,
        "pay_per_job": False,
        "basic": False,
        "pro": True
    },
    "export": {
        "label": "Export Reports",
        "free": False,
        "pay_per_job": False,
        "basic": False,
        "pro": True
    }
}