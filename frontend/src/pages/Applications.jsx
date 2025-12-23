import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { applicationsApi } from '../services/api'
import { FileText, CheckCircle, Clock, XCircle, Calendar, Briefcase, Filter } from 'lucide-react'

function Applications() {
  const [filterStatus, setFilterStatus] = useState('all')
  
  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list({ skip: 0, limit: 50 })
  })
  
  const applications = data?.data || []
  
  const filteredApps = applications.filter(app => 
    filterStatus === 'all' || app.status === filterStatus
  )
  
  const getStatusIcon = (status) => {
    switch(status) {
      case 'submitted': return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'draft': return <Clock className="w-5 h-5 text-yellow-600" />
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />
      default: return <FileText className="w-5 h-5 text-gray-600" />
    }
  }
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'submitted': return 'badge-success'
      case 'draft': return 'badge-warning'
      case 'rejected': return 'badge-danger'
      default: return 'bg-gray-100 text-gray-700'
    }
  }
  
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
        <p className="text-gray-600">Track and manage your job applications</p>
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Submitted</p>
          <p className="text-2xl font-bold text-success-600">
            {applications.filter(a => a.status === 'submitted').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">
            {applications.filter(a => a.status === 'draft').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">This Week</p>
          <p className="text-2xl font-bold text-blue-600">
            {applications.filter(a => {
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return new Date(a.created_at) > weekAgo
            }).length}
          </p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Filter className="w-5 h-5 text-gray-600" />
        <div className="flex gap-2">
          {['all', 'submitted', 'draft'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Applications List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="spinner"></div>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600 mb-6">Start applying to jobs to see them here</p>
          <Link to="/jobs" className="btn btn-primary">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map(app => (
            <div key={app.id} className="card hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getStatusIcon(app.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {app.job_title}
                      </h3>
                      <p className="text-gray-700 font-medium">{app.company}</p>
                    </div>
                    <span className={`badge ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {app.submitted_at && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Submitted {new Date(app.submitted_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Link 
                      to={`/applications/${app.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      View Details
                    </Link>
                    
                    {app.status === 'draft' && (
                      <button className="btn btn-success btn-sm">
                        Continue Application
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Applications