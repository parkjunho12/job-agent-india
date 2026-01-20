import { useState } from 'react'
import { Lock, CheckCircle, ArrowRight, Loader, Shield, Zap, Target } from 'lucide-react'
import api from '../services/api'

/**
 * UnlockPremiumCard Component
 * Per-job premium unlock or subscription upgrade
 */
function UnlockPremiumCard({ premium, jobId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleUnlock = async () => {
    // Check if this is per-job unlock or subscription upgrade
    const isPerJobUnlock = premium.upgrade_url && premium.upgrade_url.includes('unlock')
    
    setLoading(true)
    setError(null)

    try {
      if (isPerJobUnlock) {
        // Per-job unlock
        const response = await api.post('/billing/unlock-job-premium', {
          job_id: jobId
        })
        
        // Redirect to Stripe checkout
        window.location.href = response.data.checkout_url
        
      } else {
        // Subscription upgrade - navigate to billing page
        window.location.href = '/billing'
      }
    } catch (err) {
      console.error('Unlock failed:', err)
      setError(err.response?.data?.detail || 'Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  // Determine if this is per-job unlock
  const isPerJobUnlock = premium.upgrade_url && premium.upgrade_url.includes('unlock')
  const price = premium.price || 2.99
  const currency = premium.currency || 'GBP'

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 border-4 border-primary-500 rounded-2xl p-8 shadow-xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-success-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-2">
          🔒 {premium.message || 'Unlock Full Analysis'}
        </h3>
        <p className="text-lg text-gray-700">
          {isPerJobUnlock 
            ? 'Get the complete fix plan for this job'
            : 'Upgrade to see detailed gap analysis and cover letter'}
        </p>
      </div>

      {/* What's Included */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
        <h4 className="font-bold text-gray-900 mb-4 text-lg">
          What You'll Get:
        </h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Detailed Gap Analysis</p>
              <p className="text-sm text-gray-600">
                See exactly which skills you're missing and why
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Quick Fix Action Items</p>
              <p className="text-sm text-gray-600">
                Step-by-step guide to improve your chances
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Custom Tips</p>
              <p className="text-sm text-gray-600">
                Personalized advice based on your profile
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">AI Application Assistant</p>
              <p className="text-sm text-gray-600">
                Generate cover letter, answers, and optimized CV
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing (if per-job) */}
      {isPerJobUnlock && (
        <div className="bg-gradient-to-r from-primary-500 to-success-500 text-white rounded-xl p-6 mb-6 text-center shadow-lg">
          <p className="text-sm opacity-90 mb-1">One-time payment</p>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-5xl font-bold">
              {currency === 'GBP' ? '£' : '$'}{price}
            </span>
          </div>
          <p className="text-sm opacity-90">For this job only • No subscription</p>
        </div>
      )}

      {/* Preview (if available) */}
      {premium.preview && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            🔍 What's locked:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {premium.preview.gap_count > 0 && (
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-primary-600" />
                <span>{premium.preview.gap_count} skill gaps</span>
              </div>
            )}
            {premium.preview.action_items_count > 0 && (
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-primary-600" />
                <span>{premium.preview.action_items_count} action items</span>
              </div>
            )}
            {premium.preview.tips_count > 0 && (
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-primary-600" />
                <span>{premium.preview.tips_count} custom tips</span>
              </div>
            )}
            {premium.preview.has_cover_letter && (
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-primary-600" />
                <span>Cover letter</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Unlock Button */}
      <button 
        onClick={handleUnlock}
        disabled={loading}
        className="btn btn-primary w-full text-xl font-bold h-16 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader className="w-6 h-6 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-6 h-6" />
            {isPerJobUnlock ? 'Unlock Full Analysis' : 'Upgrade Now'}
            <ArrowRight className="w-6 h-6" />
          </>
        )}
      </button>

      {/* Trust Signals */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Shield className="w-4 h-4 text-primary-600" />
          <span>Secure payment via Stripe</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <CheckCircle className="w-4 h-4 text-success-600" />
          <span>Instant access after payment</span>
        </div>
        {isPerJobUnlock && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-success-600" />
            <span>100% money-back guarantee</span>
          </div>
        )}
      </div>

      {/* Subscription Upsell (if per-job) */}
      {isPerJobUnlock && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700 text-center">
            💡 <strong>Analyzing multiple jobs?</strong> Get unlimited premium for £9.99/month
          </p>
          <button 
            onClick={() => window.location.href = '/billing'}
            className="btn btn-outline w-full mt-3 text-sm"
          >
            View Subscription Plans
          </button>
        </div>
      )}
    </div>
  )
}

export default UnlockPremiumCard