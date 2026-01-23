/**
 * Analytics Service
 * Track user events and conversions
 */

import api from './api'

class Analytics {
  constructor() {
    this.sessionId = this.getOrCreateSessionId()
  }

  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }

  /**
   * Track a generic event
   */
  async trackEvent(eventType, eventCategory, eventAction, options = {}) {
    try {
      await api.post('/analytics/track', {
        event_type: eventType,
        event_category: eventCategory,
        event_action: eventAction,
        event_label: options.label,
        event_data: options.data,
        page_url: window.location.href,
        referrer: document.referrer
      }, {
        headers: {
          'X-Session-ID': this.sessionId
        }
      })

      console.log(
        '[Analytics] Tracked',
        eventType
      )

    } catch (error) {
      // Silent fail - don't disrupt user experience
      console.error('Analytics tracking failed:', error)
    }
  }

  /**
   * Track page view
   */
  trackPageView(pageName) {
    this.trackEvent('page_view', 'navigation', 'page_visited', {
      label: pageName
    })
  }

  /**
   * Track signup
   */
  trackSignup(userId) {
    this.trackEvent('signup', 'signup', 'account_created', {
      data: { user_id: userId }
    })
  }

  /**
   * Track job added
   */
  trackJobAdded(jobId) {
    this.trackEvent('job_added', 'usage', 'job_created', {
      data: { job_id: jobId }
    })
  }

  /**
   * Track job analysis
   */
  trackAnalysis(jobId, isPremium = false) {
    this.trackEvent('job_analyzed', 'usage', 'analysis_completed', {
      data: { job_id: jobId, is_premium: isPremium }
    })
  }

  /**
   * Track premium content view
   */
  trackPremiumView(jobId) {
    this.trackEvent('premium_viewed', 'engagement', 'premium_content_viewed', {
      data: { job_id: jobId }
    })
  }

  /**
   * Track content generation
   */
  trackGeneration(jobId, generationType) {
    this.trackEvent('content_generated', 'engagement', `generated_${generationType}`, {
      data: { job_id: jobId, type: generationType }
    })
  }

  /**
   * Track CTA clicks
   */
  trackCTAClick(ctaName, ctaLocation) {
    this.trackEvent('cta_click', 'conversion_intent', 'button_clicked', {
      label: ctaName,
      data: { location: ctaLocation }
    })
  }

  /**
   * Track conversion
   */
  trackConversion(conversionType, amount) {
    this.trackEvent(`conversion_${conversionType}`, 'conversion', 'payment_completed', {
      data: { type: conversionType, amount }
    })
  }

  /**
   * Track unlock premium (per-job)
   */
  trackUnlockPremium(jobId, amount = 2.99) {
    this.trackEvent('conversion_per_job', 'conversion', 'premium_unlocked', {
      data: { job_id: jobId, amount }
    })
  }

  /**
   * Track subscription
   */
  trackSubscription(plan, amount) {
    this.trackEvent('conversion_subscription', 'conversion', 'subscription_started', {
      data: { plan, amount }
    })
  }

  /**
   * Track feature discovery
   */
  trackFeatureDiscovery(featureName) {
    this.trackEvent('feature_discovered', 'engagement', 'feature_viewed', {
      label: featureName
    })
  }

  /**
   * Track onboarding progress
   */
  trackOnboardingStep(step) {
    this.trackEvent('onboarding_step', 'onboarding', 'step_completed', {
      label: step
    })
  }

  /**
   * Track error
   */
  trackError(errorType, errorMessage) {
    this.trackEvent('error_occurred', 'error', errorType, {
      label: errorMessage
    })
  }
}

// Export singleton instance
const analytics = new Analytics()
export default analytics