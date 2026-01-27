import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, TrendingUp, DollarSign, Activity, 
  Download, RefreshCw, ArrowUp, ArrowDown, 
  Target, Zap
} from 'lucide-react'
import api from '../services/api'
import { 
  AdvancedFunnelSection,
  EngagementDeepDive,
  RevenueAnalytics,
  AIInsightsSection
} from '../components/AdvancedAnalytics'
import {
  TimelineView,
  CohortAnalysis,
  DeepInsights
} from '../components/TimelineComponents'

function AdminDashboard() {
  const [timeRange, setTimeRange] = useState(14)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeView, setActiveView] = useState('overview')

  // Fetch overview data with trends
  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['admin-overview', timeRange],
    queryFn: async () => {
      const response = await api.get(`/analytics/overview?days=${timeRange}`)
      return response.data
    },
    refetchInterval: autoRefresh ? 60000 : false
  })

  // Fetch funnel data
  const { data: funnelData } = useQuery({
    queryKey: ['admin-funnel', timeRange],
    queryFn: async () => {
      const response = await api.get(`/analytics/funnel-details?days=${timeRange}`)
      return response.data
    },
    enabled: !isLoading
  })

  // Fetch timeline data
  const { data: timelineData } = useQuery({
    queryKey: ['admin-timeline', timeRange],
    queryFn: async () => {
      const response = await api.get(`/analytics/timeline?days=${timeRange}`)
      return response.data
    }
  })

  // Fetch realtime status
  const { data: realtimeStatus } = useQuery({
    queryKey: ['admin-realtime'],
    queryFn: async () => {
      const response = await api.get('/analytics/realtime-status')
      return response.data
    },
    refetchInterval: autoRefresh ? 60000 : false
  })

  // Fetch advanced metrics
  const { data: advancedMetrics } = useQuery({
    queryKey: ['admin-advanced', timeRange],
    queryFn: async () => {
      const response = await api.get(`/analytics/advanced-metrics?days=${timeRange}`)
      return response.data
    }
  })

  // Fetch cohorts
  const { data: cohortData } = useQuery({
    queryKey: ['admin-cohorts'],
    queryFn: async () => {
      const response = await api.get('/analytics/cohorts?weeks=4')
      return response.data
    },
    enabled: activeView === 'cohorts'
  })

  if (isLoading) {
    return <LoadingScreen />
  }

  const metrics = overview || {}
  const goals = metrics.goals || {}
  const trends = metrics.trends || {}
  const funnel = funnelData || {}
  const timeline = timelineData || []
  const realtime = realtimeStatus || {}
  const advanced = advancedMetrics || {}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader 
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        refetch={refetch}
        activeView={activeView}
        setActiveView={setActiveView}
        overview={overview}
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {activeView === 'overview' && (
          <>
            {/* Real-time Status Bar */}
            <RealtimeStatusBar realtime={realtime} trends={trends} />

            {/* Goal Progress */}
            <GoalProgressSection goals={goals} trends={trends} />

            {/* Key Metrics with Sparklines */}
            <KeyMetricsWithCharts 
              metrics={metrics} 
              trends={trends}
              timeline={timeline}
            />

            {/* Advanced Funnel */}
            <AdvancedFunnelSection 
              funnel={funnel} 
              metrics={metrics}
              timeline={timeline}
            />

            {/* Engagement Deep Dive */}
            <EngagementDeepDive 
              metrics={metrics}
              advancedMetrics={advanced?.scores || {}}
            />

            {/* Revenue Analytics */}
            <RevenueAnalytics 
              metrics={metrics}
              timeline={timeline}
            />

            {/* AI Insights */}
            <AIInsightsSection 
              metrics={metrics}
              goals={goals}
              funnel={funnel}
              advancedMetrics={advanced?.scores || {}}
            />
          </>
        )}

        {activeView === 'timeline' && (
          <TimelineView timeline={timeline} timeRange={timeRange} />
        )}

        {activeView === 'cohorts' && (
          <CohortAnalysis cohortData={cohortData} />
        )}

        {activeView === 'insights' && (
          <DeepInsights 
            metrics={metrics}
            funnel={funnel}
            timeline={timeline}
            advancedMetrics={advanced}
          />
        )}
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    </div>
  )
}

function DashboardHeader({ 
  timeRange, 
  setTimeRange, 
  autoRefresh, 
  setAutoRefresh, 
  refetch, 
  activeView, 
  setActiveView,
  overview 
}) {
  const handleExport = () => {
    const data = {
      exported_at: new Date().toISOString(),
      time_range: timeRange,
      data: overview
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time analytics and insights</p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                autoRefresh ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {autoRefresh ? '● Live' : '○ Paused'}
            </button>

            <button onClick={refetch} className="btn btn-outline flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            <button onClick={handleExport} className="btn btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {['overview', 'timeline', 'cohorts', 'insights'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === view
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function RealtimeStatusBar({ realtime, trends }) {
  return (
    <div className="bg-gradient-to-r from-primary-500 to-blue-600 rounded-xl p-6 text-white">
      <div className="grid grid-cols-4 gap-6">
        <StatusItem label="Active Now" value={realtime.active_users_now || 0} icon={Activity} />
        <StatusItem label="Today's Signups" value={realtime.today_signups || 0} trend={trends.signups || 0} icon={Users} />
        <StatusItem label="Today's Analyses" value={realtime.today_analyses || 0} icon={Zap} />
        <StatusItem label="System Health" value={`${realtime.system_health || 0}%`} icon={Target} positive />
      </div>
    </div>
  )
}

function StatusItem({ label, value, trend, icon: Icon, positive }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm opacity-90">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend !== undefined && trend !== 0 && (
            <span className="text-sm flex items-center gap-1 opacity-90">
              {trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(trend).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function GoalProgressSection({ goals, trends }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 2-Week Goals Progress</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <GoalProgressCard title="User Acquisition" subtitle="50-100 signups target" current={goals.signups?.current || 0} target={goals.signups?.target || 50} maxTarget={100} progress={goals.signups?.progress || 0} icon={Users} color="blue" trend={trends.signups || 0} />
        <GoalProgressCard title="Free Tier Engagement" subtitle="Users using 1+ analyses" current={goals.free_usage_rate?.current || 0} target={goals.free_usage_rate?.target || 40} progress={goals.free_usage_rate?.progress || 0} icon={Activity} color="green" trend={trends.engagement || 0} isPercentage />
        <GoalProgressCard title="Paid Conversion" subtitle="Signup to paid rate" current={goals.conversion_rate?.current || 0} target={goals.conversion_rate?.target || 5} progress={goals.conversion_rate?.progress || 0} icon={DollarSign} color="purple" trend={trends.conversion || 0} isPercentage />
      </div>
    </section>
  )
}

function GoalProgressCard({ title, subtitle, current, target, maxTarget, progress, icon: Icon, color, trend, isPercentage }) {
  const colorMap = { blue: 'from-blue-500 to-blue-600', green: 'from-green-500 to-green-600', purple: 'from-purple-500 to-purple-600' }
  const achieved = progress >= 100

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
      <div className={`bg-gradient-to-r ${colorMap[color]} p-6 text-white`}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          {achieved && <span className="px-3 py-1 bg-white text-success-600 rounded-full text-xs font-bold">✓ Achieved</span>}
        </div>
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        <p className="text-sm opacity-90">{subtitle}</p>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-gray-900">{isPercentage ? current.toFixed(1) : current}</span>
            {isPercentage && <span className="text-2xl text-gray-600">%</span>}
            <span className="text-lg text-gray-500">/ {target}{isPercentage ? '%' : ''} {maxTarget && `- ${maxTarget}`}</span>
          </div>
          {trend !== undefined && trend !== 0 && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend > 0 ? 'text-success-600' : 'text-red-600'}`}>
              {trend > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span>{Math.abs(trend).toFixed(0)}% vs last period</span>
            </div>
          )}
        </div>
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all duration-500 ${achieved ? 'bg-success-500' : `bg-gradient-to-r ${colorMap[color]}`}`} style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-700">{progress.toFixed(1)}% complete</p>
      </div>
    </div>
  )
}

function KeyMetricsWithCharts({ metrics, trends, timeline }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Key Metrics</h2>
      <div className="grid md:grid-cols-4 gap-6">
        <MetricCardWithSparkline label="Total Signups" value={metrics.total_signups || 0} change={trends.signups_change || 0} icon={Users} color="blue" data={timeline?.map(d => d.signups || 0) || []} />
        <MetricCardWithSparkline label="Total Analyses" value={metrics.total_analyses || 0} change={trends.analyses_change || 0} icon={Zap} color="green" data={timeline?.map(d => d.analyses || 0) || []} />
        <MetricCardWithSparkline label="Conversions" value={metrics.total_conversions || 0} change={trends.conversions_change || 0} icon={Target} color="purple" data={timeline?.map(d => d.conversions || 0) || []} />
        <MetricCardWithSparkline label="Revenue" value={`$${(metrics.total_revenue || 0).toFixed(2)}`} change={trends.revenue_change || 0} icon={DollarSign} color="success" data={timeline?.map(d => d.revenue || 0) || []} />
      </div>
    </section>
  )
}

function MetricCardWithSparkline({ label, value, change, icon: Icon, color, data }) {
  const colorMap = { blue: 'text-blue-600 bg-blue-50', green: 'text-green-600 bg-green-50', purple: 'text-purple-600 bg-purple-50', success: 'text-success-600 bg-success-50' }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && change !== 0 && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${change > 0 ? 'text-success-600' : 'text-red-600'}`}>
            {change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(change).toFixed(0)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600 mb-4">{label}</p>
      <div className="h-12"><Sparkline data={data} color={color} /></div>
    </div>
  )
}

function Sparkline({ data, color }) {
  if (!data || data.length === 0) return <div className="h-full bg-gray-100 rounded" />
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')
  const colorMap = { blue: '#3b82f6', green: '#10b981', purple: '#8b5cf6', success: '#10b981' }
  return (
    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
      <polyline points={points} fill="none" stroke={colorMap[color] || '#3b82f6'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default AdminDashboard