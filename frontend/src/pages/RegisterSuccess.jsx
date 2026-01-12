import { Link } from 'react-router-dom'
import { Mail, CheckCircle } from 'lucide-react'

function RegisterSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="card text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-success-600" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Check Your Email!
          </h1>
          
          {/* Message */}
          <p className="text-gray-600 mb-6">
            We've sent a verification link to your email address.
            Please click the link to verify your account and complete your registration.
          </p>
          
          {/* Email Icon */}
          <div className="p-6 bg-primary-50 rounded-lg mb-6">
            <Mail className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <p className="text-sm text-gray-700 font-medium">
              Verification email sent
            </p>
          </div>
          
          {/* Instructions */}
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-900 mb-2">Next steps:</p>
            <ol className="text-sm text-gray-600 space-y-2">
              <li className="flex gap-2">
                <span className="font-medium">1.</span>
                <span>Check your inbox (and spam folder)</span>
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
          
          {/* Actions */}
          <div className="space-y-3">
            <Link to="/login" className="btn btn-primary w-full">
              Go to Sign In
            </Link>
            
            <Link to="/resend-verification" className="btn btn-secondary w-full">
              Resend Verification Email
            </Link>
          </div>
          
          {/* Footer Note */}
          <p className="mt-6 text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or{' '}
            <Link to="/resend-verification" className="text-primary-600 hover:text-primary-700 underline">
              request a new one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterSuccess