import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../services/api'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  
  const [errors, setErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] })
  
  const resetPasswordMutation = useMutation({
    mutationFn: (data) => authApi.resetPassword(data.token, data.newPassword),
    onSuccess: () => {
      // Redirect to login with success message
      setTimeout(() => {
        navigate('/login?message=password_reset')
      }, 2000)
    },
    onError: (error) => {
      const detail = error.response?.data?.detail || 'Password reset failed'
      setErrors({ general: detail })
    }
  })
  
  // Password strength checker
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
    setFormData({ ...formData, newPassword: password })
    checkPasswordStrength(password)
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    
    // Validation
    const newErrors = {}
    
    if (!token) {
      newErrors.general = 'Reset token is missing or invalid'
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain an uppercase letter'
    } else if (!/[a-z]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain a lowercase letter'
    } else if (!/\d/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain a number'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    resetPasswordMutation.mutate({
      token,
      newPassword: formData.newPassword
    })
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
  
  // Success state
  if (resetPasswordMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 p-4">
        <div className="card text-center max-w-md">
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-success-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Password Reset Successful! 🎉
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          
          <div className="p-4 bg-success-50 border border-success-200 rounded-lg mb-6">
            <p className="text-success-800 font-medium">
              ✓ Password updated successfully
            </p>
            <p className="text-success-700 text-sm mt-1">
              Redirecting to sign in...
            </p>
          </div>
          
          <Link to="/login?message=password_reset" className="btn btn-primary w-full">
            Continue to Sign In
          </Link>
        </div>
      </div>
    )
  }
  
  // No token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 p-4">
        <div className="card text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Invalid Reset Link
          </h1>
          
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired.
          </p>
          
          <div className="space-y-3">
            <Link to="/forgot-password" className="btn btn-primary w-full">
              Request New Reset Link
            </Link>
            
            <Link to="/login" className="btn btn-secondary w-full">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-success-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600">
            Enter your new password below
          </p>
        </div>
        
        {/* General Error */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{errors.general}</p>
          </div>
        )}
        
        {/* Main Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handlePasswordChange}
                  className={`input pl-10 pr-10 ${errors.newPassword ? 'border-red-300' : ''}`}
                  placeholder="••••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
              
              {/* Password Strength */}
              {formData.newPassword && (
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
            
            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
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
              {!errors.confirmPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Passwords match
                </p>
              )}
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="btn btn-primary w-full mt-6"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Resetting password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
          
          {/* Back to Sign In */}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword