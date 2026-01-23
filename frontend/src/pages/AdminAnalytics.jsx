import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, Users, Briefcase, Zap, CreditCard, 
  Target, Activity, Calendar, RefreshCw 
} from 'lucide-react'
import api from '../services/api'

function AdminAnalytics() {
  const [days, setDays] = useState(14)

  // Fetch overview metrics
  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['analytics-overview', days],
    queryFn: async () => {
      const response = await api.get(`/analytics/overview?days=${days}`)
      return response.data
    },
    refetchInterval: 60000 // Refresh every minute
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  const goals = overview?.goals || {}

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📊 Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Track your progress toward 2-week goals
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>

            <button
              onClick={() => refetch()}
              className="btn btn-outline flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Goal Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Goal 1: Signups */}
          <GoalCard
            icon={Users}
            title="New Signups"
            target={goals.signups?.target || 50}
            current={goals.signups?.current || 0}
            progress={goals.signups?.progress || 0}
            color="blue"
            subtitle={`Target: 50-100 users in ${days} days`}
          />

          {/* Goal 2: Free Usage */}
          <GoalCard
            icon={Activity}
            title="Free Usage Rate"
            target={goals.free_usage_rate?.target || 40}
            current={goals.free_usage_rate?.current || 0}
            progress={goals.free_usage_rate?.progress || 0}
            color="green"
            subtitle="Users using 1+ of 3 free analyses"
            unit="%"
          />

          {/* Goal 3: Conversion */}
          <GoalCard
            icon={CreditCard}
            title="Conversion Rate"
            target={goals.conversion_rate?.target || 5}
            current={goals.conversion_rate?.current || 0}
            progress={goals.conversion_rate?.progress || 0}
            color="purple"
            subtitle="Target: ≥ 5% paid conversion"
            unit="%"
          />
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={Users}
            label="Total Signups"
            value={overview?.total_signups || 0}
            color="blue"
          />
          
          <MetricCard
            icon={Briefcase}
            label="Total Analyses"
            value={overview?.total_analyses || 0}
            color="green"
          />
          
          <MetricCard
            icon={Zap}
            label="Total Conversions"
            value={overview?.total_conversions || 0}
            color="purple"
          />
          
          <MetricCard
            icon={CreditCard}
            label="Total Revenue"
            value={`£${(overview?.total_revenue || 0).toFixed(2)}`}
            color="success"
          />
        </div>

        {/* Engagement Metrics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            📈 Engagement Metrics
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600 mb-2">
                {overview?.active_users_7d || 0}
              </p>
              <p className="text-sm text-gray-600">Active Users (7d)</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-success-600 mb-2">
                {(overview?.avg_analyses_per_user || 0).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Avg Analyses per User</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {overview?.users_with_analysis || 0}
              </p>
              <p className="text-sm text-gray-600">Users with Analysis</p>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl border-2 border-primary-300 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                2-Week Goal Progress
              </h3>
              
              <div className="space-y-3">
                <ProgressItem
                  label="User Acquisition"
                  progress={goals.signups?.progress || 0}
                  current={goals.signups?.current || 0}
                  target={goals.signups?.target || 50}
                />
                
                <ProgressItem
                  label="Free Tier Engagement"
                  progress={goals.free_usage_rate?.progress || 0}
                  current={`${(goals.free_usage_rate?.current || 0).toFixed(1)}%`}
                  target={`${goals.free_usage_rate?.target || 40}%`}
                />
                
                <ProgressItem
                  label="Paid Conversion"
                  progress={goals.conversion_rate?.progress || 0}
                  current={`${(goals.conversion_rate?.current || 0).toFixed(2)}%`}
                  target={`${goals.conversion_rate?.target || 5}%`}
                />
              </div>

              {/* Overall Status */}
              <div className="mt-6 p-4 bg-white rounded-lg">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Overall Status:
                </p>
                {overview?.total_signups >= 50 && 
                 goals.free_usage_rate?.current >= 40 && 
                 goals.conversion_rate?.current >= 5 ? (
                  <p className="text-success-600 font-bold text-lg">
                    🎉 All goals achieved!
                  </p>
                ) : (
                  <p className="text-gray-700">
                    Keep going! You're making great progress.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Goal Card Component
function GoalCard({ icon: Icon, title, target, current, progress, color, subtitle, unit = '' }) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    success: 'from-success-500 to-success-600'
  }

  const achieved = progress >= 100

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-2xl p-6 text-white shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
        {achieved && (
          <span className="px-3 py-1 bg-white text-success-600 rounded-full text-xs font-bold">
            ✓ Achieved
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm opacity-90 mb-4">{subtitle}</p>

      <div className="mb-3">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold">
            {typeof current === 'number' && !unit ? current : current}
          </span>
          {unit && <span className="text-2xl">{unit}</span>}
          <span className="text-lg opacity-75">
            / {target}{unit}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
          <div 
            className="bg-white rounded-full h-3 transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <p className="text-sm font-semibold">
        {progress.toFixed(0)}% complete
      </p>
    </div>
  )
}

// Metric Card Component
function MetricCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    success: 'text-success-600 bg-success-50'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  )
}

// Progress Item Component
function ProgressItem({ label, progress, current, target }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {current} / {target}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${
            progress >= 100 ? 'bg-success-500' : 'bg-primary-500'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default AdminAnalytics