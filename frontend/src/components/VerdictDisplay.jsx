import { useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, Lock, Zap, Target, Edit, Loader2, Loader } from 'lucide-react'
import UnlockPremiumCard from './UnlockPremiumCard'
import QuickApplyCard from './QuickApplyCard'
import AIGenerationHub from './AIGenerationHub'
import EditQuestionsCard from './EditQuestionsCard'
import { useQueryClient } from '@tanstack/react-query'
import { analysisApi } from '../services/api'
import analytics from '../services/analytics'

/**
 * VerdictCard Component
 */
function VerdictCard({ verdict, onAnalyze, analyzing = false }) {
  if (!verdict || !verdict.type) {
      return (
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200 rounded-2xl p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-primary-200">
              <Target className="w-7 h-7 text-primary-700" />
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Analysis needed to get your verdict
              </h2>

              <p className="text-gray-700 mb-4">
                We don’t have a verdict for this job yet. Run the analysis to see:
                ATS risk, recruiter fit, experience match, and recommended next steps.
              </p>

              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary-700 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      This action uses 1 credit
                    </p>
                    <p className="text-sm text-gray-600">
                      We’ll start the analysis immediately and show the results on this page.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onAnalyze}
                  disabled={!onAnalyze || analyzing}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                      <>
                    </>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      Analyze now
                    </>
                  )}
                </button>

              </div>

              <p className="text-xs text-gray-500 mt-3">
                Tip: If the job description is incomplete, update it first for more accurate results.
              </p>
            </div>
          </div>
        </div>
      )
    }

  const getVerdictStyle = (type) => {
    const styles = {
      strong_match: {
        bg: 'bg-gradient-to-br from-success-50 to-success-100',
        border: 'border-success-500',
        icon: CheckCircle,
        iconColor: 'text-success-600',
        buttonBg: 'bg-success-600 hover:bg-success-700'
      },
      borderline: {
        bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
        border: 'border-orange-500',
        icon: AlertTriangle,
        iconColor: 'text-orange-600',
        buttonBg: 'bg-orange-600 hover:bg-orange-700'
      },
      high_risk: {
        bg: 'bg-gradient-to-br from-red-50 to-red-100',
        border: 'border-red-500',
        icon: XCircle,
        iconColor: 'text-red-600',
        buttonBg: 'bg-red-600 hover:bg-red-700'
      }
    }
    return styles[type] || styles.high_risk
  }

  const style = getVerdictStyle(verdict.type)
  const Icon = style.icon

  return (
    <div className={`${style.bg} border-4 ${style.border} rounded-2xl p-8 shadow-xl`}>
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-16 h-16 ${style.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-8 h-8 ${style.iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{verdict.icon}</span>
            <h2 className="text-2xl font-bold text-gray-900">
              {verdict.title}
            </h2>
          </div>
          <p className="text-lg text-gray-700 font-medium">
            {verdict.action}
          </p>
        </div>
      </div>

      {verdict.actions && verdict.actions.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Next Steps:</h3>
          <ul className="space-y-2">
            {verdict.actions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ArrowRight className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
                <span className="text-gray-800">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`p-4 bg-white rounded-lg border-2 ${style.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">
              {verdict.should_apply ? 'Recommended Action' : 'Our Recommendation'}
            </p>
            <p className="text-sm text-gray-600">
              {verdict.should_apply 
                ? 'Go ahead and apply to this job'
                : 'Skip this job or fix gaps first'}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg ${style.buttonBg} text-white font-bold`}>
            {verdict.should_apply ? 'APPLY' : 'SKIP'}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * ATSAnalysisCard
 */
function ATSAnalysisCard({ analysis }) {
  if (!analysis || !analysis.status) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">ATS Filter Risk</h3>
        <p className="text-gray-600">Analysis not available</p>
      </div>
    )
  }

  const getStatusStyle = (status) => {
    const styles = {
      pass: { bg: 'bg-success-50', border: 'border-success-200', icon: 'text-success-600' },
      warning: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600' },
      fail: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600' }
    }
    return styles[status] || styles.fail
  }

  const style = getStatusStyle(analysis.status)

  return (
    <div className={`${style.bg} border-2 ${style.border} rounded-xl p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{analysis.icon}</span>
        <div>
          <h3 className="text-xl font-bold text-gray-900">ATS Filter Risk</h3>
          <p className={`font-semibold ${style.icon}`}>
            {analysis.message}
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {analysis.details && analysis.details.map((detail, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
            <span className={`${style.icon} mt-0.5`}>•</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * RecruiterAnalysisCard
 */
function RecruiterAnalysisCard({ analysis }) {
  if (!analysis || !analysis.status) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Recruiter Expectation</h3>
        <p className="text-gray-600">Analysis not available</p>
      </div>
    )
  }

  const getStatusStyle = (status) => {
    const styles = {
      strong: { bg: 'bg-success-50', border: 'border-success-200', icon: 'text-success-600' },
      partial: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600' },
      mismatch: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600' }
    }
    return styles[status] || styles.mismatch
  }

  const style = getStatusStyle(analysis.status)

  return (
    <div className={`${style.bg} border-2 ${style.border} rounded-xl p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{analysis.icon}</span>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Recruiter Expectation</h3>
          <p className={`font-semibold ${style.icon}`}>
            {analysis.message}
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {analysis.details && analysis.details.map((detail, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
            <span className={`${style.icon} mt-0.5`}>•</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * ExperienceAnalysisCard
 */
function ExperienceAnalysisCard({ analysis }) {
  if (!analysis || !analysis.overall) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Experience Match</h3>
        <p className="text-gray-600">Analysis not available</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Experience Match</h3>
      <p className="text-gray-700 mb-4">{analysis.overall}</p>

      {analysis.key_areas && analysis.key_areas.length > 0 && (
        <div className="space-y-3">
          {analysis.key_areas.map((area, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{area.area}</p>
                {area.note && (
                  <p className="text-sm text-gray-600">{area.note}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                area.status === 'present' 
                  ? 'bg-success-100 text-success-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {area.status === 'present' ? '✓ Present' : '✗ Missing'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * GapDetailsCard - Premium
 */
function GapDetailsCard({ gapDetails, actionItems }) {
  if (!gapDetails || gapDetails.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          🎯 Gaps to Fix
        </h3>
      </div>

      <div className="space-y-3 mb-6">
        {gapDetails.map((gap, idx) => (
          <div key={idx} className="bg-white rounded-lg p-4 border-2 border-orange-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">{gap.skill}</h4>
                <p className="text-sm text-gray-600">
                  Required level: <span className="font-semibold">{gap.required_level}</span>
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                gap.has_experience 
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {gap.has_experience ? '⚠️ Weak' : '❌ Missing'}
              </span>
            </div>
            {gap.note && (
              <p className="text-sm text-gray-700 bg-orange-50 rounded p-2">
                💡 {gap.note}
              </p>
            )}
          </div>
        ))}
      </div>

      {actionItems && actionItems.length > 0 && (
        <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Quick Fixes
          </h4>
          <ul className="space-y-2">
            {actionItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * CustomTipsCard - Premium
 */
function CustomTipsCard({ tips }) {
  if (!tips || tips.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          💡 Custom Tips for You
        </h3>
      </div>

      <div className="space-y-3">
        {tips.map((tip, idx) => (
          <div key={idx} className="bg-white rounded-lg p-4 border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-lg">{idx + 1}.</span>
              <p className="text-gray-700 flex-1">{tip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Main VerdictDisplay Component with AI Generation Hub
 */
function VerdictDisplay({ verdictData, jobId, job, onJobUpdate, onError }) {
  const [isEditingQuestions, setIsEditingQuestions] = useState(false)
  const [currentJob, setCurrentJob] = useState(job)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const queryClient = useQueryClient()


  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true)
      analytics.trackCTAClick('Analyze')
      // 예: 서버에서 분석 실행 (endpoint는 프로젝트에 맞게 수정)
      const data = await analysisApi.analyzeJob(jobId)

      // 분석 후 부모/상위에서 verdictData를 다시 받아오게 하는 방식이면
      // 여기서는 window reload 대신 onJobUpdate나 refetch trigger가 필요함.
      // 가장 간단히는: onJobUpdate 콜백이 있으면 호출하거나,
      // 상위에서 query invalidation을 하도록 설계.
      analytics.trackAnalysis(jobId, data.is_premium)
      queryClient.setQueryData(['analysis', jobId], data)
      onJobUpdate(data)
    } catch (e) {
      onError(e)
      
    } finally {
      setIsAnalyzing(false)
    }
  }

  
  if (!verdictData) {
    return (
      <VerdictCard verdict={verdictData?.verdict} onAnalyze={handleAnalyze} analyzing={isAnalyzing} />
    )
  }

  const premiumData = verdictData.premium || {}
  const showPremiumContent = !premiumData.locked
  const shouldShowQuickApply = verdictData.verdict?.should_apply

  // Scroll to AI Generation Hub
  const scrollToAIHub = () => {
    const element = document.getElementById('ai-generation-hub')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleSaveQuestions = async (structuredQuestions) => {
    try {
      // structuredQuestions comes from backend after save
      // Update local state with the structured format
      setCurrentJob({ ...currentJob, custom_questions: structuredQuestions })
      setIsEditingQuestions(false)
      
      // Notify parent if callback provided
      if (onJobUpdate) {
        onJobUpdate({ ...currentJob, custom_questions: structuredQuestions })
      }
      
    } catch (error) {
      console.error('Failed to update local state:', error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* FREE CONTENT */}
      
      {/* 1. Main Verdict */}
      <VerdictCard verdict={verdictData.verdict} />

      {/* 2. Quick Apply (if strong match) */}
      {shouldShowQuickApply && (
        <QuickApplyCard 
          job={currentJob}
          onGenerateApplication={scrollToAIHub}
        />
      )}

      {/* 3. Analysis Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {verdictData.ats_analysis && (
          <ATSAnalysisCard analysis={verdictData.ats_analysis} />
        )}
        {verdictData.recruiter_analysis && (
          <RecruiterAnalysisCard analysis={verdictData.recruiter_analysis} />
        )}
      </div>

      {/* 4. Experience Analysis */}
      {verdictData.experience_analysis && (
        <ExperienceAnalysisCard analysis={verdictData.experience_analysis} />
      )}

      {/* 5. Strengths */}
      {verdictData.strengths && verdictData.strengths.length > 0 && (
        <div className="bg-success-50 border-2 border-success-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            ✨ Your Strengths to Emphasize
          </h3>
          <ul className="grid md:grid-cols-2 gap-3">
            {verdictData.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PREMIUM CONTENT */}
      {showPremiumContent ? (
        <>
          {/* 6. Gap Details */}
          {premiumData.gap_details && premiumData.gap_details.length > 0 && (
            <GapDetailsCard 
              gapDetails={premiumData.gap_details}
              actionItems={premiumData.action_items}
            />
          )}

          {/* 7. Custom Tips */}
          {premiumData.custom_tips && premiumData.custom_tips.length > 0 && (
            <CustomTipsCard tips={premiumData.custom_tips} />
          )}

          {/* 8. EDIT QUESTIONS or AI GENERATION HUB */}
          {isEditingQuestions ? (
            <EditQuestionsCard
              job={currentJob}
              onSave={handleSaveQuestions}
              onCancel={() => setIsEditingQuestions(false)}
            />
          ) : (
            <div id="ai-generation-hub" className="relative">
              {/* Edit Questions Button */}
              <div className="mb-4">
                <button
                  onClick={() => setIsEditingQuestions(true)}
                  className="w-full rounded-xl border-2 border-primary-300 bg-primary-50 px-4 py-4 text-left shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-primary-200 flex-shrink-0">
                      <Edit className="w-5 h-5 text-primary-700" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-bold text-gray-900">
                          Add application questions to generate better answers
                        </p>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white border border-primary-200 text-primary-700">
                          {currentJob.custom_questions?.length || 0} saved
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-700">
                        Copy questions from the application form, the AI Hub will use them to create job-specific responses.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                          Takes ~30 seconds
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                          Improves answer quality
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                          Works for all jobs
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>


              <AIGenerationHub 
                job={currentJob}
                jobId={jobId}
              />
            </div>
          )}
        </>
      ) : (
        /* Premium Upsell */
        <UnlockPremiumCard 
          premium={premiumData} 
          jobId={jobId} 
        />
      )}
    </div>
  )
}

export default VerdictDisplay