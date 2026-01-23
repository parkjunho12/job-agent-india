import { ArrowDown, TrendingUp, Clock, Users, Zap } from 'lucide-react'

// ============================================
// Advanced Funnel Section
// ============================================

export function AdvancedFunnelSection({ funnel, metrics, timeline }) {
  if (!funnel.total_signups || funnel.total_signups === 0) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          🔄 Conversion Funnel
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No data available yet. Start getting signups to see the funnel!
        </div>
      </section>
    )
  }

  const stages = [
    { 
      label: 'Signups', 
      value: funnel.total_signups, 
      width: 100,
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    { 
      label: 'Added Job', 
      value: funnel.users_with_job, 
      width: (funnel.users_with_job / funnel.total_signups) * 100,
      rate: funnel.signup_to_job_rate,
      icon: Zap,
      color: 'from-green-500 to-green-600'
    },
    { 
      label: 'First Analysis', 
      value: funnel.users_with_analysis, 
      width: (funnel.users_with_analysis / funnel.total_signups) * 100,
      rate: funnel.job_to_analysis_rate,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600'
    },
    { 
      label: 'Converted', 
      value: funnel.users_converted, 
      width: (funnel.users_converted / funnel.total_signups) * 100,
      rate: funnel.premium_to_conversion_rate,
      icon: TrendingUp,
      color: 'from-success-500 to-success-600'
    }
  ]

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🔄 Conversion Funnel
      </h2>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-6">
          {stages.map((stage, idx) => (
            <div key={idx} className="relative">
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${stage.color} rounded-lg flex items-center justify-center text-white`}>
                    <stage.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">
                      {idx + 1}. {stage.label}
                    </span>
                    {stage.rate !== undefined && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({stage.rate.toFixed(1)}% from previous)
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">
                    {stage.value} users
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    ({stage.width.toFixed(1)}% of total)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full bg-gray-100 rounded-lg h-16 flex items-center overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${stage.color} rounded-lg flex items-center justify-center text-white font-bold text-lg transition-all duration-500 shadow-lg`}
                  style={{ width: `${stage.width}%` }}
                >
                  {stage.width > 20 && <span>{stage.value}</span>}
                </div>
                
                {/* Percentage Label */}
                {stage.width <= 20 && (
                  <span className="absolute left-2 text-sm font-semibold text-gray-700">
                    {stage.value}
                  </span>
                )}
              </div>

              {/* Drop-off Indicator */}
              {idx < stages.length - 1 && stages[idx + 1].value < stage.value && (
                <div className="flex items-center gap-2 mt-3 text-sm">
                  <div className="flex items-center gap-1 text-red-600 font-semibold">
                    <ArrowDown className="w-4 h-4" />
                    <span>
                      {((1 - stages[idx + 1].value / stage.value) * 100).toFixed(1)}% drop-off
                    </span>
                  </div>
                  <span className="text-gray-500">
                    ({stage.value - stages[idx + 1].value} users lost)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Funnel Summary */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">
                {((funnel.users_converted / funnel.total_signups) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Overall Conversion</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success-600">
                {funnel.users_with_analysis}
              </p>
              <p className="text-sm text-gray-600 mt-1">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                £{((metrics.total_revenue || 0) / (funnel.users_converted || 1)).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Revenue per Conversion</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// Engagement Deep Dive
// ============================================

export function EngagementDeepDive({ metrics, advancedMetrics }) {
  const engagementScore = advancedMetrics.engagement_score || 0
  const healthScore = advancedMetrics.health_score || 0

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        💡 Engagement Deep Dive
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Engagement Score */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Engagement Score
          </h3>
          
          <div className="flex items-center gap-6 mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="8"
                  strokeDasharray={`${engagementScore * 2.51} 251`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{engagementScore}</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Analysis Rate</span>
                  <span className="font-semibold">
                    {((metrics.users_with_analysis || 0) / (metrics.total_signups || 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avg Analyses</span>
                  <span className="font-semibold">{(metrics.avg_analyses_per_user || 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            engagementScore >= 70 ? 'bg-success-50 text-success-900' :
            engagementScore >= 40 ? 'bg-yellow-50 text-yellow-900' : 'bg-red-50 text-red-900'
          }`}>
            <p className="text-sm font-semibold">
              {engagementScore >= 70 ? '🎉 Excellent engagement! Users are highly active.' :
               engagementScore >= 40 ? '⚠️ Moderate engagement. Consider boosting activation.' :
               '🚨 Low engagement. Focus on onboarding improvements.'}
            </p>
          </div>
        </div>

        {/* Health Score */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">System Health Score</h3>
          
          <div className="flex items-center gap-6 mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="8"
                  strokeDasharray={`${healthScore * 2.51} 251`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{healthScore}</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Signup Goal</span>
                  <span className="font-semibold">{((metrics.total_signups || 0) / 50 * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Engagement Goal</span>
                  <span className="font-semibold">
                    {((metrics.users_with_analysis || 0) / (metrics.total_signups || 1) / 0.4 * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Conversion Goal</span>
                  <span className="font-semibold">{((metrics.avg_conversion_rate || 0) / 5 * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            healthScore >= 80 ? 'bg-blue-50 text-blue-900' :
            healthScore >= 50 ? 'bg-yellow-50 text-yellow-900' : 'bg-red-50 text-red-900'
          }`}>
            <p className="text-sm font-semibold">
              {healthScore >= 80 ? '✅ System healthy! All goals on track.' :
               healthScore >= 50 ? '⚠️ Some goals need attention.' : '🚨 Multiple goals below target.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// Revenue Analytics
// ============================================

export function RevenueAnalytics({ metrics, timeline }) {
  const totalRevenue = metrics.total_revenue || 0
  const totalConversions = metrics.total_conversions || 1
  const avgRevenuePerConversion = totalRevenue / totalConversions

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">💰 Revenue Analytics</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-success-50 to-green-50 rounded-xl border-2 border-success-300 p-6">
          <p className="text-sm font-semibold text-success-700 mb-2">Total Revenue</p>
          <p className="text-4xl font-bold text-success-900 mb-4">£{totalRevenue.toFixed(2)}</p>
          <div className="flex items-center gap-2 text-sm text-success-700">
            <TrendingUp className="w-4 h-4" />
            <span>+{(metrics.trends?.revenue_change || 0).toFixed(0)}% vs last period</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-semibold text-gray-600 mb-2">Avg Revenue per Conversion</p>
          <p className="text-4xl font-bold text-gray-900 mb-4">£{avgRevenuePerConversion.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Based on {totalConversions} conversion{totalConversions !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-semibold text-gray-600 mb-2">Revenue per User</p>
          <p className="text-4xl font-bold text-gray-900 mb-4">£{(totalRevenue / (metrics.total_signups || 1)).toFixed(2)}</p>
          <p className="text-sm text-gray-600">Across {metrics.total_signups || 0} users</p>
        </div>
      </div>
    </section>
  )
}

// ============================================
// AI Insights Section
// ============================================

export function AIInsightsSection({ metrics, goals, funnel, advancedMetrics }) {
  const recommendations = generateRecommendations(metrics, goals, funnel, advancedMetrics)

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🤖 AI-Powered Insights</h2>
      <div className="space-y-4">
        {recommendations.map((rec, idx) => (
          <RecommendationCard key={idx} type={rec.type} title={rec.title} description={rec.description} action={rec.action} />
        ))}
      </div>
    </section>
  )
}

function generateRecommendations(metrics, goals, funnel, advancedMetrics) {
  const recommendations = []
  const freeUsageRate = goals.free_usage_rate?.current || 0
  const freeUsageTarget = goals.free_usage_rate?.target || 40

  if (freeUsageRate >= freeUsageTarget) {
    recommendations.push({
      type: 'success',
      title: `Strong Free Tier Engagement: ${freeUsageRate.toFixed(1)}%`,
      description: `${freeUsageRate.toFixed(1)}% of users are actively using analyses, exceeding the ${freeUsageTarget}% target.`,
      action: 'Consider promoting premium features more aggressively to convert engaged users.'
    })
  } else {
    recommendations.push({
      type: 'warning',
      title: `Free Tier Engagement Below Target`,
      description: `Only ${freeUsageRate.toFixed(1)}% of users are analyzing jobs (target: ${freeUsageTarget}%).`,
      action: 'Focus on improving onboarding, email activation campaigns, and feature discovery.'
    })
  }

  const conversionRate = goals.conversion_rate?.current || 0
  const conversionTarget = goals.conversion_rate?.target || 5

  if (conversionRate >= conversionTarget) {
    recommendations.push({
      type: 'success',
      title: `Conversion Rate Exceeds Target: ${conversionRate.toFixed(2)}%`,
      description: `You've exceeded the ${conversionTarget}% target. Revenue momentum is strong.`,
      action: 'Maintain current pricing and value proposition.'
    })
  } else {
    recommendations.push({
      type: 'warning',
      title: `Conversion Rate Needs Boost`,
      description: `At ${conversionRate.toFixed(2)}%, you're ${(conversionTarget - conversionRate).toFixed(2)}% away from target.`,
      action: 'Optimize premium unlock flow, add social proof, and create urgency.'
    })
  }

  if (funnel.signup_to_job_rate && funnel.signup_to_job_rate < 60) {
    recommendations.push({
      type: 'error',
      title: `High Drop-off After Signup: ${(100 - funnel.signup_to_job_rate).toFixed(1)}%`,
      description: `Only ${funnel.signup_to_job_rate.toFixed(1)}% of users add a job after signing up.`,
      action: 'Simplify job creation flow, add onboarding tooltips, and send activation emails.'
    })
  }

  const engagementScore = advancedMetrics.engagement_score || 0
  if (engagementScore >= 70) {
    recommendations.push({
      type: 'success',
      title: `Excellent Engagement Score: ${engagementScore}/100`,
      description: 'Users are highly engaged with the product.',
      action: 'Collect testimonials and case studies from power users for marketing.'
    })
  }

  return recommendations
}

function RecommendationCard({ type, title, description, action }) {
  const styles = {
    success: { bg: 'bg-success-50', border: 'border-success-300', icon: '✓', iconBg: 'bg-success-500', title: 'text-success-900' },
    warning: { bg: 'bg-orange-50', border: 'border-orange-300', icon: '⚠', iconBg: 'bg-orange-500', title: 'text-orange-900' },
    error: { bg: 'bg-red-50', border: 'border-red-300', icon: '🚨', iconBg: 'bg-red-500', title: 'text-red-900' },
    info: { bg: 'bg-blue-50', border: 'border-blue-300', icon: 'ℹ', iconBg: 'bg-blue-500', title: 'text-blue-900' }
  }
  const style = styles[type] || styles.info

  return (
    <div className={`${style.bg} border-2 ${style.border} rounded-xl p-6`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 ${style.iconBg} rounded-full flex items-center justify-center text-white text-xl flex-shrink-0`}>
          {style.icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${style.title} mb-2`}>{title}</h3>
          <p className="text-gray-700 mb-3">{description}</p>
          {action && (
            <div className="bg-white bg-opacity-50 rounded-lg p-3 border border-gray-200">
              <p className="text-sm font-semibold text-gray-900">💡 Recommended Action:</p>
              <p className="text-sm text-gray-700 mt-1">{action}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}