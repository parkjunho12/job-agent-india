import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { billingApi, authApi } from '../services/api'
import { CheckCircle, Loader2, ArrowRight, CreditCard } from 'lucide-react'
import analytics from '../services/analytics'

function BillingSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [countdown, setCountdown] = useState(5)
  const { updateUser } = useAuthStore()
  const sessionId = searchParams.get('session_id')
  const [done, setDone] = useState(false)

   // Control polling + syncing state
   const [isConfirmed, setIsConfirmed] = useState(false)
   const [syncError, setSyncError] = useState('')
   const [attempts, setAttempts] = useState(0)

   const MAX_ATTEMPTS = 5

  // Refetch subscription and usage data
  const subscriptionQuery = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: billingApi.getSubscription,
    enabled: !isConfirmed && attempts < MAX_ATTEMPTS,
    refetchInterval: !isConfirmed && attempts < MAX_ATTEMPTS ? 2000 : false,
    refetchIntervalInBackground: false,
  })

  const subscription = subscriptionQuery.data?.data
  const plan = subscription?.plan || 'free'
  const credits = subscription?.credits ?? 0

  const isLoading = subscriptionQuery.isLoading
  const isPolling = subscriptionQuery.isFetching && !subscriptionQuery.isLoading

  const isPlanActive = useMemo(() => {
    if (!subscription) return false
    const p = (subscription.plan || 'free').toLowerCase()
    if (p !== 'free') return true
    // If you prefer a stricter rule, uncomment:
    // return subscription.status === 'active' && p !== 'free'
    return false
  }, [subscription])

  const showTimeoutNotice = attempts >= MAX_ATTEMPTS && !isConfirmed
  
  useEffect(() => {
    // Invalidate all billing queries
    queryClient.invalidateQueries({ queryKey: ['billing'] })
    queryClient.invalidateQueries({ queryKey: ['user'] })
  }, [queryClient])
  
  useEffect(() => {
    if (!isPlanActive || isConfirmed) return

    ;(async () => {
      setSyncError('')
      try {
        // Fetch latest user (source of truth for authStore tier)
        const me = await authApi.me()
        updateUser(me.data)
        setAttempts(prev => prev + 1)

        analytics.trackEvent('payment_success', 'conversion', 'success_page_viewed')

        // Keep React Query cache consistent too (optional but recommended)
        queryClient.setQueryData(['user'], me)
        queryClient.invalidateQueries({ queryKey: ['user'] })

        setIsConfirmed(true)
      } catch (e) {
        // If this fails, keep polling; user can still navigate manually
        setSyncError('Payment succeeded, but we could not refresh your account details yet. Retrying...')
      }
    })()
  }, [isPlanActive, isConfirmed, updateUser, queryClient])

  useEffect(() => {
    const shouldStart = isConfirmed || showTimeoutNotice
    if (!shouldStart) return
  
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(prev - 1, 0))
    }, 1000)
  
    return () => clearInterval(timer)
  }, [isConfirmed, showTimeoutNotice])
  
  
  useEffect(() => {
    const shouldRedirect = isConfirmed || showTimeoutNotice
    if (!shouldRedirect) return
    if (countdown !== 0) return
  
    navigate('/settings?tab=billing')
  }, [countdown, isConfirmed, showTimeoutNotice, navigate])
  

  
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-success-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="card text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-success-600" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Payment Successful! 🎉
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your payment has been processed successfully.
          </p>
          
          {/* Loading or Details */}
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 text-gray-600 mb-8">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading your subscription details...</span>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-primary-50 to-success-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Subscription Details
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                  <p className="text-xl font-bold text-gray-900 capitalize">
                    {plan === 'pay_per_job' ? 'Pay Per Job' : plan}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Credits</p>
                  <p className="text-xl font-bold text-gray-900">
                    {credits}
                  </p>
                </div>
              </div>
              
              {sessionId && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Session ID: <code className="text-xs bg-gray-100 px-2 py-1 rounded">{sessionId}</code>
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* What's Next */}
          <div className="bg-primary-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              What's Next?
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
                <span>Your subscription is now active and ready to use</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
                <span>Start analyzing jobs with AI-powered insights</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
                <span>Check your billing settings anytime in Settings</span>
              </li>
            </ul>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/jobs')}
              className="btn btn-primary flex items-center justify-center gap-2"
            >
              Start Analyzing Jobs
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => navigate('/settings?tab=billing')}
              className="btn btn-secondary"
            >
              View Billing Settings
            </button>
          </div>
          
          {/* Auto redirect */}
          {(isConfirmed || showTimeoutNotice) && (
            <p className="text-sm text-gray-500 mt-6">
              Redirecting to settings in {countdown} seconds...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BillingSuccess