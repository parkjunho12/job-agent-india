import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { Loader2, CheckCircle, AlertCircle, Mail } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')  // verifying, success, error
  const [errorMessage, setErrorMessage] = useState('')
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    const token = searchParams.get('token')
    
    if (token) {
      verifyEmail(token)
    } else {
      setStatus('error')
      setErrorMessage('Verification token is missing')
    }
  }, [])
  
  const verifyEmail = async (token) => {
    try {
      await authApi.verifyEmail(token)
      setStatus('success')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login?message=verified')
      }, 3000)
    } catch (error) {
      setStatus('error')
      const detail = error.response?.data?.detail || 'Verification failed'
      setErrorMessage(detail)
    }
  }
  
  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 p-4">
        <div className="card text-center max-w-md">
          <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verifying Your Email
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your email address...
          </p>
        </div>
      </div>
    )
  }
  
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 p-4">
        <div className="card text-center max-w-md">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-success-600" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Email Verified! 🎉
          </h1>
          
          {/* Message */}
          <p className="text-gray-600 mb-6">
            Your email has been successfully verified. You can now sign in to your account.
          </p>
          
          {/* Success Box */}
          <div className="p-4 bg-success-50 border border-success-200 rounded-lg mb-6">
            <p className="text-success-800 font-medium">
              ✓ Email verification complete
            </p>
            <p className="text-success-700 text-sm mt-1">
              Redirecting to sign in...
            </p>
          </div>
          
          {/* Action */}
          <Link to="/login?message=verified" className="btn btn-primary w-full">
            Continue to Sign In
          </Link>
          
          {/* Footer */}
          <p className="mt-6 text-sm text-gray-500">
            You will be automatically redirected in a few seconds
          </p>
        </div>
      </div>
    )
  }
  
  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 p-4">
      <div className="card text-center max-w-md">
        {/* Error Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Verification Failed
        </h1>
        
        {/* Message */}
        <p className="text-gray-600 mb-2">
          {errorMessage}
        </p>
        <p className="text-gray-500 text-sm mb-6">
          The verification link may have expired or is invalid.
        </p>
        
        {/* Error Box */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-800 font-medium mb-2">
            What can you do?
          </p>
          <ul className="text-left text-red-700 text-sm space-y-1">
            <li>• Request a new verification email</li>
            <li>• Check if you already verified your email</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>
        
        {/* Actions */}
        <div className="space-y-3">
          <Link to="/resend-verification" className="btn btn-primary w-full">
            <Mail className="w-5 h-5 mr-2" />
            Resend Verification Email
          </Link>
          
          <Link to="/login" className="btn btn-secondary w-full">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail