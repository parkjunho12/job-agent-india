import { CheckCircle, Eye, RefreshCw, Zap, Loader, Info } from 'lucide-react'

/**
 * Enhanced GenerationCard Component
 * Better messaging for disabled states
 */
function GenerationCard({ 
  icon: Icon, 
  title, 
  description, 
  status = 'not-started', // 'not-started' | 'generating' | 'ready'
  time,
  onGenerate,
  onView,
  disabled = false,
  disabledMessage = null, // Custom message when disabled
  badge = null
}) {
  const statusStyles = {
    'not-started': {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      button: 'btn-primary'
    },
    'generating': {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      button: 'btn-disabled'
    },
    'ready': {
      bg: 'bg-success-50',
      border: 'border-success-200',
      button: 'btn-success'
    }
  }

  const style = statusStyles[status] || statusStyles['not-started']

  return (
    <div className={`${style.bg} border-2 ${style.border} rounded-xl p-4 relative transition-all hover:shadow-md`}>
      {/* Badge */}
      {badge && (
        <span className="absolute top-2 right-2 px-2 py-1 bg-primary-500 text-white text-xs font-bold rounded">
          {badge}
        </span>
      )}

      {/* Icon & Title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      {/* Status & Time */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-600 font-medium">
          ⏱️ {time}
        </span>
        {status === 'ready' && (
          <span className="flex items-center gap-1 text-xs text-success-600 font-semibold">
            <CheckCircle className="w-4 h-4" />
            Ready
          </span>
        )}
        {status === 'generating' && (
          <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
            <Loader className="w-4 h-4 animate-spin" />
            Generating...
          </span>
        )}
      </div>

      {/* Action Buttons */}
      {status === 'not-started' && !disabled && (
        <button 
          onClick={onGenerate}
          className={`${style.button} w-full text-sm h-10 flex items-center justify-center gap-2`}
        >
          <Zap className="w-4 h-4" />
          Generate
        </button>
      )}

      {status === 'generating' && (
        <button disabled className="btn btn-disabled w-full text-sm h-10 flex items-center justify-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          Generating...
        </button>
      )}

      {status === 'ready' && (
        <div className="flex gap-2">
          <button 
            onClick={onView} 
            className="btn btn-secondary flex-1 text-sm h-10 flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <button 
            onClick={onGenerate} 
            className="btn btn-outline h-10 px-3 flex items-center justify-center"
            title="Regenerate"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Enhanced Disabled State */}
      {disabled && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-95 rounded-xl flex flex-col items-center justify-center backdrop-blur-sm p-4">
          <Info className="w-6 h-6 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 font-medium text-center">
            {disabledMessage || 'Not applicable'}
          </p>
        </div>
      )}
    </div>
  )
}

export default GenerationCard