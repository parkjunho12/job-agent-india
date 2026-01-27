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
import Billing from './pages/Billing'
import BillingSuccess from './pages/BillingSuccess'
import JobAnalysis from './pages/JobAnalysis'
import Stats from './pages/Stats'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import Landing2 from './pages/Landing2'
import AnalysisHistory from './pages/Analysishistory'
import AnalysisDetail from './pages/AnalysisDetail'
import NewAnalysis from './pages/NewAnalysis'


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
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing2 />} />
          <Route path="/landing" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
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

          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/billing/success" element={<BillingSuccess />} />
            <Route path="/jobs/:jobId/analysis" element={<JobAnalysis />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/analysis-history" element={<AnalysisHistory />} />
            <Route path="/analysis-history/:analysisId" element={<AnalysisDetail />} />
            <Route path="/new-analysis" element={<NewAnalysis />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App