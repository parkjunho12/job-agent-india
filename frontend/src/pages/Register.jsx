import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../services/api'
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import Logo from '../components/Logo'
import analytics from '../services/analytics'

function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  
  const [errors, setErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] })
  
  const registerMutation = useMutation({
    mutationFn: (data) => authApi.register(data.email, data.password, data.fullName),
    onSuccess: (res) => {
      const user = res.data
      analytics.trackSignup(user.id)
      analytics.trackEvent('register', 'signup', 'account_created', {
        data: { user_id: user.id }
      })
      navigate('/register-success')
    },
    onError: (error) => {
      const detail = error.response?.data?.detail
      
      if (typeof detail === 'string') {
        if (detail.includes('already registered')) {
          setErrors({ email: 'This email is already registered' })
        } else {
          setErrors({ general: detail })
        }
      } else if (Array.isArray(detail)) {
        const newErrors = {}
        detail.forEach(err => {
          const field = err.loc[err.loc.length - 1]
          newErrors[field] = err.msg
        })
        setErrors(newErrors)
      } else {
        setErrors({ general: 'Registration failed. Please try again.' })
      }
    }
  })
  
  const handleGoogleSignup = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      alert('Google OAuth not configured')
      return
    }
    
    const redirectUri = `${window.location.origin}/auth/google/callback`
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=openid%20email%20profile&` +
      `access_type=offline&` +
      `prompt=consent`
    
    window.location.href = authUrl
  }
  
  const handleGitHubSignup = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    if (!clientId) {
      alert('GitHub OAuth not configured')
      return
    }
    
    const redirectUri = `${window.location.origin}/auth/github/callback`
    const authUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=user:email`
    
    window.location.href = authUrl
  }
  
  const checkPasswordStrength = (password) => {
    const feedback = []
    let score = 0
    
    if (password.length >= 8) {
      score++
      feedback.push('✓ At least 8 characters')
    } else {
      feedback.push('✗ At least 8 characters')
    }
    
    if (/[A-Z]/.test(password)) {
      score++
      feedback.push('✓ Contains uppercase letter')
    } else {
      feedback.push('✗ Contains uppercase letter')
    }
    
    if (/[a-z]/.test(password)) {
      score++
      feedback.push('✓ Contains lowercase letter')
    } else {
      feedback.push('✗ Contains lowercase letter')
    }
    
    if (/\d/.test(password)) {
      score++
      feedback.push('✓ Contains number')
    } else {
      feedback.push('✗ Contains number')
    }
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score++
      feedback.push('✓ Contains special character')
    }
    
    setPasswordStrength({ score, feedback })
  }
  
  const handlePasswordChange = (e) => {
    const password = e.target.value
    setFormData({ ...formData, password })
    checkPasswordStrength(password)
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain an uppercase letter'
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain a lowercase letter'
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain a number'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    registerMutation.mutate(formData)
  }
  
  const getStrengthColor = () => {
    if (passwordStrength.score <= 1) return 'bg-red-500'
    if (passwordStrength.score <= 2) return 'bg-orange-500'
    if (passwordStrength.score <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  
  const getStrengthText = () => {
    if (passwordStrength.score <= 1) return 'Weak'
    if (passwordStrength.score <= 2) return 'Fair'
    if (passwordStrength.score <= 3) return 'Good'
    return 'Strong'
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
        <Logo variant="full" size="4xl" className="mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-gray-600">Start your AI-powered job application journey</p>
        </div>
        
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{errors.general}</p>
          </div>
        )}
        
        <div className="card">
          <div className="space-y-3 mb-6">
            <button onClick={handleGoogleSignup} className="btn btn-secondary w-full flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
            
            <button onClick={handleGitHubSignup} className="btn btn-secondary w-full flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
              </svg>
              Sign up with GitHub
            </button>
          </div>
          
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or sign up with email</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`input pl-10 ${errors.fullName ? 'border-red-300' : ''}`}
                  placeholder="John Doe"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`input pl-10 ${errors.email ? 'border-red-300' : ''}`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handlePasswordChange}
                  className={`input pl-10 pr-10 ${errors.password ? 'border-red-300' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{getStrengthText()}</span>
                  </div>
                  <ul className="text-xs space-y-1">
                    {passwordStrength.feedback.map((item, idx) => (
                      <li key={idx} className={item.startsWith('✓') ? 'text-green-600' : 'text-gray-500'}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`input pl-10 pr-10 ${errors.confirmPassword ? 'border-red-300' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Passwords match
                </p>
              )}
            </div>
            
            <button type="submit" disabled={registerMutation.isPending} className="btn btn-primary w-full mt-6">
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating account...
                </>
              ) : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-gray-500">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="underline hover:text-gray-700">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}

export default Register