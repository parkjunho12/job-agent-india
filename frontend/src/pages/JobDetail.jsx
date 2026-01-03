import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi, generationApi, applicationsApi, experiencesApi } from '../services/api'
import { 
  ArrowLeft, ExternalLink, MapPin, Briefcase, Calendar, 
  Sparkles, FileText, Loader2, CheckCircle, AlertCircle,
  Target, TrendingUp, Zap, Brain, X
} from 'lucide-react'

function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showGenerateOptions, setShowGenerateOptions] = useState(false)
  const [includeCoverLetter, setIncludeCoverLetter] = useState(true)
  const [generatedAnswers, setGeneratedAnswers] = useState(null)
  const [generationProgress, setGenerationProgress] = useState({
    step: '',
    current: 0,
    total: 0
  })
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
    },
    onError: (error) => {
      alert('Failed to match experiences: ' + error.message)
    }
  })
  
  // Generate application mutation
  const generateApplicationMutation = useMutation({
    mutationFn: async () => {
      const totalSteps = includeCoverLetter ? 3 : 2
      let currentStep = 0
      
      // Step 1: Create application
      setGenerationProgress({
        step: 'Creating application...',
        current: ++currentStep,
        total: totalSteps
      })
      
      const appResponse = await applicationsApi.create({
        job_id: parseInt(id),
        answers: {},
        cover_letter: ''
      })
      
      let coverLetter = null
      
      // Step 2: Generate cover letter (optional)
      if (includeCoverLetter) {
        setGenerationProgress({
          step: 'Generating cover letter...',
          current: ++currentStep,
          total: totalSteps
        })
        
        const coverLetterResponse = await generationApi.generateCoverLetter(parseInt(id))
        coverLetter = coverLetterResponse.data.cover_letter
      }
      
      // Step 3: Generate answers
      let answers = {}
      if (job.custom_questions && job.custom_questions.length > 0) {
        setGenerationProgress({
          step: `Generating answers for ${job.custom_questions.length} questions...`,
          current: ++currentStep,
          total: totalSteps
        })
        
        const answersResponse = await generationApi.generateAnswers(
          parseInt(id),
          job.custom_questions
        )
        answers = answersResponse.data.answers
      }
      
      // Update application with generated content
      if (coverLetter || Object.keys(answers).length > 0) {
        await applicationsApi.update(appResponse.data.id, {
          cover_letter: coverLetter,
          answers: answers
        })
      }
      
      return {
        application: appResponse.data,
        coverLetter,
        answers
      }
    },
    onSuccess: (data) => {
      setGeneratedAnswers({
        coverLetter: data.coverLetter,
        answers: data.answers
      })
      setShowGenerateOptions(false)
      setShowGenerateModal(true)
      setGenerationProgress({ step: '', current: 0, total: 0 })
      queryClient.invalidateQueries(['applications'])
    },
    onError: (error) => {
      alert('Failed to generate application: ' + error.message)
      setGenerationProgress({ step: '', current: 0, total: 0 })
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
  
  const handleGenerateClick = () => {
    setShowGenerateOptions(true)
  }
  
  const handleQuickApply = () => {
    // Quick apply with default settings (no cover letter)
    setIncludeCoverLetter(false)
    generateApplicationMutation.mutate()
  }
  
  const handleStartGeneration = () => {
    generateApplicationMutation.mutate()
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
  
  // Calculate real match percentage based on skills
  const calculateMatchScore = () => {
    if (!job || experiences.length === 0) return 0
    
    const jobSkills = new Set([
      ...(job.required_skills || []),
      ...(job.preferred_skills || [])
    ].map(s => s.toLowerCase()))
    
    if (jobSkills.size === 0) return 0
    
    // Get all skills from experiences
    const userSkills = new Set()
    experiences.forEach(exp => {
      if (exp.skills && Array.isArray(exp.skills)) {
        exp.skills.forEach(skill => userSkills.add(skill.toLowerCase()))
      }
    })
    
    if (userSkills.size === 0) return 0
    
    // Calculate overlap
    const matchingSkills = [...jobSkills].filter(skill => userSkills.has(skill))
    const matchPercentage = Math.round((matchingSkills.length / jobSkills.size) * 100)
    
    return matchPercentage
  }
  
  const matchPercentage = calculateMatchScore()
  
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
            <button 
              onClick={handleGenerateClick} 
              disabled={generateApplicationMutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              {generateApplicationMutation.isPending ? (
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
        <>
          <div className="card bg-gradient-to-r from-primary-50 to-success-50 border-primary-200 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-8 h-8 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Profile Match Score</h3>
                  <p className="text-sm text-gray-700">
                    {(() => {
                      const jobSkills = new Set([
                        ...(job.required_skills || []),
                        ...(job.preferred_skills || [])
                      ].map(s => s.toLowerCase()))
                      
                      const userSkills = new Set()
                      experiences.forEach(exp => {
                        if (exp.skills && Array.isArray(exp.skills)) {
                          exp.skills.forEach(skill => userSkills.add(skill.toLowerCase()))
                        }
                      })
                      
                      const matchingSkills = [...jobSkills].filter(skill => userSkills.has(skill))
                      
                      return `${matchingSkills.length} of ${jobSkills.size} required skills matched`
                    })()}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-4xl font-bold ${
                  matchPercentage >= 70 ? 'text-success-600' : 
                  matchPercentage >= 40 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {matchPercentage}%
                </div>
                <p className="text-sm text-gray-600">
                  {matchPercentage >= 70 ? 'Strong Match' : 
                   matchPercentage >= 40 ? 'Moderate Match' : 
                   matchPercentage > 0 ? 'Weak Match' : 
                   'No Match'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Matched Skills Details */}
          {(() => {
            const jobSkills = [
              ...(job.required_skills || []),
              ...(job.preferred_skills || [])
            ]
            
            const userSkills = new Set()
            experiences.forEach(exp => {
              if (exp.skills && Array.isArray(exp.skills)) {
                exp.skills.forEach(skill => userSkills.add(skill.toLowerCase()))
              }
            })
            
            const matchedSkills = jobSkills.filter(skill => 
              userSkills.has(skill.toLowerCase())
            )
            const missingSkills = jobSkills.filter(skill => 
              !userSkills.has(skill.toLowerCase())
            )
            
            if (matchedSkills.length === 0 && missingSkills.length === 0) return null
            
            return (
              <div className="card mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Skills Analysis</h3>
                
                {matchedSkills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-success-600" />
                      <p className="text-sm font-medium text-gray-700">
                        You have these skills ({matchedSkills.length})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {matchedSkills.map((skill, idx) => (
                        <span key={idx} className="badge badge-success text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {missingSkills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm font-medium text-gray-700">
                        Consider adding these skills ({missingSkills.length})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.map((skill, idx) => (
                        <span key={idx} className="badge bg-gray-100 text-gray-700 text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </>
      )}
      
      {/* AI Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button 
          onClick={() => matchExperiencesMutation.mutate()} 
          disabled={matchExperiencesMutation.isPending} 
          className="card hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {matchExperiencesMutation.isPending ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <TrendingUp className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Match Experiences</p>
              <p className="text-xs text-gray-600">
                {matchExperiencesMutation.isPending ? 'Analyzing...' : 'Find relevant skills'}
              </p>
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => reanalyzeMutation.mutate()} 
          disabled={reanalyzeMutation.isPending} 
          className="card hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              {reanalyzeMutation.isPending ? (
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              ) : (
                <Brain className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Reanalyze JD</p>
              <p className="text-xs text-gray-600">
                {reanalyzeMutation.isPending ? 'Analyzing...' : 'Update AI analysis'}
              </p>
            </div>
          </div>
        </button>
        
        <button 
          onClick={handleQuickApply}
          disabled={generateApplicationMutation.isPending}
          className="card hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              {generateApplicationMutation.isPending ? (
                <Loader2 className="w-5 h-5 text-success-600 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 text-success-600" />
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Quick Apply</p>
              <p className="text-xs text-gray-600">
                {generateApplicationMutation.isPending ? 'Generating...' : 'Fast generation'}
              </p>
            </div>
          </div>
        </button>
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
            <button 
              onClick={handleDeleteJob} 
              disabled={deleteMutation.isPending} 
              className="btn btn-secondary w-full text-red-600 hover:bg-red-100"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Job'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Generate Options Modal */}
      {showGenerateOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Generate Application</h2>
              <button 
                onClick={() => setShowGenerateOptions(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">What will be generated?</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• AI-powered application</li>
                      {job.custom_questions && job.custom_questions.length > 0 && (
                        <li>• Answers for {job.custom_questions.length} question{job.custom_questions.length > 1 ? 's' : ''}</li>
                      )}
                      {includeCoverLetter && <li>• Personalized cover letter</li>}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCoverLetter}
                    onChange={(e) => setIncludeCoverLetter(e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Include Cover Letter</p>
                    <p className="text-sm text-gray-600">
                      Generate a personalized cover letter using your experiences
                    </p>
                  </div>
                </label>
              </div>
              
              {experiences.length === 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You don't have any experiences yet. The AI will generate generic content. 
                    <Link to="/experiences" className="underline ml-1">Add experiences</Link> for better results.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleStartGeneration}
                disabled={generateApplicationMutation.isPending}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {generateApplicationMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate
                  </>
                )}
              </button>
              <button
                onClick={() => setShowGenerateOptions(false)}
                disabled={generateApplicationMutation.isPending}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Generation Progress Modal */}
      {generateApplicationMutation.isPending && generationProgress.step && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Application</h2>
              <p className="text-gray-600 mb-6">{generationProgress.step}</p>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                Step {generationProgress.current} of {generationProgress.total}
              </p>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  This may take 10-30 seconds. Please don't close this window.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Generated Modal */}
      {showGenerateModal && generatedAnswers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-8 h-8 text-success-600" />
                <h2 className="text-2xl font-bold">Application Generated! ✨</h2>
              </div>
              <button 
                onClick={() => setShowGenerateModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            {generatedAnswers.coverLetter && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Cover Letter
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">{generatedAnswers.coverLetter}</p>
                </div>
              </div>
            )}
            
            {generatedAnswers.answers && Object.keys(generatedAnswers.answers).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Generated Answers</h3>
                <div className="space-y-4">
                  {Object.entries(generatedAnswers.answers).map(([questionId, answer], idx) => (
                    <div key={questionId} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">Question {idx + 1}</p>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {typeof answer === 'string' ? answer : answer.answer}
                      </p>
                      {answer.confidence && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-600">AI Confidence:</span>
                          <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-primary-500 h-1.5 rounded-full"
                              style={{ width: `${answer.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {Math.round(answer.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Link to="/applications" className="btn btn-primary flex-1">
                Go to Applications
              </Link>
              <button 
                onClick={() => setShowGenerateModal(false)} 
                className="btn btn-secondary"
              >
                Close
              </button>
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
              <button 
                onClick={() => setShowMatchModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            {matchedExperiences.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No matching experiences found</p>
                <Link to="/experiences" className="btn btn-primary">
                  Add Experiences
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {matchedExperiences.map((match, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{match.title}</h3>
                        <p className="text-sm text-gray-600">{match.organization || match.company}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary-600">
                          {Math.round(match.relevance_score * 100)}%
                        </div>
                        <p className="text-xs text-gray-600">Match</p>
                      </div>
                    </div>
                    {match.matching_skills && match.matching_skills.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-600 mb-2">Matching Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {match.matching_skills.map((skill, i) => (
                            <span key={i} className="badge badge-primary text-xs">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => setShowMatchModal(false)} 
              className="btn btn-primary w-full mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobDetail