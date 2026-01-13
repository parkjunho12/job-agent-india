import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../services/api'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export function GitHubCallback() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [error, setError] = useState(null)
    const calledRef = useRef(false)
    
    useEffect(() => {
        if (calledRef.current) return
        calledRef.current = true


      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')
      
      if (errorParam) {
        navigate('/login?error=oauth_cancelled')
        return
      }
      
      if (code) {
        handleOAuthCallback(code)
      } else {
        navigate('/login?error=oauth_failed')
      }
    }, [])
    
    const handleOAuthCallback = async (code) => {
      try {
        const redirectUri = `${window.location.origin}/auth/github/callback`
        
        const response = await authApi.oauthGitHubLogin(code, redirectUri)
        
        // Store token
        localStorage.setItem('authToken', response.data.access_token)
        useAuthStore.getState().login(response.data.user, response.data.access_token)
        
        // Redirect to dashboard
        navigate('/dashboard')
      } catch (error) {
        console.error('GitHub OAuth error:', error)
        setError(error.response?.data?.detail || 'OAuth login failed')
        
        // Redirect to login with error after 2 seconds
        setTimeout(() => {
          navigate('/login?error=oauth_failed')
        }, 2000)
      }
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50">
        <div className="card text-center max-w-md">
          {error ? (
            <>
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">OAuth Failed</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500">Redirecting to login...</p>
            </>
          ) : (
            <>
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Completing GitHub Sign In</h2>
              <p className="text-gray-600">Please wait while we complete your sign in...</p>
            </>
          )}
        </div>
      </div>
    )
  }

  export default GitHubCallback