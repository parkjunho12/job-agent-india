import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, jobsApi } from '../services/api'
import { 
  ArrowLeft, Edit2, Save, X, Trash2, CheckCircle, Clock, 
  FileText, Briefcase, Calendar, ExternalLink, Loader, AlertCircle 
} from 'lucide-react'

function ApplicationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedAnswers, setEditedAnswers] = useState({})
  const [editedCoverLetter, setEditedCoverLetter] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Fetch application
  const { data: appData, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.get(id)
  })
  
  const application = appData?.data
  
  // Fetch job details
  const { data: jobData } = useQuery({
    queryKey: ['job', application?.job_id],
    queryFn: () => jobsApi.get(application?.job_id),
    enabled: !!application?.job_id
  })
  
  const job = jobData?.data
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => applicationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['application', id])
      queryClient.invalidateQueries(['applications'])
      setIsEditing(false)
      setSuccess('Application updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    },
    onError: (err) => {
      setError(err.response?.data?.detail || 'Failed to update application')
      setTimeout(() => setError(''), 3000)
    }
  })
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => applicationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['applications'])
      navigate('/applications')
    }
  })
  
  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: () => applicationsApi.update(id, { 
      status: 'submitted',
      submitted_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['application', id])
      setSuccess('Application marked as submitted!')
      setTimeout(() => setSuccess(''), 3000)
    }
  })
  
  const handleEdit = () => {
    setEditedAnswers(application.answers || {})
    setEditedCoverLetter(application.cover_letter || '')
    setIsEditing(true)
  }
  
  const handleSave = () => {
    updateMutation.mutate({
      answers: editedAnswers,
      cover_letter: editedCoverLetter
    })
  }
  
  const handleCancel = () => {
    setIsEditing(false)
    setEditedAnswers({})
    setEditedCoverLetter('')
  }
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this application?')) {
      deleteMutation.mutate()
    }
  }
  
  const handleSubmit = () => {
    if (confirm('Mark this application as submitted?')) {
      submitMutation.mutate()
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }
  
  if (!application) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Application not found</h3>
        <Link to="/applications" className="btn btn-primary">
          Back to Applications
        </Link>
      </div>
    )
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link 
          to="/applications"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Applications
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {job?.title || application.job_title || 'Application Details'}
            </h1>
            <p className="text-lg text-gray-700 mb-2">
              {job?.company || application.company}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                Created {new Date(application.created_at).toLocaleDateString()}
              </div>
              {application.submitted_at && (
                <div className="flex items-center gap-1">
                  <CheckCircle size={16} />
                  Submitted {new Date(application.submitted_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          
          <span className={`badge ${getStatusColor(application.status)}`}>
            {application.status}
          </span>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-4">
          <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Actions */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {!isEditing ? (
            <>
              <button
                onClick={handleEdit}
                className="btn btn-primary flex items-center gap-2"
              >
                <Edit2 size={18} />
                Edit Application
              </button>
              
              {application.status === 'draft' && (
                <button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="btn btn-success flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Mark as Submitted
                </button>
              )}
              
              {job?.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <ExternalLink size={18} />
                  View Job Post
                </a>
              )}
              
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="btn btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2 ml-auto"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="btn btn-success flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
              
              <button
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                className="btn btn-secondary flex items-center gap-2"
              >
                <X size={18} />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cover Letter */}
      {(application.cover_letter || isEditing) && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} />
            Cover Letter
          </h2>
          
          {isEditing ? (
            <textarea
              value={editedCoverLetter}
              onChange={(e) => setEditedCoverLetter(e.target.value)}
              className="input w-full"
              rows={12}
              placeholder="Enter your cover letter..."
            />
          ) : (
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">
                {application.cover_letter}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Answers */}
      {application.answers && Object.keys(application.answers).length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Application Answers
          </h2>
          
          <div className="space-y-6">
            {Object.entries(application.answers).map(([questionId, answerData], index) => (
              <div key={questionId} className="border-b border-gray-200 pb-6 last:border-0">
                <h3 className="font-medium text-gray-900 mb-3">
                  Question {index + 1}
                </h3>
                
                {isEditing ? (
                  <textarea
                    value={editedAnswers[questionId]?.answer || answerData.answer || ''}
                    onChange={(e) => setEditedAnswers({
                      ...editedAnswers,
                      [questionId]: {
                        ...answerData,
                        answer: e.target.value
                      }
                    })}
                    className="input w-full"
                    rows={6}
                    placeholder="Enter your answer..."
                  />
                ) : (
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700">
                      {answerData.answer || 'No answer provided'}
                    </p>
                  </div>
                )}
                
                {/* Evidence (if available) */}
                {answerData.evidence && answerData.evidence.length > 0 && !isEditing && (
                  <div className="mt-4 bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Evidence from your experience:
                    </p>
                    <ul className="space-y-1">
                      {answerData.evidence.map((item, idx) => (
                        <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Confidence score (if available) */}
                {answerData.confidence && !isEditing && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-gray-600">AI Confidence:</span>
                    <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${answerData.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round(answerData.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Details (if available) */}
      {job && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase size={20} />
            Job Details
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Company</p>
              <p className="text-gray-900 font-medium">{job.company}</p>
            </div>
            
            {job.location && (
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-gray-900">{job.location}</p>
              </div>
            )}
            
            {job.required_skills && job.required_skills.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, idx) => (
                    <span key={idx} className="badge badge-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {job.url && (
              <div>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 flex items-center gap-2 text-sm"
                >
                  <ExternalLink size={16} />
                  View original job posting
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicationDetail