"""
Billing API - 4-Tier System (FREE, PAY-PER-JOB, BASIC, PRO)
backend/app/api/billing.py
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import os

from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from app.db.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.billing import (
    Subscription, Transaction, UsageCounter,
    SubscriptionResponse, UsageResponse, 
    PlanType, SubscriptionStatus, TransactionType,
    PRICING_TIERS, PLAN_COMPARISON
)
from app.api.auth import get_current_user
from app.services.stripe_service import stripe_service
from app.services.usage_service import UsageService, QuotaExceededError

from app.utils.config import settings

router = APIRouter()

# ============================================
# 🔓 PER-JOB PREMIUM UNLOCK (NEW!)
# ============================================

class UnlockJobRequest(BaseModel):
    job_id: int

# ============================================
# Plans & Pricing
# ============================================

@router.get("/plans")
async def get_plans():
    """Get available plans and pricing"""
    return {"plans": PRICING_TIERS}


@router.get("/comparison")
async def get_plan_comparison():
    """Get detailed plan comparison"""
    return {"comparison": PLAN_COMPARISON}


# ============================================
# Subscription Management
# ============================================

@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current subscription"""
    usage_service = UsageService(db)
    subscription = usage_service.get_or_create_subscription(current_user.id)
    return subscription


# ============================================
# One-Time Payment (Pay-Per-Job)
# ============================================

@router.post("/buy-credit")
async def buy_credit(
    quantity: int = 1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Buy credits for job analysis
    $2.99 per credit
    """
    
    if quantity < 1 or quantity > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be between 1 and 100"
        )
    
    usage_service = UsageService(db)
    subscription = usage_service.get_or_create_subscription(current_user.id)
    
    # Create Stripe customer if not exists
    if not subscription.stripe_customer_id:
        customer = stripe_service.create_customer(
            email=current_user.email,
            name=current_user.full_name,
            user_id=current_user.id
        )
        subscription.stripe_customer_id = customer.id
        db.commit()
    
    # Calculate amount
    amount = 2.99 * quantity
    
    # Create checkout session
    frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
    success_url = f"{frontend_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{frontend_url}/billing"
    
    try:
        session = stripe_service.create_checkout_session_one_time(
            amount=amount,
            customer_id=subscription.stripe_customer_id,
            success_url=success_url,
            cancel_url=cancel_url,
            description=f"Job Analysis Credit {'(x' + str(quantity) + ')' if quantity > 1 else ''}",
            quantity=quantity
        )
        
        return {
            "checkout_url": session.url,
            "session_id": session.id,
            "amount": amount,
            "credits": quantity
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout: {str(e)}"
        )


# ============================================
# Subscription Plans
# ============================================

@router.post("/subscribe-basic")
async def subscribe_basic(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Subscribe to Basic plan
    $9/month - 25 analyses
    """
    
    usage_service = UsageService(db)
    subscription = usage_service.get_or_create_subscription(current_user.id)
    
    # Check if already on Basic or higher
    if subscription.plan == PlanType.BASIC:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already subscribed to Basic plan"
        )
    
    if subscription.plan == PlanType.PRO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already on Pro plan. Use downgrade if needed."
        )
    
    # Create Stripe customer if not exists
    if not subscription.stripe_customer_id:
        customer = stripe_service.create_customer(
            email=current_user.email,
            name=current_user.full_name,
            user_id=current_user.id
        )
        subscription.stripe_customer_id = customer.id
        db.commit()
    
    # Get Basic price ID
    price_id = settings.STRIPE_PRICE_BASIC_MONTHLY
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Basic plan price not configured"
        )
    
    # Create checkout session
    frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
    success_url = f"{frontend_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{frontend_url}/billing"
    
    try:
        session = stripe_service.create_checkout_session_subscription(
            customer_id=subscription.stripe_customer_id,
            price_id=price_id,
            success_url=success_url,
            cancel_url=cancel_url,
            trial_days=None  # Set to 7 or 14 for trial
        )
        
        return {
            "checkout_url": session.url,
            "session_id": session.id,
            "plan": "basic",
            "price": 9.0
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout: {str(e)}"
        )


@router.post("/subscribe-pro")
async def subscribe_pro(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Subscribe to Pro plan
    $29/month - 100 analyses
    """
    
    usage_service = UsageService(db)
    subscription = usage_service.get_or_create_subscription(current_user.id)
    
    # Check if already on Pro
    if subscription.plan == PlanType.PRO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already subscribed to Pro plan"
        )
    
    # Create Stripe customer if not exists
    if not subscription.stripe_customer_id:
        customer = stripe_service.create_customer(
            email=current_user.email,
            name=current_user.full_name,
            user_id=current_user.id
        )
        subscription.stripe_customer_id = customer.id
        db.commit()
    
    # Get Pro price ID
    price_id = settings.STRIPE_PRICE_PRO_MONTHLY
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Pro plan price not configured"
        )
    
    # If upgrading from Basic, cancel old subscription
    if subscription.plan == PlanType.BASIC and subscription.stripe_subscription_id:
        try:
            stripe_service.cancel_subscription(
                subscription.stripe_subscription_id,
                at_period_end=False
            )
        except:
            pass  # Continue even if cancellation fails
    
    # Create checkout session
    frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
    success_url = f"{frontend_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{frontend_url}/billing"
    
    try:
        session = stripe_service.create_checkout_session_subscription(
            customer_id=subscription.stripe_customer_id,
            price_id=price_id,
            success_url=success_url,
            cancel_url=cancel_url,
            trial_days=None
        )
        
        return {
            "checkout_url": session.url,
            "session_id": session.id,
            "plan": "pro",
            "price": 29.0
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout: {str(e)}"
        )


# ============================================
# Subscription Actions
# ============================================

@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel subscription at period end"""
    
    usage_service = UsageService(db)
    subscription = usage_service.get_user_subscription(current_user.id)
    
    if not subscription or not subscription.stripe_subscription_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription found"
        )
    
    if subscription.plan not in [PlanType.BASIC, PlanType.PRO]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Basic and Pro plans can be canceled"
        )
    
    try:
        stripe_service.cancel_subscription(
            subscription.stripe_subscription_id,
            at_period_end=True
        )
        
        subscription.cancel_at_period_end = True
        db.commit()
        
        return {
            "message": "Subscription will be canceled at period end",
            "period_end": subscription.current_period_end,
            "plan": subscription.plan.value
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel subscription: {str(e)}"
        )


@router.post("/resume")
async def resume_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resume a canceled subscription"""
    
    usage_service = UsageService(db)
    subscription = usage_service.get_user_subscription(current_user.id)
    
    if not subscription or not subscription.stripe_subscription_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No subscription found"
        )
    
    if not subscription.cancel_at_period_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription is not set to cancel"
        )
    
    try:
        stripe_service.resume_subscription(subscription.stripe_subscription_id)
        
        subscription.cancel_at_period_end = False
        db.commit()
        
        return {
            "message": "Subscription resumed successfully",
            "plan": subscription.plan.value
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resume subscription: {str(e)}"
        )


# ============================================
# Customer Portal
# ============================================

@router.post("/portal")
async def create_portal_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create Stripe customer portal session"""
    
    usage_service = UsageService(db)
    subscription = usage_service.get_user_subscription(current_user.id)
    
    if not subscription or not subscription.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No payment method found"
        )
    
    frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
    return_url = f"{frontend_url}/billing"
    
    try:
        session = stripe_service.create_portal_session(
            customer_id=subscription.stripe_customer_id,
            return_url=return_url
        )
        
        return {
            "portal_url": session.url
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create portal: {str(e)}"
        )


# ============================================
# Usage & Credits
# ============================================

@router.get("/usage")
async def get_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage statistics"""
    usage_service = UsageService(db)
    stats = usage_service.get_usage_stats(current_user.id)
    return stats


@router.get("/credits")
async def get_credits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current credit balance"""
    usage_service = UsageService(db)
    credits = usage_service.get_credits(current_user.id)
    
    return {
        "credits": credits,
        "plan": usage_service.get_user_subscription(current_user.id).plan.value
    }


@router.get("/can-analyze")
async def can_analyze(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user can analyze a job"""
    usage_service = UsageService(db)
    can_analyze, reason, details = usage_service.can_analyze_job(current_user)
    
    return {
        "can_analyze": can_analyze,
        "reason": reason,
        "details": details
    }


# ============================================
# Payment History
# ============================================

@router.get("/transactions")
async def get_transactions(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment transaction history"""
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.created_at.desc()).limit(limit).all()
    
    return {
        "transactions": [
            {
                "id": t.id,
                "type": t.type.value,
                "amount": t.amount,
                "currency": t.currency,
                "status": t.status,
                "description": t.description,
                "credits_added": t.credits_added,
                "paid_at": t.paid_at,
                "created_at": t.created_at
            }
            for t in transactions
        ]
    }
    
@router.post("/unlock-job-premium")
async def unlock_job_premium(
    request: UnlockJobRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlock premium features for a specific job
    One-time payment of £2.99
    
    This allows users to buy premium analysis per-job
    without subscribing to a plan
    """
    
    # Get job
    job = db.query(Job).filter(
        Job.id == request.job_id,
        Job.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check if already unlocked
    if hasattr(job, 'is_premium_unlocked') and job.is_premium_unlocked:
        return {
            "message": "Job premium already unlocked",
            "job_id": job.id,
            "unlocked_at": job.premium_unlocked_at
        }
    
    # Get or create subscription (for Stripe customer)
    usage_service = UsageService(db)
    subscription = usage_service.get_or_create_subscription(current_user.id)
    
    # Create Stripe customer if not exists
    if not subscription.stripe_customer_id:
        customer = stripe_service.create_customer(
            email=current_user.email,
            name=current_user.full_name,
            user_id=current_user.id
        )
        subscription.stripe_customer_id = customer.id
        db.commit()
    
    # Create Stripe checkout session
    frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
    success_url = f"{frontend_url}/jobs/{job.id}/analysis?unlock_success=true"
    cancel_url = f"{frontend_url}/jobs/{job.id}/analysis?unlock_cancelled=true"
    
    try:
        # Create checkout session for one-time payment
        session = stripe_service.create_checkout_session_one_time(
        amount=2.99,
        customer_id=subscription.stripe_customer_id,
        success_url=success_url,
        cancel_url=cancel_url,
        description=f"Premium Analysis: {job.title}",
        quantity=1,
        metadata={
            "type": "job_premium_unlock",
            "quantity": 1,
            "user_id": current_user.id,
            "job_id": job.id
        }
    )
        
        # Create pending unlock record
        # (You'll need to create a PremiumUnlock model/table)
        # For now, we'll track via transaction metadata
        
        return {
            "checkout_url": session.url,
            "session_id": session.id,
            "job_id": job.id,
            "amount": 2.99,
            "currency": "USD"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout: {str(e)}"
        )


# ============================================
# Stripe Webhook
# ============================================

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Stripe webhooks"""
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe_service.construct_webhook_event(payload, sig_header)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    usage_service = UsageService(db)

    # ============================================
    # Handle One-Time Payment (Pay-per-job)
    # ============================================
    if event.type == "checkout.session.completed":
        session = event.data.object
        metadata = session.get("metadata", {})
        payment_type = metadata.get("type")
        
        print(f"🔔 Webhook: checkout.session.completed - type={session}")
        if payment_type == "job_premium_unlock":
            job_id = int(metadata.get("job_id"))
            user_id = int(metadata.get("user_id"))
            
            job = db.query(Job).filter(Job.id == job_id).first()
            
            if job:
                job.is_premium_unlocked = True
                job.premium_unlocked_at = datetime.now(timezone.utc)
                job.premium_unlock_transaction_id = session.payment_intent
                
                # Record transaction
                usage_service.record_transaction(
                    user_id=user_id,
                    amount=2.99,
                    type=TransactionType.ONE_TIME,
                    status="succeeded",
                    credits_added=0,
                    stripe_payment_intent_id=session.payment_intent,
                    description=f"Premium Unlock: {job.title}"
                )
                
                db.commit()
                print(f"✅ Unlocked premium for job {job_id}")
        
        if payment_type == "credit_purchase" or session.mode == "payment":
            # One-time payment completed
            customer_id = session.customer
            subscription = db.query(Subscription).filter(
                Subscription.stripe_customer_id == customer_id
            ).first()
            
            if subscription:
                # Get credits from metadata
                credits = int(session.metadata.get("credits", 1))
                
                # Add credits
                usage_service.add_credits(subscription.user_id, credits)
                
                # Record transaction
                usage_service.record_transaction(
                    user_id=subscription.user_id,
                    amount=session.amount_total / 100,
                    type=TransactionType.ONE_TIME,
                    status="succeeded",
                    credits_added=credits,
                    stripe_payment_intent_id=session.payment_intent,
                    description=f"{credits} Job Analysis Credit{'s' if credits > 1 else ''}"
                )
                
                # 🔥 CRITICAL: Commit the changes!
                db.commit()
                
                print(f"✅ Added {credits} credits to user {subscription.user_id}")
        
        elif session.mode == "subscription":
            # Subscription checkout completed
            # Note: The actual subscription details will come via customer.subscription.created
            # Just log this for now
            customer_id = session.customer
            subscription_id = getattr(session, 'subscription', None)
            
            print(f"✅ Subscription checkout completed: customer={customer_id}, subscription={subscription_id}")
            # The subscription.created event will handle the actual setup
    
    # ============================================
    # Handle Subscription Created
    # ============================================
    elif event.type == "customer.subscription.created":
        
        subscription_data = stripe_service.parse_subscription_from_event(event)
        
        print(f"🔔 Webhook: customer.subscription.created - data={subscription_data}")
        if subscription_data:
            subscription = db.query(Subscription).filter(
                Subscription.stripe_customer_id == subscription_data["customer_id"]
            ).first()
            
            if subscription:
                # Determine plan from price ID
                price_id = subscription_data["price_id"]
                basic_price_id = settings.STRIPE_PRICE_BASIC_MONTHLY
                pro_price_id = settings.STRIPE_PRICE_PRO_MONTHLY
                
          
                if price_id == basic_price_id:
                    plan = PlanType.BASIC
                elif price_id == pro_price_id:
                    plan = PlanType.PRO
                else:
                    plan = PlanType.FREE
                    
                
                # Update subscription
                usage_service.update_subscription_plan(
                    user_id=subscription.user_id,
                    plan=plan,
                    status=SubscriptionStatus(subscription_data["status"]),
                    stripe_subscription_id=subscription_data["subscription_id"],
                    stripe_price_id=price_id,
                    current_period_start=subscription_data["current_period_start"],
                    current_period_end=subscription_data["current_period_end"],
                    cancel_at_period_end=subscription_data["cancel_at_period_end"]
                )
                
                # 🔥 CRITICAL: Commit the changes!
                db.commit()
                
                print(f"✅ User {subscription.user_id} subscribed to {plan.value}")
    
    # ============================================
    # Handle Subscription Updated
    # ============================================
    elif event.type == "customer.subscription.updated":
        subscription_data = stripe_service.parse_subscription_from_event(event)
        
        if subscription_data:
            subscription = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == subscription_data["subscription_id"]
            ).first()
            
            if subscription:
                # Determine plan
                price_id = subscription_data["price_id"]
                basic_price_id = settings.STRIPE_PRICE_BASIC_MONTHLY
                pro_price_id = settings.STRIPE_PRICE_PRO_MONTHLY
                
                if price_id == basic_price_id:
                    plan = PlanType.BASIC
                elif price_id == pro_price_id:
                    plan = PlanType.PRO
                else:
                    plan = subscription.plan
                
                # Update
                usage_service.update_subscription_plan(
                    user_id=subscription.user_id,
                    plan=plan,
                    status=SubscriptionStatus(subscription_data["status"]),
                    stripe_price_id=price_id,
                    current_period_start=subscription_data["current_period_start"],
                    current_period_end=subscription_data["current_period_end"],
                    cancel_at_period_end=subscription_data["cancel_at_period_end"],
                    canceled_at=subscription_data["canceled_at"]
                )
                
                # 🔥 CRITICAL: Commit the changes!
                db.commit()
                
                print(f"✅ User {subscription.user_id} subscription updated")
    
    # ============================================
    # Handle Subscription Deleted
    # ============================================
    elif event.type == "customer.subscription.deleted":
        subscription_data = stripe_service.parse_subscription_from_event(event)
        
        if subscription_data:
            subscription = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == subscription_data["subscription_id"]
            ).first()
            
            if subscription:
                # Downgrade to FREE with 3 credits
                usage_service.update_subscription_plan(
                    user_id=subscription.user_id,
                    plan=PlanType.FREE,
                    status=SubscriptionStatus.CANCELED,
                    credits=3
                )
                
                # 🔥 CRITICAL: Commit the changes!
                db.commit()
                
                print(f"✅ User {subscription.user_id} downgraded to FREE")
    
    # ============================================
    # Handle Invoice Paid (Recurring Payment)
    # ============================================
    elif event.type == "invoice.paid":
        payment_data = stripe_service.parse_payment_from_event(event)
        
        if payment_data and payment_data["type"] == "subscription":
            subscription = db.query(Subscription).filter(
                Subscription.stripe_customer_id == payment_data["customer_id"]
            ).first()
            
            if subscription:
                # Record transaction
                usage_service.record_transaction(
                    user_id=subscription.user_id,
                    amount=payment_data["amount"],
                    type=TransactionType.SUBSCRIPTION,
                    status="succeeded",
                    credits_added=0,
                    stripe_invoice_id=payment_data["invoice_id"],
                    description=f"{subscription.plan.value.title()} Plan - Monthly",
                    paid_at=payment_data["paid_at"]
                )
                
                # 🔥 CRITICAL: Commit the changes!
                db.commit()
                
                print(f"✅ Recorded payment for user {subscription.user_id}")
    
    # ============================================
    # Handle Payment Failed
    # ============================================
    elif event.type == "invoice.payment_failed":
        payment_data = stripe_service.parse_payment_from_event(event)
        
        if payment_data:
            subscription = db.query(Subscription).filter(
                Subscription.stripe_customer_id == payment_data["customer_id"]
            ).first()
            
            if subscription:
                subscription.status = SubscriptionStatus.PAST_DUE
                db.commit()
                
                print(f"⚠️ Payment failed for user {subscription.user_id}")
    
    return {"status": "success"}