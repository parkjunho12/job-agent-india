import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, CheckCircle, Circle, ArrowRight } from 'lucide-react'
import api from '../services/api'

/**
 * OnboardingChecklist Component
 * Shows progress of getting started tasks
 */
function OnboardingChecklist() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState(false)

  // Check if dismissed
  useEffect(() => {
    const isDismissed = localStorage.getItem('onboarding_checklist_dismissed')
    if (isDismissed) {
      setDismissed(true)
    }
  }, [])

  // Fetch user progress
  const { data: stats } = useQuery({
    queryKey: ['stats', 'decisions'],
    queryFn: () => api.get('/analysis/stats/decisions').then(res => res.data)
  })

  const { data: jobsData } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs').then(res => res.data)
  })

  const jobs = jobsData?.data || []

  // Define checklist steps
  const steps = [
    {
      id: 'add_job',
      title: 'Add your first job',
      description: 'Copy & paste a job description',
      completed: jobs.length > 0,
      action: () => navigate('/jobs'),
      icon: '📝'
    },
    {
      id: 'get_verdict',
      title: 'Get your first verdict',
      description: 'See if you should apply',
      completed: stats?.total_analyzed > 0,
      action: null,
      icon: '⚡'
    },
    {
      id: 'make_decision',
      title: 'Mark your first decision',
      description: 'Apply, Skip, or Save a job',
      completed: stats?.applied > 0 || stats?.skipped > 0,
      action: null,
      icon: '🎯'
    },
    {
      id: 'view_stats',
      title: 'Check your stats',
      description: 'See time saved & bad jobs avoided',
      completed: false, // Always show this
      action: () => navigate('/stats'),
      icon: '📊'
    }
  ]

  const completedCount = steps.filter(s => s.completed).length
  const totalSteps = steps.length
  const progress = (completedCount / totalSteps) * 100

  // Auto-hide when all complete
  const allComplete = completedCount === totalSteps

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('onboarding_checklist_dismissed', 'true')
  }

  // Don't show if dismissed or all complete
  if (dismissed || allComplete) return null

  return (
    <div className="bg-gradient-to-r from-primary-50 to-success-50 border-2 border-primary-200 rounded-xl shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Getting Started 🚀
          </h3>
          <p className="text-sm text-gray-600">
            {completedCount} of {totalSteps} completed
          </p>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary-600 to-success-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map(step => (
          <div 
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              step.completed 
                ? 'bg-white bg-opacity-50' 
                : 'bg-white hover:shadow-md cursor-pointer'
            }`}
            onClick={step.action && !step.completed ? step.action : undefined}
          >
            {/* Icon & Checkbox */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">{step.icon}</span>
              {step.completed ? (
                <CheckCircle className="w-6 h-6 text-success-600" />
              ) : (
                <Circle className="w-6 h-6 text-gray-300" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <h4 className={`font-semibold ${
                step.completed ? 'text-gray-500 line-through' : 'text-gray-900'
              }`}>
                {step.title}
              </h4>
              <p className="text-sm text-gray-600">
                {step.description}
              </p>
            </div>

            {/* Action Button */}
            {!step.completed && step.action && (
              <button 
                onClick={step.action}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                Do now
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {progress > 75 && (
        <div className="mt-4 p-4 bg-success-100 border border-success-300 rounded-lg text-center">
          <p className="text-success-800 font-semibold">
            🎉 Almost there! Just {totalSteps - completedCount} more step{totalSteps - completedCount > 1 ? 's' : ''} to go!
          </p>
        </div>
      )}
    </div>
  )
}

export default OnboardingChecklist