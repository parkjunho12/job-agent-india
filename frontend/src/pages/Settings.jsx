import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authApi, billingApi } from '../services/api'
import {
  User, Mail, CreditCard, Bell, Shield, LogOut,
  Loader2, CheckCircle, AlertCircle, Save, Zap
} from 'lucide-react'

function Settings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, logout, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')

  // Profile state
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    location: user?.location || ''
  })

  useEffect(() => {
    setProfileData({
      full_name: user?.full_name || '',
      location: user?.location || ''
    })
  }, [user?.full_name, user?.location])

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Notification state
  const [notifications, setNotifications] = useState({
    email: true,
    browser: false
  })

  // Messages
  const [message, setMessage] = useState({ type: '', text: '' })
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // Billing queries
  const plansQuery = useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: billingApi.getPlans,
    enabled: activeTab === 'billing',
    staleTime: 60_000
  })

  const subscriptionQuery = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: billingApi.getSubscription,
    enabled: activeTab === 'billing',
    staleTime: 30_000
  })

  const usageQuery = useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: billingApi.getUsage,
    enabled: activeTab === 'billing',
    staleTime: 15_000
  })

  const plans = useMemo(() => {
    const raw = plansQuery.data
    if (!raw || !raw.data) return []
    return raw.data.plans || []
  }, [plansQuery.data])

  const subscription = subscriptionQuery.data?.data || null
  const usage = usageQuery.data?.data || null

  const currentPlan = (subscription?.plan || user?.plan || 'free').toLowerCase()

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data) => authApi.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      showMessage('success', 'Profile updated successfully!')
    },
    onError: (error) => {
      console.error(error)
      showMessage('error', error.response?.data?.detail || 'Failed to update profile')
    }
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showMessage('success', 'Password changed successfully!')
    },
    onError: (error) => {
      showMessage('error', error.response?.data?.detail || 'Failed to change password')
    }
  })

  const buyCreditMutation = useMutation({
    mutationFn: (quantity) => billingApi.buyCredit(quantity),
    onSuccess: (data) => {
      window.location.href = data.data.checkout_url
    },
    onError: (error) => {
      showMessage('error', error.response?.data?.detail || 'Failed to buy credits')
    }
  })

  const subscribeBasicMutation = useMutation({
    mutationFn: () => billingApi.subscribeBasic(),
    onSuccess: (data) => {
      window.location.href = data.data.checkout_url
    },
    onError: (error) => {
      showMessage('error', error.response?.data?.detail || 'Failed to subscribe to Basic')
    }
  })

  const subscribeProMutation = useMutation({
    mutationFn: () => billingApi.subscribePro(),
    onSuccess: (data) => {
      window.location.href = data.data.checkout_url
    },
    onError: (error) => {
      showMessage('error', error.response?.data?.detail || 'Failed to subscribe to Pro')
    }
  })

  const anyBillingPending =
    buyCreditMutation.isPending ||
    subscribeBasicMutation.isPending ||
    subscribeProMutation.isPending

  const handleUpgrade = async (plan) => {
    const planId = (typeof plan === 'string' ? plan : (plan?.id || '')).toLowerCase()

    if (planId === 'basic') {
      subscribeBasicMutation.mutate()
    } else if (planId === 'pro') {
      subscribeProMutation.mutate()
    } else {
      showMessage('error', 'Unknown plan selected')
    }
  }

  const handleProfileUpdate = (e) => {
    e.preventDefault()
    updateProfileMutation.mutate(profileData)
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters')
      return
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  const credits = subscription?.credits || 0
  const monthlyUsed = usage?.analyses_this_month || 0
  const monthlyLimit = usage?.monthly_limit || null

  const usagePct = (() => {
    if (!monthlyLimit || monthlyLimit <= 0) return null
    return Math.min(100, Math.max(0, Math.round((monthlyUsed / monthlyLimit) * 100)))
  })()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="input w-full"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="input w-full bg-gray-50"
                      disabled
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., London, UK"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Billing & Subscription</h2>

              {(plansQuery.isLoading || subscriptionQuery.isLoading) && (
                <div className="flex items-center gap-2 text-gray-600 mb-6">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading billing data...
                </div>
              )}

              <div className="bg-gradient-to-r from-primary-50 to-success-50 rounded-lg p-6 mb-6 border border-primary-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Plan</p>
                    <p className="text-2xl font-bold text-gray-900 capitalize">
                      {currentPlan === 'pay_per_job' ? 'Pay Per Job' : currentPlan}
                    </p>
                  </div>
                  <span className="badge badge-success">Active</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Credits</p>
                    <p className="text-lg font-bold text-gray-900">{credits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-lg font-bold text-gray-900">
                      {monthlyUsed}{monthlyLimit ? ` / ${monthlyLimit}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className="text-lg font-bold text-gray-900">
                      {monthlyLimit ? monthlyLimit - monthlyUsed : credits}
                    </p>
                  </div>
                </div>

                {usagePct !== null && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>Monthly quota</span>
                      <span>{usagePct}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/70 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-primary-600 rounded-full transition-all"
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* {(currentPlan === 'free' || currentPlan === 'pay_per_job') && (
                    <button
                      className="btn btn-secondary flex items-center justify-center gap-2"
                      disabled={buyCreditMutation.isPending}
                      onClick={() => buyCreditMutation.mutate(1)}
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

                  {currentPlan !== 'pro' && (
                    <button
                      className="btn btn-primary"
                      disabled={anyBillingPending}
                      onClick={() => handleUpgrade('pro')}
                    >
                      {anyBillingPending ? 'Processing...' : 'Upgrade to Pro'}
                    </button>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-4">Available Plans</h3>

              <div className="space-y-4">
                {plans.map((p) => {
                  const planId = (p.id || '').toLowerCase()
                  const isCurrent = planId === currentPlan

                  return (
                    <div
                      key={p.id}
                      className={`border rounded-lg p-6 transition-all ${
                        isCurrent
                          ? 'border-primary-500 bg-primary-50'
                          : p.highlighted
                          ? 'border-primary-300 bg-gradient-to-br from-primary-50 to-success-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-bold text-gray-900">{p.name}</h4>
                            {p.badge && (
                              <span className="badge bg-gradient-to-r from-primary-500 to-success-500 text-white text-xs">
                                {p.badge}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="badge badge-primary text-xs">Current</span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-4">{p.description}</p>

                          <ul className="space-y-2">
                            {(p.features || []).map((f, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="text-right ml-6">
                          <p className="text-3xl font-bold text-gray-900">
                            ${p.price}
                          </p>
                          <p className="text-sm text-gray-600">{p.period || '/month'}</p>
                        </div>
                      </div>

                      {!isCurrent && planId !== 'free' && planId !== 'pay_per_job' && (
                        <button
                          className="btn btn-primary w-full mt-4"
                          disabled={anyBillingPending}
                          onClick={() => handleUpgrade(p)}
                        >
                          {p.cta || `Upgrade to ${p.name}`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-5 h-5 text-primary-600" />
                      <p className="font-medium text-gray-900">Email Notifications</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      Receive updates about applications and matches
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.email}
                      onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="w-5 h-5 text-success-600" />
                      <p className="font-medium text-gray-900">Browser Notifications</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      Get instant alerts for application updates
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.browser}
                      onChange={(e) => setNotifications({ ...notifications, browser: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      {changePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Update Password
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Danger Zone
                  </h3>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings