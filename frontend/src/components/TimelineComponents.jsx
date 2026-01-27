import { Calendar, TrendingUp, Users, Zap, Target, DollarSign, ArrowUp, ArrowDown } from 'lucide-react'

// ============================================
// Timeline View
// ============================================

export function TimelineView({ timeline, timeRange }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No timeline data available yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">📅 Timeline View ({timeRange} days)</h2>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <TimelineChart data={timeline} />
      </div>

      {/* Daily Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Daily Breakdown</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {timeline.slice().reverse().slice(0, 14).map((day, idx) => (
            <DayRow key={idx} day={day} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TimelineChart({ data }) {
  const maxSignups = Math.max(...data.map(d => d.signups || 0), 1)
  const maxAnalyses = Math.max(...data.map(d => d.analyses || 0), 1)
  const maxRevenue = Math.max(...data.map(d => d.revenue || 0), 1)

  return (
    <div className="space-y-8">
      {/* Signups Chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Daily Signups
        </h4>
        <div className="flex items-end gap-1 h-32">
          {data.map((day, idx) => {
            const height = ((day.signups || 0) / maxSignups) * 100
            return (
              <div key={idx} className="flex-1 flex flex-col justify-end group">
                <div className="relative">
                  <div className="bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer" style={{ height: `${height}px` }} />
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                    {day.signups || 0} signups
                    <div className="text-xs text-gray-400">{day.date}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Analyses Chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Daily Analyses
        </h4>
        <div className="flex items-end gap-1 h-32">
          {data.map((day, idx) => {
            const height = ((day.analyses || 0) / maxAnalyses) * 100
            return (
              <div key={idx} className="flex-1 flex flex-col justify-end group">
                <div className="relative">
                  <div className="bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer" style={{ height: `${height}px` }} />
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                    {day.analyses || 0} analyses
                    <div className="text-xs text-gray-400">{day.date}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Revenue Chart */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Daily Revenue
        </h4>
        <div className="flex items-end gap-1 h-32">
          {data.map((day, idx) => {
            const height = ((day.revenue || 0) / maxRevenue) * 100
            return (
              <div key={idx} className="flex-1 flex flex-col justify-end group">
                <div className="relative">
                  <div className="bg-success-500 rounded-t hover:bg-success-600 transition-colors cursor-pointer" style={{ height: `${height}px` }} />
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                    ${(day.revenue || 0).toFixed(2)}
                    <div className="text-xs text-gray-400">{day.date}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DayRow({ day }) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-gray-900 min-w-[100px]">
            {new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">{day.signups || 0}</span>
              <span className="text-xs text-gray-500">signups</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-900">{day.analyses || 0}</span>
              <span className="text-xs text-gray-500">analyses</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">{day.conversions || 0}</span>
              <span className="text-xs text-gray-500">conversions</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success-600" />
              <span className="text-sm font-medium text-gray-900">${(day.revenue || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
        {day.conversion_rate !== undefined && (
          <div className="text-sm font-semibold text-primary-600">{day.conversion_rate.toFixed(1)}% CVR</div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Cohort Analysis
// ============================================

export function CohortAnalysis({ cohortData }) {
  const cohorts = cohortData?.cohorts || []
  const summary = cohortData?.summary || {}

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">👥 Cohort Analysis</h2>

      {/* Cohort Retention Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Retention Cohorts</h3>
        
        {cohorts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cohort</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Users</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Week 0</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Week 1</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Week 2</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Week 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cohorts.map((cohort, idx) => (
                  <CohortRow key={idx} cohort={cohort} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No cohort data available yet</div>
        )}
      </div>

      {/* Cohort Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Retention Insights</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Week 1 Retention</span>
              <span className="text-lg font-bold text-gray-900">{summary.avg_week_1_retention?.toFixed(1) || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Week 2 Retention</span>
              <span className="text-lg font-bold text-gray-900">{summary.avg_week_2_retention?.toFixed(1) || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Week 3 Retention</span>
              <span className="text-lg font-bold text-gray-900">{summary.avg_week_3_retention?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Cohort Performance</h4>
          <div className="space-y-3">
            {summary.avg_week_1_retention >= 75 && (
              <div className="p-3 bg-success-50 rounded-lg">
                <p className="text-sm font-semibold text-success-900">✓ Strong Week 1 retention ({summary.avg_week_1_retention.toFixed(1)}%)</p>
                <p className="text-xs text-success-700 mt-1">Most users return after initial signup</p>
              </div>
            )}
            {summary.avg_week_2_retention < 60 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-semibold text-yellow-900">⚠ Drop-off in Week 2-3</p>
                <p className="text-xs text-yellow-700 mt-1">Focus on re-engagement campaigns</p>
              </div>
            )}
            {!summary.avg_week_1_retention && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">No cohort data available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CohortRow({ cohort }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{cohort.cohort_week}</td>
      <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{cohort.users}</td>
      {cohort.retention.map((rate, idx) => (
        <td key={idx} className="px-4 py-3 text-center">
          {rate !== null ? (
            <div className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
              rate >= 80 ? 'bg-success-100 text-success-700' :
              rate >= 60 ? 'bg-yellow-100 text-yellow-700' :
              rate >= 40 ? 'bg-orange-100 text-orange-700' :
              'bg-red-100 text-red-700'
            }`}>
              {rate}%
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
      ))}
    </tr>
  )
}

// ============================================
// Deep Insights
// ============================================

export function DeepInsights({ metrics, funnel, timeline, advancedMetrics }) {
  const velocity = advancedMetrics?.velocity || {}
  const timeMetrics = advancedMetrics?.time_metrics || {}
  const revenueMetrics = advancedMetrics?.revenue_metrics || {}
  const growth = advancedMetrics?.growth || {}

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">🔬 Deep Insights</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Velocity Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Growth Velocity</h3>
          <div className="space-y-3">
            <VelocityMetric label="Signup Velocity" value={velocity.signup_velocity || 0} unit="per day" />
            <VelocityMetric label="Analysis Velocity" value={velocity.analysis_velocity || 0} unit="per day" />
            <VelocityMetric label="Conversion Velocity" value={velocity.conversion_velocity || 0} unit="per day" />
          </div>
        </div>

        {/* Time Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">⏱️ Time to Action</h3>
          <div className="space-y-3">
            <TimeMetric label="Signup → First Job" value={timeMetrics.avg_time_to_first_job || 0} unit="days" />
            <TimeMetric label="Job → First Analysis" value={timeMetrics.avg_time_to_first_analysis || 0} unit="days" />
            <TimeMetric label="Signup → Conversion" value={timeMetrics.avg_time_to_conversion || 0} unit="days" />
          </div>
        </div>

        {/* Revenue Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Revenue Insights</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenue per User</span>
              <span className="text-lg font-bold text-gray-900">${revenueMetrics.revenue_per_user?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lifetime Value (LTV)</span>
              <span className="text-lg font-bold text-gray-900">${revenueMetrics.ltv?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Growth Rate</span>
              <span className="text-lg font-bold text-gray-900">{growth.growth_rate?.toFixed(1) || '0.0'}%</span>
            </div>
          </div>
        </div>

        {/* Momentum Indicator */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🚀 Growth Momentum</h3>
          <div className="text-center py-6">
            <div className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${
              growth.momentum === 'accelerating' 
                ? 'bg-success-100 text-success-700'
                : growth.momentum === 'decelerating'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {growth.momentum === 'accelerating' && '📈 Accelerating'}
              {growth.momentum === 'decelerating' && '📉 Decelerating'}
              {growth.momentum === 'stable' && '➡️ Stable'}
              {!growth.momentum && '➡️ Stable'}
            </div>
            <p className="text-sm text-gray-600 mt-4">Based on recent 3-day vs previous 3-day comparison</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function VelocityMetric({ label, value, unit }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-gray-900">
          {value} <span className="text-sm font-normal text-gray-600">{unit}</span>
        </span>
      </div>
    </div>
  )
}

function TimeMetric({ label, value, unit }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-lg font-bold text-gray-900">
        {value} <span className="text-sm font-normal text-gray-600">{unit}</span>
      </span>
    </div>
  )
}