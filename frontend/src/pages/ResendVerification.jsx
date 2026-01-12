import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../services/api'
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

function ResendVerification() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  
  const resendMutation = useMutation({
    mutationFn: (email) => authApi.resendVerification(email),
    onSuccess: () => {
      setSubmitted(true)
    },
    onError: (error) => {
      const detail = error.response?.data?.detail || 'Failed to resend verification email'
      setError(detail)
    }
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!email) {
      setError('Email is required')
      return
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    resendMutation.mutate(email)
  }
  
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 p-4">
        <div className="card text-center max-w-md">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-success-600" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Verification Email Sent! 📧
          </h1>
          
          {/* Message */}
          <p className="text-gray-600 mb-6">
            We've sent a new verification link to:
          </p>
          
          {/* Email Display */}
          <div className="p-4 bg-primary-50 rounded-lg mb-6">
            <p className="font-medium text-primary-900">{email}</p>
          </div>
          
          {/* Instructions */}
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-900 mb-2">Next steps:</p>
            <ol className="text-sm text-gray-600 space-y-2">
              <li className="flex gap-2">
                <span className="font-medium">1.</span>
                <span>Check your email inbox (and spam folder)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium">2.</span>
                <span>Click the verification link in the email</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium">3.</span>
                <span>Sign in to your account</span>
              </li>
            </ol>
          </div>
          
          {/* Note */}
          <p className="text-sm text-gray-500 mb-6">
            The verification link will expire in <strong>24 hours</strong>.
          </p>
          
          {/* Actions */}
          <div className="space-y-3">
            <Link to="/login" className="btn btn-primary w-full">
              Back to Sign In
            </Link>
            
            <button
              onClick={() => {
                setSubmitted(false)
                setEmail('')
              }}
              className="btn btn-secondary w-full"
            >
              Send to Different Email
            </button>
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
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Resend Verification
          </h2>
          <p className="text-gray-600">
            Didn't receive the verification email? We'll send you a new one.
          </p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        {/* Main Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="your@email.com"
                  autoFocus
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Enter the email address you used to register
              </p>
            </div>
            
            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Check your spam or junk folder if you don't see the email in your inbox.
              </p>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={resendMutation.isPending}
              className="btn btn-primary w-full"
            >
              {resendMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </button>
          </form>
          
          {/* Back to Sign In */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </Link>
          </div>
        </div>
        
        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already verified?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResendVerification