import { useEffect } from 'react'
import { CheckCircle, X, TrendingUp, Target, Sparkles } from 'lucide-react'

/**
 * SuccessToast Component
 * Celebration notifications for achievements
 */
function SuccessToast({ 
  show, 
  onClose, 
  type = 'success',
  title,
  message,
  action
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  const styles = {
    success: 'bg-success-50 border-success-200 text-success-800',
    achievement: 'bg-gradient-to-r from-primary-50 to-success-50 border-primary-300',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const icons = {
    success: <CheckCircle className="w-6 h-6 text-success-600" />,
    achievement: <Sparkles className="w-6 h-6 text-primary-600" />,
    info: <Target className="w-6 h-6 text-blue-600" />
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`${styles[type]} border-2 rounded-xl shadow-lg p-4 min-w-[320px] max-w-md`}>
        <div className="flex items-start gap-3">
          {icons[type]}
          
          <div className="flex-1">
            <h4 className="font-bold mb-1">{title}</h4>
            <p className="text-sm opacity-90">{message}</p>
            
            {action && (
              <button 
                onClick={action.onClick}
                className="text-sm font-semibold mt-2 hover:underline"
              >
                {action.label} →
              </button>
            )}
          </div>

          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Predefined Toast Messages
 */
export const toastMessages = {
  firstJob: {
    type: 'success',
    title: '🎉 First Job Added!',
    message: 'Great start! Now let\'s see if you should apply.',
    action: {
      label: 'Analyze Now',
      onClick: (navigate, jobId) => navigate(`/jobs/${jobId}`)
    }
  },
  
  firstVerdict: {
    type: 'achievement',
    title: '⚡ First Verdict Complete!',
    message: 'You just saved yourself from a potential rejection!',
    action: {
      label: 'View Stats',
      onClick: (navigate) => navigate('/stats')
    }
  },
  
  firstDecision: {
    type: 'success',
    title: '✅ Smart Decision!',
    message: 'You marked your first job. Keep making data-driven decisions!',
    action: {
      label: 'See Time Saved',
      onClick: (navigate) => navigate('/stats')
    }
  },
  
  fiveJobs: {
    type: 'achievement',
    title: '🏆 Achievement Unlocked!',
    message: '"Smart Searcher" - Analyzed 5 jobs. You\'re on a roll!',
    action: null
  },
  
  timeSaved: (hours) => ({
    type: 'achievement',
    title: `⏰ ${hours} Hours Saved!`,
    message: 'By skipping bad matches, you\'ve saved valuable time.',
    action: {
      label: 'View Full Stats',
      onClick: (navigate) => navigate('/stats')
    }
  }),
  
  strongMatch: {
    type: 'success',
    title: '🎯 Strong Match Found!',
    message: 'This job is perfect for you. Apply confidently!',
    action: {
      label: 'Apply Now',
      onClick: (navigate, jobId) => navigate(`/jobs/${jobId}/apply`)
    }
  },
  
  badJobAvoided: {
    type: 'info',
    title: '✋ Good Call!',
    message: 'You just avoided wasting 2 hours on a bad match.',
    action: null
  }
}

export default SuccessToast