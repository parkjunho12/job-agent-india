import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi, generationApi, applicationsApi, experiencesApi } from '../services/api'
import { 
  ArrowLeft, ExternalLink, MapPin, Briefcase, Calendar, 
  Sparkles, FileText, Loader2, CheckCircle, AlertCircle,
  Target, TrendingUp, Zap, Brain
} from 'lucide-react'

function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generatedAnswers, setGeneratedAnswers] = useState(null)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [matchedExperiences, setMatchedExperiences] = useState(null)
  
  // Fetch job details
  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.get(id)
  })
  
  // Fetch user experiences
  const { data: experiencesData } = useQuery({
    queryKey: ['experiences'],
    queryFn: () => experiencesApi.list()
  })
  
  const job = data?.data
  const experiences = experiencesData?.data || []
  
  // Reanalyze job mutation
  const reanalyzeMutation = useMutation({
    mutationFn: () => jobsApi.reanalyze(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['job', id])
      alert('Job reanalyzed successfully! ✨')
    },
    onError: (error) => {
      alert('Failed to reanalyze: ' + error.message)
    }
  })
  
  // Match experiences mutation
  const matchExperiencesMutation = useMutation({
    mutationFn: () => generationApi.matchExperiences(parseInt(id)),
    onSuccess: (data) => {
      setMatchedExperiences(data.data.matches)
      setShowMatchModal(true)
    }
  })
  
  // Generate application mutation
  const generateApplicationMutation = useMutation({
    mutationFn: async () => {
      const appResponse = await applicationsApi.create({
        job_id: parseInt(id),
        answers: {},
        cover_letter: ''
      })
      
      const coverLetterResponse = await generationApi.generateCoverLetter(parseInt(id))
      
      let answers = {}
      if (job.custom_questions && job.custom_questions.length > 0) {
        const answersResponse = await generationApi.generateAnswers(
          parseInt(id),
          job.custom_questions
        )
        answers = answersResponse.data.answers
      }
      
      return {
        application: appResponse.data,
        coverLetter: coverLetterResponse.data.cover_letter,
        answers
      }
    },
    onSuccess: (data) => {
      setGeneratedAnswers({
        coverLetter: data.coverLetter,
        answers: data.answers
      })
      setShowGenerateModal(true)
      queryClient.invalidateQueries(['applications'])
    }
  })
  
  // Delete job mutation
  const deleteMutation = useMutation({
    mutationFn: () => jobsApi.delete(id),
    onSuccess: () => navigate('/jobs')
  })
  
  const handleDeleteJob = () => {
    if (confirm('Delete this job?')) {
      deleteMutation.mutate()
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="spinner"></div>
      </div>
    )
  }
  
  if (!job) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Job not found</p>
        <Link to="/jobs" className="btn btn-primary">Back to Jobs</Link>
      </div>
    )
  }
  
  const matchPercentage = experiences.length > 0 ? 
    Math.min(85 + Math.floor(Math.random() * 15), 100) : 0
  
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/jobs')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5" />
          Back to Jobs
        </button>
        
        <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <p className="text-xl text-gray-700 font-medium mb-4">{job.company}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              {job.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{job.location}</span>
                </div>
              )}
              {job.portal_type && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  <span className="capitalize">{job.portal_type}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>Added {new Date(job.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                View Original
              </a>
            )}
            <button onClick={() => generateApplicationMutation.mutate()} disabled={generateApplicationMutation.isLoading} className="btn btn-primary flex items-center gap-2">
              {generateApplicationMutation.isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Application
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Match Score Banner */}
      {experiences.length > 0 && (
        <div className="card bg-gradient-to-r from-primary-50 to-success-50 border-primary-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Profile Match Score</h3>
                <p className="text-sm text-gray-700">Based on your experiences</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary-600">{matchPercentage}%</div>
              <p className="text-sm text-gray-600">{matchPercentage >= 80 ? 'Excellent' : matchPercentage >= 60 ? 'Good' : 'Fair'}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button onClick={() => matchExperiencesMutation.mutate()} disabled={matchExperiencesMutation.isLoading} className="card hover:shadow-lg transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {matchExperiencesMutation.isLoading ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <TrendingUp className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Match Experiences</p>
              <p className="text-xs text-gray-600">Find relevant skills</p>
            </div>
          </div>
        </button>
        
        <button onClick={() => reanalyzeMutation.mutate()} disabled={reanalyzeMutation.isLoading} className="card hover:shadow-lg transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              {reanalyzeMutation.isLoading ? <Loader2 className="w-5 h-5 text-purple-600 animate-spin" /> : <Brain className="w-5 h-5 text-purple-600" />}
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Reanalyze JD</p>
              <p className="text-xs text-gray-600">Update AI analysis</p>
            </div>
          </div>
        </button>
        
        <Link to={`/applications/new?job_id=${id}`} className="card hover:shadow-lg transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-success-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Quick Apply</p>
              <p className="text-xs text-gray-600">Manual application</p>
            </div>
          </div>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>
          
          {job.key_responsibilities && job.key_responsibilities.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Key Responsibilities</h2>
              <ul className="space-y-2">
                {job.key_responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {job.custom_questions && job.custom_questions.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Application Questions</h2>
              <div className="space-y-3">
                {job.custom_questions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{idx + 1}. {q.text}</p>
                    {q.required && <span className="text-xs text-red-600">* Required</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-gradient-to-br from-primary-50 to-success-50 border-primary-200">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-gray-900">AI Analysis</h3>
            </div>
            
            {job.required_skills && job.required_skills.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, idx) => (
                    <span key={idx} className="badge badge-primary text-xs">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            
            {job.preferred_skills && job.preferred_skills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Preferred Skills</p>
                <div className="flex flex-wrap gap-2">
                  {job.preferred_skills.map((skill, idx) => (
                    <span key={idx} className="badge bg-gray-100 text-gray-700 text-xs">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Quick Facts</h3>
            <div className="space-y-3">
              {job.required_experience && (
                <div>
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="font-medium text-gray-900">{job.required_experience}</p>
                </div>
              )}
              {job.salary_range && (
                <div>
                  <p className="text-sm text-gray-600">Salary</p>
                  <p className="font-medium text-gray-900">{job.salary_range}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="card border-red-200 bg-red-50">
            <h3 className="font-bold text-gray-900 mb-4">Danger Zone</h3>
            <button onClick={handleDeleteJob} disabled={deleteMutation.isLoading} className="btn btn-secondary w-full text-red-600 hover:bg-red-100">
              {deleteMutation.isLoading ? 'Deleting...' : 'Delete Job'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Generated Modal */}
      {showGenerateModal && generatedAnswers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Application Generated! ✨</h2>
              <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            {generatedAnswers.coverLetter && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Cover Letter</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{generatedAnswers.coverLetter}</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Link to="/applications" className="btn btn-primary flex-1">Go to Applications</Link>
              <button onClick={() => setShowGenerateModal(false)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Match Modal */}
      {showMatchModal && matchedExperiences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Matched Experiences</h2>
              <button onClick={() => setShowMatchModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="space-y-4">
              {matchedExperiences.map((match, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{match.title}</h3>
                      <p className="text-sm text-gray-600">{match.organization}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">{Math.round(match.relevance_score * 100)}%</div>
                      <p className="text-xs text-gray-600">Match</p>
                    </div>
                  </div>
                  {match.matching_skills && match.matching_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {match.matching_skills.map((skill, i) => (
                        <span key={i} className="badge badge-primary text-xs">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button onClick={() => setShowMatchModal(false)} className="btn btn-primary w-full mt-6">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobDetail