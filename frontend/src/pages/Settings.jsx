import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../services/api'
import { 
  User, Mail, CreditCard, Bell, Shield, LogOut, 
  Loader2, CheckCircle, AlertCircle, Save
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
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => authApi.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data)
      queryClient.invalidateQueries(['user'])
      showMessage('success', 'Profile updated successfully!')
    },
    onError: (error) => {
      console.error(error)
      showMessage('error', error.response?.data?.detail || 'Failed to update profile')
    }
  })
  
  // Change password mutation
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
    
    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters')
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
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences</p>
      </div>
      
      {/* Global Message */}
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
        {/* Sidebar */}
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
        
        {/* Content */}
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
                      value={user?.email}
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
                  <p className="text-xs text-gray-500 mt-1">
                    Used for job matching and cover letter generation
                  </p>
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
              
              <div className="bg-gradient-to-r from-primary-50 to-success-50 rounded-lg p-6 mb-6 border border-primary-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Plan</p>
                    <p className="text-2xl font-bold text-gray-900 capitalize">
                      {user?.tier || 'Free'}
                    </p>
                  </div>
                  <span className="badge badge-success">Active</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Applications</p>
                    <p className="text-lg font-bold text-gray-900">Unlimited</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">AI Generations</p>
                    <p className="text-lg font-bold text-gray-900">Unlimited</p>
                  </div>
                </div>
                
                {user?.tier === 'free' && (
                  <button className="btn btn-primary w-full">
                    Upgrade to Pro
                  </button>
                )}
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-4">Available Plans</h3>
              
              <div className="space-y-4">
                <div className={`border rounded-lg p-6 transition-all ${
                  user?.tier === 'free' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">Free</h4>
                        {user?.tier === 'free' && (
                          <span className="badge badge-primary text-xs">Current</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Perfect for getting started</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          Unlimited job saves
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          Unlimited experiences
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          AI-powered applications
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          Chrome extension
                        </li>
                      </ul>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">£0</p>
                      <p className="text-sm text-gray-600">/month</p>
                    </div>
                  </div>
                </div>
                
                <div className={`border rounded-lg p-6 transition-all ${
                  user?.tier === 'starter' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">Starter</h4>
                        {user?.tier === 'starter' && (
                          <span className="badge badge-primary text-xs">Current</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">For active job seekers</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          Everything in Free
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          Priority AI generation
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          Advanced analytics
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          Email support
                        </li>
                      </ul>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">£9</p>
                      <p className="text-sm text-gray-600">/month</p>
                    </div>
                  </div>
                  {user?.tier !== 'starter' && user?.tier !== 'pro' && (
                    <button className="btn btn-primary w-full">
                      Upgrade to Starter
                    </button>
                  )}
                </div>
                
                <div className={`border rounded-lg p-6 transition-all ${
                  user?.tier === 'pro' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-primary-300 hover:border-primary-400 bg-gradient-to-br from-primary-50 to-success-50'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">Pro</h4>
                        <span className="badge bg-gradient-to-r from-primary-500 to-success-500 text-white text-xs">
                          Most Popular
                        </span>
                        {user?.tier === 'pro' && (
                          <span className="badge badge-primary text-xs ml-2">Current</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">For serious professionals</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          Everything in Starter
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          Unlimited AI generations
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          Auto-fill automation
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          Priority support
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-success-600" />
                          Advanced insights
                        </li>
                      </ul>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">£19</p>
                      <p className="text-sm text-gray-600">/month</p>
                    </div>
                  </div>
                  {user?.tier !== 'pro' && (
                    <button className="btn btn-primary w-full">
                      Upgrade to Pro
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
              
              <p className="text-gray-600 mb-6">
                Choose how you want to receive updates about your applications and job matches.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-5 h-5 text-primary-600" />
                      <p className="font-medium text-gray-900">Email Notifications</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      Receive updates about applications, matches, and important account changes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.email}
                      onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="w-5 h-5 text-success-600" />
                      <p className="font-medium text-gray-900">Browser Notifications</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      Get instant alerts when you receive application updates
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.browser}
                      onChange={(e) => setNotifications({ ...notifications, browser: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                
                <div className="mt-6">
                  <button className="btn btn-primary">
                    Save Preferences
                  </button>
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
                        placeholder="Enter current password"
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
                        placeholder="Enter new password"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must be at least 6 characters
                      </p>
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
                        placeholder="Confirm new password"
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-800 mb-2">
                      <strong>Logout:</strong> You will need to sign in again to access your account.
                    </p>
                  </div>
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