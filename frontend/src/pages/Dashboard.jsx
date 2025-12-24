import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { jobsApi, applicationsApi } from '../services/api'
import { TrendingUp, Briefcase, FileText, CheckCircle, Clock, Zap, ArrowRight } from 'lucide-react'

function Dashboard() {
  const { user } = useAuthStore()
  
  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list({ limit: 100 })
  })
  
  const { data: applications } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list({ limit: 100 })
  })
  
  const stats = {
    totalJobs: jobs?.data?.length || 0,
    totalApplications: applications?.data?.length || 0,
    submitted: applications?.data?.filter(a => a.status === 'submitted').length || 0,
    drafts: applications?.data?.filter(a => a.status === 'draft').length || 0
  }
  
  const recentApplications = applications?.data?.slice(0, 5) || []
  const recentJobs = jobs?.data?.slice(0, 5) || []
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.full_name || 'User'}! 👋</h1>
        <p className="text-gray-600">Here's your job application overview</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">TOTAL</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalApplications}</h3>
          <p className="text-sm text-gray-600">Applications</p>
        </div>
        
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">SUBMITTED</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.submitted}</h3>
          <p className="text-sm text-gray-600">Submitted</p>
        </div>
        
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">DRAFTS</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.drafts}</h3>
          <p className="text-sm text-gray-600">In Progress</p>
        </div>
        
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">SAVED</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalJobs}</h3>
          <p className="text-sm text-gray-600">Jobs</p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/jobs" className="card hover:shadow-lg transition-all hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Browse Jobs</h3>
                <p className="text-sm text-gray-600">View saved jobs</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
          
          <Link to="/applications" className="card hover:shadow-lg transition-all hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-success-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Applications</h3>
                <p className="text-sm text-gray-600">Track progress</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
          
          <Link to="/experiences" className="card hover:shadow-lg transition-all hover:scale-105">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Profile</h3>
                <p className="text-sm text-gray-600">Add experiences</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Applications</h2>
          {recentApplications.length > 0 ? (
            <div className="space-y-3">
              {recentApplications.map(app => (
                <div key={app.id} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold truncate">{app.job_title}</h3>
                  <p className="text-sm text-gray-600">{app.company}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No applications yet</p>
            </div>
          )}
        </div>
        
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Saved Jobs</h2>
          {recentJobs.length > 0 ? (
            <div className="space-y-3">
              {recentJobs.map(job => (
                <div key={job.id} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold truncate">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.company}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No saved jobs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard