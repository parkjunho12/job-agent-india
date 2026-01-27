import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { billingApi } from '../services/api'
import { 
  CreditCard, Loader2, CheckCircle, AlertCircle, 
  Calendar, DollarSign, TrendingUp, Zap, ArrowRight,
  Download, ExternalLink
} from 'lucide-react'
import analytics from '../services/analytics'

function Billing() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }
  
  // Queries
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: billingApi.getPlans,
    staleTime: 60_000
  })
  
  const { data: subscriptionData, isLoading: subLoading } = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: billingApi.getSubscription,
    staleTime: 30_000
  })
  
  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: billingApi.getUsage,
    staleTime: 15_000
  })
  
  const { data: transactionsData } = useQuery({
    queryKey: ['billing', 'transactions'],
    queryFn: () => billingApi.getTransactions(10),
    staleTime: 60_000
  })
  
  const plans = plansData?.data?.plans || []
  const subscription = subscriptionData?.data
  const usage = usageData?.data
  const transactions = transactionsData?.data?.transactions || []
  
  const currentPlan = (subscription?.plan || 'free').toLowerCase()
  const credits = subscription?.credits || 0
  const monthlyUsed = usage?.analyses_this_month || 0
  const monthlyLimit = usage?.monthly_limit
  
  // Mutations
  const buyCreditMutation = useMutation({
    mutationFn: (quantity) => billingApi.buyCredit(quantity),
    onSuccess: (data) => {
        analytics.trackCTAClick('Buy Credit')
        window.location.href = data.data.checkout_url
    },
    onError: (error) => {
        console.error(error)
      showMessage('error', error.response?.data?.detail || 'Failed to buy credits')
    }
  })
  
  const subscribeBasicMutation = useMutation({
    mutationFn: () => billingApi.subscribeBasic(),
    onSuccess: (data) => {
        analytics.trackCTAClick('Subscribe to Basic', 'Billing Page')
      window.location.href = data.data.checkout_url
    },
    onError: (error) => {
      showMessage('error', error.response?.data?.detail || 'Failed to subscribe')
    }
  })
  
  const subscribeProMutation = useMutation({
    mutationFn: () => billingApi.subscribePro(),
    onSuccess: (data) => {
        analytics.trackCTAClick('Subscribe to Pro', 'Billing Page')
      window.location.href = data.data.checkout_url
    },
    onError: (error) => {
      showMessage('error', error.response?.data?.detail || 'Failed to subscribe')
    }
  })
  
  const cancelMutation = useMutation({
    mutationFn: () => billingApi.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] })
      analytics.trackCTAClick('Subscribe Cancel')
      showMessage('success', 'Subscription will be canceled at period end')
    },
    onError: (error) => {
      showMessage('error', error.response?.data?.detail || 'Failed to cancel')
    }
  })
  
  const resumeMutation = useMutation({
    mutationFn: () => billingApi.resumeSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] })
      analytics.trackCTAClick('Subscribe Resume')
      showMessage('success', 'Subscription resumed successfully')
    },
    onError: (error) => {
      showMessage('error', error.response?.data?.detail || 'Failed to resume')
    }
  })
  
  const portalMutation = useMutation({
    mutationFn: () => billingApi.getPortal(),
    onSuccess: (data) => {
      window.location.href = data.data.portal_url
    },
    onError: (error) => {
      showMessage('error', error.response?.data?.detail || 'Failed to open portal')
    }
  })
  
  const handleUpgrade = (planId) => {
    if (planId === 'basic') {
      subscribeBasicMutation.mutate()
    } else if (planId === 'pro') {
      subscribeProMutation.mutate()
    }
  }
  
  const isLoading = plansLoading || subLoading || usageLoading
  const anyMutationPending = 
    buyCreditMutation.isPending || 
    subscribeBasicMutation.isPending || 
    subscribeProMutation.isPending
  
  const usagePct = monthlyLimit && monthlyLimit > 0
    ? Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100))
    : null
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and view payment history</p>
      </div>
      
      {/* Message */}
      {message.text && (
        <div className={`mb-6 rounded-lg p-4 flex items-start gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          ) : (
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          )}
          <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </p>
        </div>
      )}
      
      {isLoading && (
        <div className="flex items-center gap-2 text-gray-600 mb-6">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading billing data...
        </div>
      )}
      
      {/* Current Subscription Card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Current Subscription</h2>
            <p className="text-gray-600">Your active plan and usage</p>
          </div>
          
          {(currentPlan === 'basic' || currentPlan === 'pro') && (
            <button
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              className="btn btn-secondary flex items-center gap-2"
            >
              {portalMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Manage
                </>
              )}
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              <p className="text-sm text-gray-700 font-medium">Plan</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 capitalize">
              {currentPlan === 'pay_per_job' ? 'Pay Per Job' : currentPlan}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-success-600" />
              <p className="text-sm text-gray-700 font-medium">Credits</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{credits}</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-gray-700 font-medium">This Month</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {monthlyUsed}{monthlyLimit ? ` / ${monthlyLimit}` : ''}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <p className="text-sm text-gray-700 font-medium">Status</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {subscription?.status || 'Active'}
            </p>
          </div>
        </div>
        
        {usagePct !== null && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Monthly usage</span>
              <span>{usagePct}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all ${
                  usagePct > 90 ? 'bg-red-500' : usagePct > 75 ? 'bg-orange-500' : 'bg-primary-600'
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3">
          {/* {(currentPlan === 'free' || currentPlan === 'pay_per_job') && (
            <button
              onClick={() => buyCreditMutation.mutate(1)}
              disabled={buyCreditMutation.isPending}
              className="btn btn-secondary flex items-center gap-2"
            >
              {buyCreditMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Buy Credit ($2.99)
                </>
              )}
            </button>
          )} */}
          
          {currentPlan === 'free' && (
            <button
              onClick={() => handleUpgrade('basic')}
              disabled={anyMutationPending}
              className="btn btn-secondary"
            >
              Upgrade to Basic
            </button>
          )}
          
          {currentPlan !== 'pro' && (
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={anyMutationPending}
              className="btn btn-primary"
            >
              Upgrade to Pro
            </button>
          )}
          
          {subscription?.cancel_at_period_end ? (
            <button
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              className="btn btn-secondary text-green-600"
            >
              Resume Subscription
            </button>
          ) : (
            (currentPlan === 'basic' || currentPlan === 'pro') && (
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="btn btn-secondary text-red-600"
              >
                Cancel Subscription
              </button>
            )
          )}
        </div>
        
        {subscription?.cancel_at_period_end && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
            Your subscription will be canceled on{' '}
            {new Date(subscription.current_period_end).toLocaleDateString()}
          </div>
        )}
      </div>
      
      {/* Available Plans */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const planId = (plan.id || '').toLowerCase()
            const isCurrent = planId === currentPlan
            
            return (
              <div
                key={plan.id}
                className={`border rounded-lg p-6 ${
                  isCurrent
                    ? 'border-primary-500 bg-primary-50'
                    : plan.highlighted
                    ? 'border-primary-300 bg-gradient-to-br from-primary-50 to-success-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h3>
                  {isCurrent && (
                    <span className="badge badge-primary text-xs">Current</span>
                  )}
                  {plan.badge && !isCurrent && (
                    <span className="badge bg-gradient-to-r from-primary-500 to-success-500 text-white text-xs">
                      {plan.badge}
                    </span>
                  )}
                </div>
                
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  ${plan.price}
                </p>
                <p className="text-sm text-gray-600 mb-4">{plan.period || '/month'}</p>
                
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                
                <ul className="space-y-2 mb-6">
                  {(plan.features || []).slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {!isCurrent && planId !== 'free' && planId !== 'pay_per_job' && (
                  <button
                    onClick={() => handleUpgrade(planId)}
                    disabled={anyMutationPending}
                    className="btn btn-primary w-full text-sm"
                  >
                    {plan.cta || 'Upgrade'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Payment History */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Payment History</h2>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No payment history yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Credits</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {tx.description || 'Payment'}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge text-xs ${
                        tx.status === 'succeeded' 
                          ? 'badge-success' 
                          : 'badge-secondary'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-700">
                      {tx.credits_added > 0 ? `+${tx.credits_added}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Billing