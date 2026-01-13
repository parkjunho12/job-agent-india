"""
Usage Service - Credit-Based System
backend/app/services/usage_service.py
"""

from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Tuple

from app.models.user import User
from app.models.billing import (
    Subscription, UsageCounter, Transaction, PlanType, 
    get_plan_limits, SubscriptionStatus, TransactionType
)


class UsageService:
    """Service for managing usage and credits"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_or_create_counter(self, user_id: int) -> UsageCounter:
        """Get or create current month's usage counter"""
        now = datetime.now()
        year = now.year
        month = now.month
        
        counter = self.db.query(UsageCounter).filter(
            UsageCounter.user_id == user_id,
            UsageCounter.year == year,
            UsageCounter.month == month
        ).first()
        
        if not counter:
            counter = UsageCounter(
                user_id=user_id,
                year=year,
                month=month,
                analyses_count=0
            )
            self.db.add(counter)
            self.db.commit()
            self.db.refresh(counter)
        
        return counter
    
    def increment_analysis_count(self, user_id: int) -> UsageCounter:
        """Increment analysis count"""
        counter = self.get_or_create_counter(user_id)
        counter.analyses_count += 1
        self.db.commit()
        self.db.refresh(counter)
        return counter
    
    def get_user_subscription(self, user_id: int) -> Optional[Subscription]:
        """Get user's subscription"""
        return self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()
    
    def get_or_create_subscription(self, user_id: int) -> Subscription:
        """Get or create user's subscription"""
        subscription = self.get_user_subscription(user_id)
        
        if not subscription:
            subscription = Subscription(
                user_id=user_id,
                plan=PlanType.FREE,
                status=SubscriptionStatus.ACTIVE,
                credits=3
            )
            self.db.add(subscription)
            self.db.commit()
            self.db.refresh(subscription)
        
        return subscription
    
    def add_credits(self, user_id: int, credits: int) -> Subscription:
        """Add credits to user account"""
        subscription = self.get_or_create_subscription(user_id)
        subscription.credits += credits
        self.db.commit()
        self.db.refresh(subscription)
        return subscription
    
    def deduct_credit(self, user_id: int) -> Subscription:
        """Deduct 1 credit"""
        subscription = self.get_or_create_subscription(user_id)
        
        if subscription.credits <= 0:
            raise InsufficientCreditsError("No credits remaining")
        
        subscription.credits -= 1
        self.db.commit()
        self.db.refresh(subscription)
        return subscription
    
    def get_credits(self, user_id: int) -> int:
        """Get user's credits"""
        subscription = self.get_or_create_subscription(user_id)
        return subscription.credits
    
    def can_analyze_job(self, user: User) -> Tuple[bool, str, dict]:
        """Check if user can analyze"""
        subscription = self.get_or_create_subscription(user.id)
        plan = subscription.plan
        limits = get_plan_limits(plan)
        counter = self.get_or_create_counter(user.id)
        
        details = {
            "plan": plan.value,
            "credits": subscription.credits,
            "monthly_used": counter.analyses_count,
            "monthly_limit": limits.analyses_per_month
        }
        
        if plan == PlanType.FREE:
            if subscription.credits > 0:
                return True, "Credit available", details
            else:
                return False, "No credits. Upgrade to continue.", details
        
        if plan == PlanType.PAY_PER_JOB:
            if subscription.credits > 0:
                return True, "Credit available", details
            else:
                return False, "No credits. Purchase more.", details
        
        if plan == PlanType.BASIC:
            if counter.analyses_count < limits.analyses_per_month:
                return True, "Monthly quota available", details
            else:
                return False, f"Monthly limit reached (25/month)", details
        
        if plan == PlanType.PRO:
            if counter.analyses_count < limits.analyses_per_month:
                return True, "Monthly quota available", details
            else:
                return False, f"Monthly limit reached", details
        
        return False, "Unknown plan", details
    
    def enforce_analysis_quota(self, user: User) -> None:
        """Enforce quota"""
        can_analyze, reason, details = self.can_analyze_job(user)
        
        if not can_analyze:
            raise QuotaExceededError(
                message=reason,
                plan=details["plan"],
                credits=details["credits"],
                monthly_used=details["monthly_used"],
                monthly_limit=details["monthly_limit"]
            )
    
    def record_analysis(self, user_id: int) -> None:
        """Record analysis"""
        subscription = self.get_or_create_subscription(user_id)
        
        if subscription.plan in [PlanType.FREE, PlanType.PAY_PER_JOB]:
            self.deduct_credit(user_id)
        
        self.increment_analysis_count(user_id)
    
    def record_transaction(
        self,
        user_id: int,
        amount: float,
        type: TransactionType,
        status: str = "succeeded",
        credits_added: int = 0,
        **kwargs
    ) -> Transaction:
        """Record transaction"""
        transaction = Transaction(
            user_id=user_id,
            type=type,
            amount=amount,
            status=status,
            credits_added=credits_added,
            **kwargs
        )
        
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction
    
    def update_subscription_plan(
        self,
        user_id: int,
        plan: PlanType,
        status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
        **kwargs
    ) -> Subscription:
        """Update plan"""
        subscription = self.get_or_create_subscription(user_id)
        
        old_plan = subscription.plan
        subscription.plan = plan
        subscription.status = status
        
        # Credit management based on plan changes
        if plan in [PlanType.BASIC, PlanType.PRO] and old_plan not in [PlanType.BASIC, PlanType.PRO]:
            # Upgrading to subscription plan: clear credits
            subscription.credits = 0
        elif plan == PlanType.FREE and old_plan in [PlanType.BASIC, PlanType.PRO]:
            # Downgrading to free: give 3 credits
            subscription.credits = 3
        
        for key, value in kwargs.items():
            if hasattr(subscription, key):
                setattr(subscription, key, value)
        
        self.db.commit()
        self.db.refresh(subscription)
        
        return subscription
    
    def get_usage_stats(self, user_id: int) -> dict:
        """Get stats"""
        subscription = self.get_or_create_subscription(user_id)
        plan = subscription.plan
        limits = get_plan_limits(plan)
        counter = self.get_or_create_counter(user_id)
        
        stats = {
            "plan": plan.value,
            "credits": subscription.credits,
            "analyses_this_month": counter.analyses_count,
            "period": {
                "year": counter.year,
                "month": counter.month
            }
        }
        
        if plan in [PlanType.BASIC, PlanType.PRO]:
            stats["monthly_limit"] = limits.analyses_per_month
            stats["monthly_remaining"] = max(0, limits.analyses_per_month - counter.analyses_count)
            stats["monthly_percentage"] = int((counter.analyses_count / limits.analyses_per_month) * 100) if limits.analyses_per_month > 0 else 0
        
        return stats


class QuotaExceededError(Exception):
    def __init__(self, message: str, plan: str, credits: int, monthly_used: int, monthly_limit: int):
        self.message = message
        self.plan = plan
        self.credits = credits
        self.monthly_used = monthly_used
        self.monthly_limit = monthly_limit
        super().__init__(self.message)


class InsufficientCreditsError(Exception):
    pass