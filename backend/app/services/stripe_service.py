"""
Stripe Service - One-Time + Subscription Support (FIXED)
backend/app/services/stripe_service.py
"""

import stripe
import os
from typing import Optional, Dict
from datetime import datetime

from app.models.billing import PlanType
from app.utils.config import settings


# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """Stripe payment service"""
    
    # Stripe Price IDs
    PRICE_IDS = {
        "basic_monthly": settings.STRIPE_PRICE_BASIC_MONTHLY,
        "pro_monthly": settings.STRIPE_PRICE_PRO_MONTHLY,
        # One-time payments don't need price IDs (created dynamically)
    }
    
    def __init__(self):
        self.webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    
    # ============================================
    # Customer Management
    # ============================================
    
    def get_price_id(self, plan: str) -> Optional[str]:
        """Get price ID for plan"""
        key = f"{plan}_monthly"
        return self.PRICE_IDS.get(key)
    
    def create_customer(self, email: str, name: Optional[str] = None, user_id: Optional[int] = None) -> stripe.Customer:
        """Create a Stripe customer"""
        metadata = {"user_id": str(user_id)} if user_id else {}
        
        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata=metadata
        )
        
        return customer
    
    def get_customer(self, customer_id: str) -> Optional[stripe.Customer]:
        """Get a Stripe customer"""
        try:
            return stripe.Customer.retrieve(customer_id)
        except stripe.error.StripeError:
            return None
    
    # ============================================
    # One-Time Payment (Pay-Per-Job)
    # ============================================
    
    def create_payment_intent(
        self,
        amount: float,
        currency: str = "usd",
        customer_id: Optional[str] = None,
        description: str = "Job Analysis",
        metadata: Optional[Dict] = None
    ) -> stripe.PaymentIntent:
        """
        Create a one-time payment intent
        Amount in dollars (will be converted to cents)
        """
        
        # Convert dollars to cents
        amount_cents = int(amount * 100)
        
        intent_params = {
            "amount": amount_cents,
            "currency": currency,
            "description": description,
            "metadata": metadata or {},
            "automatic_payment_methods": {
                "enabled": True,
            }
        }
        
        if customer_id:
            intent_params["customer"] = customer_id
        
        payment_intent = stripe.PaymentIntent.create(**intent_params)
        
        return payment_intent
    
    def create_checkout_session_one_time(
        self,
        amount: float,
        customer_id: str,
        success_url: str,
        cancel_url: str,
        description: str = "Job Analysis",
        quantity: int = 1
    ) -> stripe.checkout.Session:
        """
        Create a checkout session for one-time payment
        """
        
        # Convert to cents
        amount_cents = int(amount * 100)
        
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": description,
                        "description": "AI-powered job analysis with match scoring and gap analysis"
                    },
                    "unit_amount": amount_cents,
                },
                "quantity": quantity,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "type": "one_time_job_analysis",
                "credits": quantity
            }
        )
        
        return session
    
    # ============================================
    # Subscription (Pro Plan)
    # ============================================
    
    def create_checkout_session_subscription(
        self,
        customer_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
        trial_days: Optional[int] = None
    ) -> stripe.checkout.Session:
        """Create a checkout session for subscription"""
        
        session_params = {
            "customer": customer_id,
            "payment_method_types": ["card"],
            "line_items": [{
                "price": price_id,
                "quantity": 1,
            }],
            "mode": "subscription",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "allow_promotion_codes": True,
        }
        
        if trial_days:
            session_params["subscription_data"] = {
                "trial_period_days": trial_days
            }
        
        session = stripe.checkout.Session.create(**session_params)
        
        return session
    
    def get_subscription(self, subscription_id: str) -> Optional[stripe.Subscription]:
        """Get a subscription"""
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.StripeError:
            return None
    
    def cancel_subscription(self, subscription_id: str, at_period_end: bool = True) -> stripe.Subscription:
        """Cancel a subscription"""
        if at_period_end:
            return stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
        else:
            return stripe.Subscription.delete(subscription_id)
    
    def resume_subscription(self, subscription_id: str) -> stripe.Subscription:
        """Resume a canceled subscription"""
        return stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False
        )
    
    # ============================================
    # Customer Portal
    # ============================================
    
    def create_portal_session(self, customer_id: str, return_url: str) -> stripe.billing_portal.Session:
        """Create a customer portal session"""
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        
        return session
    
    # ============================================
    # Webhook Handling
    # ============================================
    
    def construct_webhook_event(self, payload: bytes, sig_header: str) -> stripe.Event:
        """Construct and verify webhook event"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            return event
        except ValueError:
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise ValueError("Invalid signature")
    
    def extract_price_id(self, subscription) -> str | None:
        # StripeObject 경로
        items = getattr(subscription, "items", None)
        data = getattr(items, "data", None) if items else None

        if data and len(data) > 0:
            first = data[0]
            price = getattr(first, "price", None)

            # price가 Price 객체인 경우
            if price and hasattr(price, "id") and getattr(price, "id", None):
                return price.id

            # price가 문자열인 경우 ("price_...")
            if isinstance(price, str):
                return price

            # plan.id로도 들어오는 경우(레거시)
            plan = getattr(first, "plan", None)
            if plan and getattr(plan, "id", None):
                return plan.id

        # dict 경로(혹시 dict로 들어오는 경우)
        try:
            return subscription["items"]["data"][0]["price"]["id"]
        except Exception:
            pass

        try:
            price = subscription["items"]["data"][0].get("price")
            if isinstance(price, str):
                return price
        except Exception:
            pass

        return None

    
    def parse_subscription_from_event(self, event: stripe.Event) -> Optional[Dict]:
        """Parse subscription data from webhook event"""
       
        if event.type.startswith("customer.subscription"):
            subscription = event.data.object
            
            # 🔥 SAFE: Get price_id from nested structure
            price_id = self.extract_price_id(subscription)
            
            print(f"Parsing subscription from event: {price_id}")
            # 🔥 SAFE: Handle timestamps with getattr
            current_period_start_ts = getattr(subscription, 'current_period_start', None)
            current_period_end_ts = getattr(subscription, 'current_period_end', None)
            canceled_at_ts = getattr(subscription, 'canceled_at', None)
            
            current_period_start = datetime.fromtimestamp(current_period_start_ts) if current_period_start_ts else None
            current_period_end = datetime.fromtimestamp(current_period_end_ts) if current_period_end_ts else None
            canceled_at = datetime.fromtimestamp(canceled_at_ts) if canceled_at_ts else None
            
            return {
                "subscription_id": subscription.id,
                "customer_id": subscription.customer,
                "status": subscription.status,
                "current_period_start": current_period_start,
                "current_period_end": current_period_end,
                "cancel_at_period_end": getattr(subscription, 'cancel_at_period_end', False),
                "canceled_at": canceled_at,
                "price_id": price_id,
            }
        
        return None
    
    def parse_payment_from_event(self, event: stripe.Event) -> Optional[Dict]:
        """Parse payment data from webhook event"""
        
        # Handle one-time payments
        if event.type == "checkout.session.completed":
            session = event.data.object
            
            if session.mode == "payment":
                return {
                    "type": "one_time",
                    "session_id": session.id,
                    "customer_id": session.customer,
                    "amount": session.amount_total / 100,
                    "currency": session.currency,
                    "status": "succeeded",
                    "payment_intent_id": session.payment_intent,
                    "metadata": session.metadata,
                    "paid_at": datetime.now()
                }
        
        # Handle subscription payments
        if event.type.startswith("invoice."):
            invoice = event.data.object
            
            # 🔥 SAFE: Check if subscription exists
            subscription_id = getattr(invoice, 'subscription', None)
            
            # Only process subscription invoices
            if subscription_id:
                # 🔥 SAFE: Check if status_transitions exists
                paid_at = None
                if hasattr(invoice, 'status_transitions') and invoice.status_transitions:
                    if hasattr(invoice.status_transitions, 'paid_at') and invoice.status_transitions.paid_at:
                        paid_at = datetime.fromtimestamp(invoice.status_transitions.paid_at)
                
                return {
                    "type": "subscription",
                    "invoice_id": invoice.id,
                    "customer_id": invoice.customer,
                    "subscription_id": subscription_id,
                    "amount": invoice.amount_paid / 100,
                    "currency": invoice.currency,
                    "status": invoice.status,
                    "paid_at": paid_at,
                }
        
        return None


# Singleton instance
stripe_service = StripeService()