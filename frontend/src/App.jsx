import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './stores/authStore'
import { useEffect } from 'react'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import RegisterSuccess from './pages/RegisterSuccess'
import GitHubCallback from './pages/GitHubCallback'
import GoogleCallback from './pages/GoogleCallback'
import VerifyEmail from './pages/VerifyEmail'
import ResendVerification from './pages/ResendVerification'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Applications from './pages/Applications'
import ApplicationDetail from './pages/Applicationdetail'
import Experiences from './pages/Experiences'
import Settings from './pages/Settings'


// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Styles
import './index.css'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  const { isAuthenticated, syncFromExtension } = useAuthStore()


  useEffect(() => {
    console.log('🚀 App mounted, checking extension auth...')
    syncFromExtension().then((synced) => {
      if (synced) {
        console.log('✅ Auth synced from extension')
      } else {
        console.log('ℹ️ No auth in extension')
      }
    })
  }, [syncFromExtension])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/register-success" element={<RegisterSuccess />} />

          {/* Email Verification */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/resend-verification" element={<ResendVerification />} />
          
          {/* Password Reset */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* OAuth Callbacks */}
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
          
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App