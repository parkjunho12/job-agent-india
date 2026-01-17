import { Briefcase, Target, TrendingUp, ArrowRight } from 'lucide-react'

/**
 * EmptyState Component
 * Better empty states with clear CTAs
 */

// No Jobs Empty State
export function NoJobsEmptyState({ onAddJob }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="mb-8">
        <Briefcase className="w-24 h-24 text-gray-300 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          No Jobs Saved Yet
        </h2>
        <p className="text-lg text-gray-600">
          Let's find out which jobs you should apply to!
        </p>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-br from-primary-50 to-success-50 rounded-2xl p-8 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Here's how it works:
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-3">
              1
            </div>
            <h4 className="font-bold text-gray-900">Find a Job</h4>
            <p className="text-sm text-gray-600">
              On LinkedIn, Naukri, or any job board
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-3">
              2
            </div>
            <h4 className="font-bold text-gray-900">Add to JobAgent</h4>
            <p className="text-sm text-gray-600">
              Paste the job description (takes 10 seconds)
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-3">
              3
            </div>
            <h4 className="font-bold text-gray-900">Get Your Verdict</h4>
            <p className="text-sm text-gray-600">
              AI analyzes in 30 seconds - Apply or Skip!
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button 
        onClick={onAddJob}
        className="btn btn-primary btn-lg inline-flex items-center gap-2"
      >
        <Briefcase className="w-5 h-5" />
        Add Your First Job
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Try Demo */}
      <div className="mt-6">
        <a 
          href="/demo" 
          className="text-primary-600 hover:underline font-medium inline-flex items-center gap-2"
        >
          Or try a demo job first →
        </a>
      </div>
    </div>
  )
}

// No Analysis Empty State
export function NoAnalysisEmptyState({ onAnalyze, isLoading }) {
  return (
    <div className="max-w-xl mx-auto text-center py-12">
      <Target className="w-20 h-20 text-gray-300 mx-auto mb-6" />
      
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Analysis Not Started
      </h2>
      <p className="text-gray-600 mb-8">
        Click below to see if you should apply to this job
      </p>

      {/* What You'll Get */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
        <p className="font-semibold text-gray-900 mb-4">You'll get:</p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-medium text-gray-900">Clear Verdict</p>
              <p className="text-sm text-gray-600">Apply / Skip / Fix gaps first</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <p className="font-medium text-gray-900">ATS Check</p>
              <p className="text-sm text-gray-600">Will you pass the initial filter?</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <p className="font-medium text-gray-900">Match %</p>
              <p className="text-sm text-gray-600">How well do you fit?</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="font-medium text-gray-900">What to Fix</p>
              <p className="text-sm text-gray-600">Specific improvements needed</p>
            </div>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <button 
        onClick={onAnalyze}
        disabled={isLoading}
        className="btn btn-primary btn-lg inline-flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="spinner-sm" />
            Analyzing...
          </>
        ) : (
          <>
            <Target className="w-5 h-5" />
            Analyze This Job
            <span className="text-sm opacity-90">(30 seconds)</span>
          </>
        )}
      </button>

      {/* Trust Badge */}
      <p className="text-sm text-gray-500 mt-4">
        🔒 Your data is secure • No credit card needed
      </p>
    </div>
  )
}

// No Stats Empty State
export function NoStatsEmptyState() {
  return (
    <div className="max-w-xl mx-auto text-center py-12">
      <TrendingUp className="w-20 h-20 text-gray-300 mx-auto mb-6" />
      
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        No Stats Yet
      </h2>
      <p className="text-gray-600 mb-8">
        Analyze some jobs to see your time saved and success rate
      </p>

      <div className="bg-gradient-to-br from-primary-50 to-success-50 rounded-xl p-8 mb-8">
        <p className="text-gray-800 mb-4">
          <strong>Once you start analyzing jobs, you'll see:</strong>
        </p>
        <ul className="space-y-2 text-left text-gray-700">
          <li>⏰ Time saved by avoiding bad matches</li>
          <li>❌ Bad jobs you skipped</li>
          <li>✅ Your application success rate</li>
          <li>📊 Match quality over time</li>
        </ul>
      </div>

      <a 
        href="/jobs" 
        className="btn btn-primary inline-flex items-center gap-2"
      >
        Go to Jobs
        <ArrowRight className="w-5 h-5" />
      </a>
    </div>
  )
}

// Generic Empty State
export function EmptyState({ 
  icon: Icon = Briefcase,
  title = "No data yet",
  description = "Get started by adding some data",
  actionLabel = "Get Started",
  onAction
}) {
  return (
    <div className="max-w-xl mx-auto text-center py-12">
      <Icon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
      <p className="text-gray-600 mb-8">{description}</p>
      
      {onAction && (
        <button 
          onClick={onAction}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          {actionLabel}
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export default EmptyState