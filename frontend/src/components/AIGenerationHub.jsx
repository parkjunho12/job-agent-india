import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, FileText, MessageSquare, FileCheck, Zap, Loader, CheckCircle, Send, ArrowRight } from 'lucide-react'
import GenerationCard from './GenerationCard'
import CoverLetterModal from './CoverLetterModal'
import QuestionAnswersModal from './QuestionAnswersModal'
import { jobsApi, generationApi, applicationsApi, experiencesApi } from '../services/api'
import analytics from '../services/analytics'

/**
 * AIGenerationHub Component
 * Unified hub for all AI generation features
 */
function AIGenerationHub({ job, jobId }) {
    const navigate = useNavigate()

  const [coverLetter, setCoverLetter] = useState(null)
  const [answers, setAnswers] = useState({})
  const [applicationId, setApplicationId] = useState(null)
  const [isGeneratingCover, setIsGeneratingCover] = useState(false)
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false)
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [progress, setProgress] = useState({ step: '', current: 0, total: 0 })
  
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false)
  const [showAnswersModal, setShowAnswersModal] = useState(false)

  // Generate cover letter
  const generateCoverLetter = async () => {
    setIsGeneratingCover(true)
    try {
      const response = await generationApi.generateCoverLetter(parseInt(jobId))

      setCoverLetter(response.data.cover_letter)
    } catch (error) {
      console.error('Failed to generate cover letter:', error)
      alert('Failed to generate cover letter. Please try again.')
    } finally {
      setIsGeneratingCover(false)
    }
  }

  // Generate question answers
  const generateAnswers = async () => {
    if (!job.custom_questions || job.custom_questions.length === 0) {
      alert('No custom questions to answer')
      return
    }

    setIsGeneratingAnswers(true)
    try {
      const response = await generationApi.generateAnswers(
        parseInt(jobId),
        job.custom_questions
      )
      console.log('Generated answers:', response.data.answers)
      setAnswers(response.data.answers)
    } catch (error) {
      console.error('Failed to generate answers:', error)
      alert('Failed to generate answers. Please try again.')
    } finally {
      setIsGeneratingAnswers(false)
    }
  }

  // Generate complete application package
  const generateAll = async () => {
    setIsGeneratingAll(true)
    const totalSteps = job.custom_questions?.length > 0 ? 5 : 4
    let currentStep = 0

    try {

        setProgress({
            step: 'Generating personalized Application...',
            current: ++currentStep,
            total: totalSteps
          })
          
        const appResponse = await applicationsApi.create({
            job_id: parseInt(jobId),
            answers: {},
            cover_letter: ''
          })
        setApplicationId(appResponse.data.id)

      // 1. Generate cover letter
      setProgress({
        step: 'Generating personalized cover letter...',
        current: ++currentStep,
        total: totalSteps
      })
      let coverLetter = null
      const coverResponse = await generationApi.generateCoverLetter(parseInt(jobId))
      setCoverLetter(coverResponse.data.cover_letter)
      coverLetter = coverResponse.data.cover_letter
    
      let answers = {}
      // 2. Generate answers (if questions exist)
      if (job.custom_questions && job.custom_questions.length > 0) {
        setProgress({
          step: `Generating answers for ${job.custom_questions.length} questions...`,
          current: ++currentStep,
          total: totalSteps
        })
        
        const answersResponse = await generationApi.generateAnswers(
            parseInt(jobId),
            job.custom_questions
          )
        setAnswers(answersResponse.data.answers)
        answers = answersResponse.data.answers
      }

      setProgress({
        step: 'Updating Application with the answers',
        current: ++currentStep,
        total: totalSteps
      })


      if (coverLetter || Object.keys(answers).length > 0) {
        await applicationsApi.update(appResponse.data.id, {
          cover_letter: coverLetter,
          answers: answers
        })
      }

      // 3. Optimize CV (placeholder - assuming this happens automatically)
      setProgress({
        step: 'Optimizing CV for ATS...',
        current: ++currentStep,
        total: totalSteps
      })
      
      // Simulate CV optimization
      await new Promise(resolve => setTimeout(resolve, 10000))

      

      setProgress({
        step: 'Complete! 🎉',
        current: totalSteps,
        total: totalSteps
      })
      
      
      // Clear progress after 2 seconds
      setTimeout(() => {
        setProgress({ step: '', current: 0, total: 0 })
      }, 2000)
      

    } catch (error) {
      console.error('Failed to generate application:', error)
      alert('Failed to generate application. Please try again.')
      setProgress({ step: '', current: 0, total: 0 })
    } finally {
      setIsGeneratingAll(false)
    }
  }


  const hasQuestions = job.custom_questions && job.custom_questions.length > 0
  const isApplicationReady = applicationId && (coverLetter || Object.keys(answers).length > 0)

  return (
    <>
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-2xl p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🤖 AI Application Assistant
            </h2>
            <p className="text-gray-700">
              Generate everything you need to apply in 2 minutes
            </p>
          </div>
        </div>

        {/* Generation Cards Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Cover Letter Card */}
          <GenerationCard
            icon={FileText}
            title="Cover Letter"
            description="Tailored to this job"
            status={isGeneratingCover ? 'generating' : (coverLetter ? 'ready' : 'not-started')}
            time="30 sec"
            onGenerate={generateCoverLetter}
            onView={() => setShowCoverLetterModal(true)}
          />

          {/* Question Answers Card */}
          <GenerationCard
            icon={MessageSquare}
            title={hasQuestions ? `${job.custom_questions.length} Questions` : 'Questions'}
            description={hasQuestions ? 'Pre-filled responses' : 'No questions for this job'}
            status={isGeneratingAnswers ? 'generating' : (Object.keys(answers).length > 0 ? 'ready' : 'not-started')}
            time={hasQuestions ? '1 min' : 'N/A'}
            onGenerate={generateAnswers}
            onView={() => setShowAnswersModal(true)}
            disabled={!hasQuestions}
            disabledMessage="This job has no custom questions to answer"
          />

          {/* CV Optimization Card */}
          <GenerationCard
            icon={FileCheck}
            title="CV Optimized"
            description="ATS-friendly format"
            status="ready"
            time="Auto"
            badge="Included"
            disabled={false}
          />
        </div>

        {/* Generate All Button */}
        <div className="mb-6">
          <button 
            onClick={generateAll}
            disabled={isGeneratingAll}
            className="btn btn-primary w-full text-lg h-16 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {isGeneratingAll ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <Loader className="w-6 h-6 animate-spin" />
                  <span className="font-bold">Generating Application...</span>
                </div>
                <span className="text-sm opacity-90">
                  {progress.step} ({progress.current}/{progress.total})
                </span>
              </div>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                <span className="font-bold">Generate Complete Application Package</span>
                <span className="text-sm opacity-90">(~2 min)</span>
              </>
            )}
          </button>
        </div>

        {/* Success State - View & Submit */}
        {isApplicationReady && !isGeneratingAll && (
          <div className="space-y-4">
            {/* View Generated Content */}
            <div className="bg-white rounded-lg p-4 border-2 border-success-200">
              <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-600" />
                Application Package Ready!
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {coverLetter && (
                  <button 
                    onClick={() => setShowCoverLetterModal(true)}
                    className="btn btn-secondary flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View Cover Letter
                  </button>
                )}
                {Object.keys(answers).length > 0 && (
                  <button 
                    onClick={() => setShowAnswersModal(true)}
                    className="btn btn-secondary flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    View Answers ({Object.keys(answers).length})
                  </button>
                )}
              </div>
            </div>

            {/* Submit Application Button */}
            <div className="bg-gradient-to-r from-success-500 to-primary-500 rounded-xl p-6 text-white">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Send className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    Ready to Submit?
                  </h3>
                  <p className="text-sm opacity-90">
                    Review your application and submit it to the employer
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => navigate(`/applications/${applicationId}`)}
                className="btn bg-white text-primary-600 hover:bg-gray-100 w-full text-lg font-bold h-14 flex items-center justify-center gap-3"
              >
                <Send className="w-5 h-5" />
                Go to Application
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* What's Included */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 mt-6">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            📦 Complete Application Package Includes:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
              <span>Personalized cover letter highlighting your relevant experience</span>
            </li>
            {hasQuestions && (
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
                <span>Pre-filled answers to all {job.custom_questions.length} custom questions</span>
              </li>
            )}
            {!hasQuestions && (
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>No custom questions for this job (you're all set!)</span>
              </li>
            )}
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
              <span>ATS-optimized CV with keywords from job description</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
              <span>Ready to submit in 2 minutes</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      {showCoverLetterModal && (
        <CoverLetterModal
          letter={coverLetter}
          onClose={() => setShowCoverLetterModal(false)}
          onEdit={applicationId ? () => {navigate(`/applications/${applicationId}`)}: null}
        />
      )}

      {showAnswersModal && (
        <QuestionAnswersModal
          questions={job.custom_questions || []}
          answers={answers}
          onClose={() => setShowAnswersModal(false)}
          onEdit={applicationId ? () => {navigate(`/applications/${applicationId}`)}: null}
        />
      )}
    </>
  )
}

export default AIGenerationHub