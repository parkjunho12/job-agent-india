import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../services/api'
import { Briefcase, MapPin, Calendar, Search, Filter, Plus, ExternalLink, X, Loader, AlertCircle } from 'lucide-react'
import analytics from '../services/analytics'

function Jobs() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  
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
  const [banner, setBanner] = useState(null)
  
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
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Job Manually
          </button>
        </div>

        {banner?.type === 'limit' && (
          <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-yellow-900">{banner.title}</p>
                <p className="text-sm text-yellow-800">{banner.message}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => navigate('/billing')} className="btn btn-primary btn-sm">
                    Upgrade / Buy Credits
                  </button>
                  <button onClick={() => setBanner(null)} className="btn btn-outline btn-sm">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
            {searchTerm ? 'Try adjusting your search' : 'Start by saving jobs from all job portals'}
          </p>
          <div className="card text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Add your first job</h3>
            <p className="text-gray-600 mb-6">
              Paste a job description or add a link. Once saved, you can analyze it and generate your application.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                Add Job Manually
              </button>

              <button
                onClick={() => navigate('/extension')}
                className="btn btn-outline"
              >
                Install Extension
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Tip: Manual add is fastest for your first job. The extension helps once you save jobs regularly.
            </p>
          </div>

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

      {/* Add Job Modal */}
      {showAddModal && (
        <AddJobModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['jobs'])
            setShowAddModal(false)
          }}
          onLimit={(payload) => setBanner(payload)}
        />
      )}
    </div>
  )
}

// Add Job Modal Component
function AddJobModal({ isOpen, onClose, onSuccess, onLimit }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    url: '',
    description: '',
    required_skills: '',
    required_experience: '',
    salary_range: '',
    job_type: '',
  })
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      
      const payload = {
        title: formData.title,
        company: formData.company,
        location: formData.location || null,
        url: formData.url || "",
        description: formData.description || "",
        required_skills: formData.required_skills 
          ? formData.required_skills.split(',').map(s => s.trim()).filter(s => s)
          : [],
        required_experience: formData.required_experience || null,
        salary_range: formData.salary_range || null,
        job_type: formData.job_type || null,
        portal_type: 'manual',
        status: 'saved'
      }
      
      const response = await jobsApi.create(payload)
      analytics.trackJobAdded(response.data.id)
      onSuccess()
    } catch (err) {
      console.error('Add job error:', err)
      
      // Parse error response
      const errorDetail = err.response?.data?.error
      const statusCode = err.response?.data?.status_code
      
      // Check for tier limit errors
      if (statusCode === 403 || statusCode === 429) {
        const payload = {
          type: 'limit',
          message: errorDetail || 'You have reached your plan limit',
          action: 'upgrade',
          title: 'You’ve hit your plan limit'
        }
        setError(payload)
        onLimit?.(payload)
      } else if (statusCode === 400) {
        setError({
          type: 'validation',
          message: errorDetail || 'Please check your input and try again'
        })
        onLimit?.(payload)
      } else {
        setError({
          type: 'error',
          message: errorDetail || 'Failed to save job. Please try again.'
        })
        onLimit?.(payload)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 my-8">
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Job Manually</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <ErrorMessage 
              error={error} 
              onClose={() => setError(null)} 
            />
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input w-full"
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="input w-full"
                placeholder="e.g., Google"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input w-full"
                rows={6}
                placeholder="Paste the job description here..."
              />
            </div>

            {/* Location & Job Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., London, UK"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Type (optional)
                </label>
                <select
                  value={formData.job_type}
                  onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Select type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job URL (optional)
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="input w-full"
                placeholder="https://..."
              />
            </div>


            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Skills (comma separated)
              </label>
              <input
                type="text"
                value={formData.required_skills}
                onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                className="input w-full"
                placeholder="e.g., Python, React, AWS, Docker"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate skills with commas
              </p>
            </div>

            {/* Experience & Salary */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Experience (optional)
                </label>
                <input
                  type="text"
                  value={formData.required_experience}
                  onChange={(e) => setFormData({ ...formData, required_experience: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., 3-5 years"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Range (optional)
                </label>
                <input
                  type="text"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., £50k - £70k"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add Job
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Error Message Component with Tier Limit Handling
function ErrorMessage({ error, onClose }) {
  const navigate = useNavigate()
  if (!error) return null

  const isLimitError = error.type === 'limit'

  return (
    <div className={`mb-6 rounded-xl p-5 border ${
      isLimitError ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className={`font-bold text-lg mb-1 ${
            isLimitError ? 'text-yellow-900' : 'text-red-900'
          }`}>
            {isLimitError ? 'Plan limit reached' : 'Something went wrong'}
          </h3>

          <p className={`text-sm mb-4 ${
            isLimitError ? 'text-yellow-800' : 'text-red-800'
          }`}>
            {error.message}
          </p>

          {isLimitError ? (
            <>
              <div className="bg-white rounded-lg p-4 border border-yellow-200 mb-4">
                <p className="text-sm text-gray-700 font-semibold mb-2">
                  You can’t add more jobs on the current plan.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Add unlimited saved jobs</li>
                  <li>• Unlock more analyses & generations</li>
                  <li>• Keep all your past jobs</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    onClose()
                    navigate('/billing')
                  }}
                  className="btn btn-primary w-full"
                >
                  Upgrade / Buy Credits
                </button>

                <button
                  onClick={() => {
                    onClose()
                    navigate('/jobs')
                  }}
                  className="btn btn-outline w-full"
                >
                  View my jobs
                </button>
              </div>

              <p className="text-xs text-gray-600 mt-3">
                Tip: If you only need to add 1 more job, a one-time credit pack may be cheaper than a subscription.
              </p>
            </>
          ) : null}
        </div>

        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default Jobs