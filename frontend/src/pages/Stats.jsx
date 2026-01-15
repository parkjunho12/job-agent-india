import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, TrendingDown, Clock, Target, 
  CheckCircle, XCircle, AlertTriangle, BarChart3 
} from 'lucide-react'
import api from '../services/api'

/**
 * Stats Page - Phase 2
 * 
 * Shows user decision statistics
 * Emphasizes "time saved" and "bad jobs avoided"
 */
function Stats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'decisions'],
    queryFn: () => api.get('/analysis/stats/decisions').then(res => res.data)
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-primary-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your stats...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const conversionRate = stats.total_analyzed > 0 
    ? Math.round((stats.applied / stats.total_analyzed) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-500 to-success-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Your Job Search Stats</h1>
          <p className="text-xl opacity-90">
            See how Decision AI is saving your time
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Stats - Time Saved */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Time Saved - BIG HIGHLIGHT */}
          <div className="bg-gradient-to-br from-success-50 to-success-100 border-4 border-success-500 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg text-gray-700 font-semibold">Time Saved</h2>
                <p className="text-5xl font-bold text-success-700">
                  {stats.time_saved_hours}hrs
                </p>
              </div>
            </div>
            <p className="text-gray-700">
              By skipping <strong>{stats.high_risk_avoided}</strong> bad jobs that would've wasted your time
            </p>
          </div>

          {/* Bad Jobs Avoided */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-4 border-red-500 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <TrendingDown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg text-gray-700 font-semibold">Bad Jobs Skipped</h2>
                <p className="text-5xl font-bold text-red-700">
                  {stats.high_risk_avoided}
                </p>
              </div>
            </div>
            <p className="text-gray-700">
              High rejection risk jobs you avoided applying to
            </p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Total Analyzed */}
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-6 h-6 text-primary-600" />
              <h3 className="font-bold text-gray-900">Analyzed</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total_analyzed}</p>
            <p className="text-sm text-gray-600 mt-1">Total jobs analyzed</p>
          </div>

          {/* Applied */}
          <div className="bg-white rounded-xl p-6 border-2 border-success-200">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-success-600" />
              <h3 className="font-bold text-gray-900">Applied</h3>
            </div>
            <p className="text-3xl font-bold text-success-700">{stats.applied}</p>
            <p className="text-sm text-gray-600 mt-1">
              {stats.strong_matches_applied} strong matches
            </p>
          </div>

          {/* Skipped */}
          <div className="bg-white rounded-xl p-6 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="w-6 h-6 text-red-600" />
              <h3 className="font-bold text-gray-900">Skipped</h3>
            </div>
            <p className="text-3xl font-bold text-red-700">{stats.skipped}</p>
            <p className="text-sm text-gray-600 mt-1">Avoided wasting time</p>
          </div>

          {/* Saved */}
          <div className="bg-white rounded-xl p-6 border-2 border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="font-bold text-gray-900">Saved</h3>
            </div>
            <p className="text-3xl font-bold text-orange-700">{stats.saved}</p>
            <p className="text-sm text-gray-600 mt-1">For later review</p>
          </div>
        </div>

        {/* Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Conversion Rate */}
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Your Conversion Rate
            </h3>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Applications to Analysis</span>
                <span className="font-bold text-2xl text-primary-600">{conversionRate}%</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-success-500"
                  style={{ width: `${conversionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                {conversionRate >= 60 ? (
                  <>
                    <span className="text-success-600 font-bold">Excellent!</span> You're being selective and applying to quality matches.
                  </>
                ) : conversionRate >= 30 ? (
                  <>
                    <span className="text-primary-600 font-bold">Good!</span> You're filtering out bad matches effectively.
                  </>
                ) : (
                  <>
                    <span className="text-orange-600 font-bold">Great!</span> You're avoiding lots of bad matches.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Average Match Score */}
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Average Match Quality
            </h3>
            
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary-100 to-success-100 mb-3">
                <span className="text-4xl font-bold text-primary-700">
                  {stats.average_match_score}%
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                {stats.average_match_score >= 70 ? (
                  <>
                    <span className="text-success-600 font-bold">Strong!</span> You're analyzing jobs that match your profile well.
                  </>
                ) : stats.average_match_score >= 50 ? (
                  <>
                    <span className="text-orange-600 font-bold">Moderate.</span> Consider focusing on better-matched roles.
                  </>
                ) : (
                  <>
                    <span className="text-red-600 font-bold">Low.</span> Many jobs don't match your profile - that's okay, we're saving you time!
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {stats.total_analyzed === 0 && (
          <div className="mt-8 bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Start Analyzing Jobs
            </h3>
            <p className="text-gray-700 mb-6">
              Add a job and see your verdict in 30 seconds
            </p>
            <button 
              onClick={() => window.location.href = '/jobs'}
              className="btn btn-primary btn-lg"
            >
              Analyze Your First Job
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Stats