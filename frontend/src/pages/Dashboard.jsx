import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { jobsApi, applicationsApi } from '../services/api'
import {experiencesApi, analysisApi} from '../services/api'
import { 
  TrendingUp, Briefcase, FileText, CheckCircle, Clock, 
  Zap, ArrowRight, Target, User, AlertCircle 
} from 'lucide-react'
import WelcomeModal from '../components/WelcomeModal'
import CVSetupWizard from '../components/CVSetupWizard'
import OnboardingChecklist from '../components/OnboardingChecklist'

function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  // Onboarding state
  const [showWelcome, setShowWelcome] = useState(false)
  const [showCVSetup, setShowCVSetup] = useState(false)
  
  // Fetch data
  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list({ limit: 100 })
  })
  
  const { data: applications } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list({ limit: 100 })
  })

  const { data: experiencesData } = useQuery({
    queryKey: ['experiences'],
    queryFn: () => experiencesApi.getAll()
  })

  const { data: statsData } = useQuery({
    queryKey: ['stats', 'decisions'],
    queryFn: () => analysisApi.getDecisionStats()
  })
  
  const experiences = experiencesData?.data || []
  const hasExperience = experiences.length > 0
  
  const stats = {
    totalJobs: jobs?.data?.length || 0,
    totalApplications: applications?.data?.length || 0,
    submitted: applications?.data?.filter(a => a.status === 'submitted').length || 0,
    drafts: applications?.data?.filter(a => a.status === 'draft').length || 0,
    analyzed: statsData?.total_analyzed || 0,
    timeSaved: Math.round((statsData?.high_risk_avoided || 0) * 2) // 2 hours per bad job
  }
  
  const recentApplications = applications?.data?.slice(0, 5) || []
  const recentJobs = jobs?.data?.slice(0, 5) || []

  // Onboarding flow
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('welcome_completed')
    const hasSetupCV = localStorage.getItem('cv_setup_completed')
    
    console.log('Onboarding Check:', { hasSeenWelcome, hasSetupCV, hasExperience })
    // Show welcome modal on first visit
    if (!hasSeenWelcome) {
      setShowWelcome(true)
    } 
    // Then show CV setup if not completed
    else if (!hasSetupCV && !hasExperience) {
      setShowCVSetup(true)
    }
  }, [hasExperience])

  const handleWelcomeComplete = () => {
    setShowWelcome(false)
    localStorage.setItem('welcome_completed', 'true')
    
    // Check if CV setup needed
    const hasSetupCV = localStorage.getItem('cv_setup_completed')
    if (!hasSetupCV && !hasExperience) {
      setShowCVSetup(true)
    }
  }

  const handleWelcomeSkip = () => {
    setShowWelcome(false)
    localStorage.setItem('welcome_completed', 'true')
  }

  const handleCVSetupComplete = () => {
    setShowCVSetup(false)
    localStorage.setItem('cv_setup_completed', 'true')
    navigate('/jobs')
  }

  const handleCVSetupSkip = () => {
    setShowCVSetup(false)
    localStorage.setItem('cv_setup_completed', 'true')
  }
  
  return (
    <>
      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal 
          onComplete={handleWelcomeComplete}
          onSkip={handleWelcomeSkip}
        />
      )}

      {/* CV Setup Wizard */}
      {showCVSetup && (
        <CVSetupWizard 
          onComplete={handleCVSetupComplete}
          onSkip={handleCVSetupSkip}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name || 'User'}! 👋
          </h1>
          <p className="text-gray-600">Here's your job application overview</p>
        </div>

        {/* Onboarding Checklist */}
        <OnboardingChecklist />

        {/* Profile Setup Alert (if no experience) */}
        {!hasExperience && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  ⚠️ Setup Your Profile First
                </h3>
                <p className="text-gray-700 mb-4">
                  To get accurate job verdicts, we need your CV or experience. 
                  Without it, we can only give generic advice.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowCVSetup(true)}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Setup Profile Now (2 min)
                  </button>
                  <button 
                    onClick={() => navigate('/experiences')}
                    className="btn btn-secondary"
                  >
                    Add Experience Manually
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/jobs">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs text-gray-500 font-medium">SAVED</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalJobs}</h3>
              <p className="text-sm text-gray-600">Jobs</p>
            </div>
          </Link>

          <Link to="/stats">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-primary-50 to-success-50 border-primary-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-600" />
                </div>
                <span className="text-xs text-primary-600 font-medium">ANALYZED</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.analyzed}</h3>
              <p className="text-sm text-gray-700">Verdicts</p>
            </div>
          </Link>

          <Link to="/stats">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-success-50 to-green-50 border-success-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-success-600" />
                </div>
                <span className="text-xs text-success-600 font-medium">SAVED</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.timeSaved}h</h3>
              <p className="text-sm text-gray-700">Time Saved</p>
            </div>
          </Link>

          <Link to="/applications">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
                <span className="text-xs text-gray-500 font-medium">TOTAL</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalApplications}</h3>
              <p className="text-sm text-gray-600">Applications</p>
            </div>
          </Link>
        </div>
        
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!hasExperience ? (
              <button
                onClick={() => setShowCVSetup(true)}
                className="card hover:shadow-lg transition-all hover:scale-105 border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-success-50 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Setup Profile ⭐</h3>
                    <p className="text-sm text-gray-600">Add CV or experience first</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary-600" />
                </div>
              </button>
            ) : (
              <Link to="/jobs" className="card hover:shadow-lg transition-all hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Browse Jobs</h3>
                    <p className="text-sm text-gray-600">Add & analyze jobs</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            )}
            
            <Link to="/stats" className="card hover:shadow-lg transition-all hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">View Stats</h3>
                  <p className="text-sm text-gray-600">Time saved & decisions</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
            </Link>
            
            <Link to="/experiences" className="card hover:shadow-lg transition-all hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Manage Profile</h3>
                  <p className="text-sm text-gray-600">Update experiences</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Saved Jobs</h2>
              <Link to="/jobs" className="text-sm text-primary-600 hover:underline">
                View all →
              </Link>
            </div>
            {recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.map(job => (
                  <Link 
                    key={job.id} 
                    to={`/jobs/${job.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.company}</p>
                      </div>
                      {job.verdict_type && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          job.verdict_type === 'strong_match' ? 'bg-success-100 text-success-700' :
                          job.verdict_type === 'borderline' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {job.verdict_type === 'strong_match' ? '✅' :
                           job.verdict_type === 'borderline' ? '⚠️' : '❌'}
                          {Math.round(job.match_score || 0)}%
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No saved jobs yet</p>
                <Link to="/jobs" className="btn btn-primary btn-sm">
                  Add Your First Job
                </Link>
              </div>
            )}
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Applications</h2>
              <Link to="/applications" className="text-sm text-primary-600 hover:underline">
                View all →
              </Link>
            </div>
            {recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications.map(app => (
                  <Link
                    key={app.id}
                    to={`/applications/${app.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{app.job_title}</h3>
                        <p className="text-sm text-gray-600">{app.company}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        app.status === 'submitted' ? 'bg-success-100 text-success-700' :
                        app.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No applications yet</p>
                <Link to="/applications" className="btn btn-secondary btn-sm">
                  Start Applying
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard