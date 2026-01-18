import { CheckCircle, AlertTriangle, XCircle, ArrowRight, Lock, Zap, Target } from 'lucide-react'

/**
 * VerdictCard Component
 * 
 * Core of "Decision AI" positioning
 * Shows clear verdict with actionable next steps
 */
function VerdictCard({ verdict, isPremium = false }) {
  // Safety check
  if (!verdict || !verdict.type) {
    return (
      <div className="bg-gray-100 border-2 border-gray-300 rounded-2xl p-8">
        <div className="text-center">
          <p className="text-gray-600">No verdict data available</p>
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
      {/* Verdict Header */}
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

      {/* Action Items */}
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

      {/* Apply Decision */}
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
 * ATS Analysis Section
 * Shows language-based explanation, not scores
 */
function ATSAnalysisCard({ analysis }) {
  // Safety check
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
 * Recruiter Analysis Section
 */
function RecruiterAnalysisCard({ analysis }) {
  // Safety check
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
 * Experience Analysis Section
 */
function ExperienceAnalysisCard({ analysis }) {
  // Safety check
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
 * Gap Details Card (Premium Feature)
 * Shows what skills are missing and action items
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

      {/* Action Items */}
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
 * Custom Tips Card (Premium Feature)
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
 * Cover Letter Available Card (Premium Feature)
 */
function CoverLetterCard({ available }) {
  if (!available) return null

  return (
    <div className="bg-gradient-to-br from-success-50 to-success-100 border-2 border-success-300 rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            ✨ Custom Cover Letter Ready!
          </h3>
          <p className="text-sm text-gray-700">
            A tailored cover letter has been generated for this job
          </p>
        </div>
        <button className="btn btn-success flex items-center gap-2 whitespace-nowrap">
          <CheckCircle className="w-4 h-4" />
          View Letter
        </button>
      </div>
    </div>
  )
}

/**
 * Premium Upsell Card
 * Show what's locked behind paywall
 */
function PremiumUpsellCard({ isPremium }) {
  if (isPremium) return null

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 border-4 border-primary-500 rounded-xl p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            🔒 Get the Full Fix Plan
          </h3>
          <p className="text-gray-700">
            Unlock detailed gap analysis, action items, and custom cover letter
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
          <Lock className="w-5 h-5 text-primary-600" />
          <span className="text-gray-700">
            <strong>Detailed Gap Analysis:</strong> See exactly what skills you're missing
          </span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
          <Lock className="w-5 h-5 text-primary-600" />
          <span className="text-gray-700">
            <strong>Action Items:</strong> Step-by-step guide to fix your CV
          </span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
          <Lock className="w-5 h-5 text-primary-600" />
          <span className="text-gray-700">
            <strong>Custom Cover Letter:</strong> Tailored to this specific job
          </span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
          <Lock className="w-5 h-5 text-primary-600" />
          <span className="text-gray-700">
            <strong>Custom Tips:</strong> Personalized advice for your profile
          </span>
        </div>
      </div>

      <button className="btn btn-primary w-full text-lg font-bold">
        Upgrade for £2.99 →
      </button>
    </div>
  )
}

/**
 * Complete Verdict Display
 * Main component that ties everything together
 */
function VerdictDisplay({ verdictData, isPremium = false }) {
  // Safety check
  if (!verdictData) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-8 text-center">
        <p className="text-yellow-800 font-semibold mb-2">⚠️ No Analysis Data</p>
        <p className="text-gray-600">Please analyze this job first</p>
      </div>
    )
  }

  // Extract premium data
  const premiumData = verdictData.premium || {}
  const showPremiumContent = isPremium && !premiumData.locked

  return (
    <div className="space-y-6">
      {/* Main Verdict */}
      {verdictData.verdict && (
        <VerdictCard verdict={verdictData.verdict} isPremium={isPremium} />
      )}

      {/* Analysis Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {verdictData.ats_analysis && (
          <ATSAnalysisCard analysis={verdictData.ats_analysis} />
        )}
        {verdictData.recruiter_analysis && (
          <RecruiterAnalysisCard analysis={verdictData.recruiter_analysis} />
        )}
      </div>

      {/* Experience Analysis */}
      {verdictData.experience_analysis && (
        <ExperienceAnalysisCard analysis={verdictData.experience_analysis} />
      )}

      {/* Strengths to Emphasize */}
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
          {/* Gap Details */}
          {premiumData.gap_details && premiumData.gap_details.length > 0 && (
            <GapDetailsCard 
              gapDetails={premiumData.gap_details}
              actionItems={premiumData.action_items}
            />
          )}

          {/* Custom Tips */}
          {premiumData.custom_tips && premiumData.custom_tips.length > 0 && (
            <CustomTipsCard tips={premiumData.custom_tips} />
          )}

          {/* Cover Letter */}
          {premiumData.cover_letter_available && (
            <CoverLetterCard available={true} />
          )}
        </>
      ) : (
        /* Premium Upsell */
        <PremiumUpsellCard isPremium={isPremium} />
      )}
    </div>
  )
}

export {
  VerdictCard,
  ATSAnalysisCard,
  RecruiterAnalysisCard,
  ExperienceAnalysisCard,
  GapDetailsCard,
  CustomTipsCard,
  CoverLetterCard,
  PremiumUpsellCard,
  VerdictDisplay
}


export default VerdictDisplay