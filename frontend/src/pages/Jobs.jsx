import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '../services/api'
import { Briefcase, MapPin, Calendar, Search, Filter, Plus, ExternalLink } from 'lucide-react'

function Jobs() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list({ skip: 0, limit: 50 })
  })
  
  const jobs = data?.data || []
  
  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus
    return matchesSearch && matchesStatus
  })
  
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Jobs</h1>
            <p className="text-gray-600 mt-1">
              Manage your job postings
            </p>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Job Manually
          </button>
        </div>
        
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs by title or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="all">All Jobs</option>
              <option value="saved">Saved</option>
              <option value="analyzed">Analyzed</option>
              <option value="applied">Applied</option>
            </select>
            
            <button className="btn btn-secondary flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Job List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-600">Error loading jobs: {error.message}</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Try adjusting your search' : 'Start by saving jobs from Naukri or LinkedIn'}
          </p>
          <button className="btn btn-primary">
            Install Extension
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="card hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                {/* Company Logo Placeholder */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                
                {/* Job Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/jobs/${job.id}`}
                        className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                      >
                        {job.title}
                      </Link>
                      <p className="text-gray-700 font-medium mt-1">{job.company}</p>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`badge ${
                      job.status === 'analyzed' ? 'badge-success' :
                      job.status === 'applied' ? 'badge-primary' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {job.status || 'saved'}
                    </span>
                  </div>
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    
                    {job.portal_type && (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        <span className="capitalize">{job.portal_type}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Skills Tags */}
                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.required_skills.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="badge badge-primary text-xs">
                          {skill}
                        </span>
                      ))}
                      {job.required_skills.length > 5 && (
                        <span className="badge bg-gray-100 text-gray-600 text-xs">
                          +{job.required_skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Link 
                      to={`/jobs/${job.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      View Details
                    </Link>
                    
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Original Post
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Results count */}
      {filteredJobs.length > 0 && (
        <div className="mt-6 text-center text-gray-600">
          Showing {filteredJobs.length} of {jobs.length} jobs
        </div>
      )}
    </div>
  )
}

export default Jobs