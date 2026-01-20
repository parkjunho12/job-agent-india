import { Zap, FileText, FileCheck, MessageSquare, ArrowRight } from 'lucide-react'

/**
 * QuickApplyCard Component
 * Shows for strong matches - encourages immediate application
 */
function QuickApplyCard({ job, onGenerateApplication }) {
  return (
    <div className="bg-gradient-to-br from-primary-50 to-success-50 border-4 border-primary-400 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-success-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            🚀 Ready to Apply?
          </h3>
          <p className="text-lg text-gray-700">
            This is a <strong className="text-success-600">strong match</strong>! 
            Generate your application now.
          </p>
        </div>
      </div>

      {/* What's Included Grid */}
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {/* Cover Letter */}
        <div className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">Cover Letter</p>
          <p className="text-xs text-gray-600">Tailored & compelling</p>
        </div>

        {/* CV Optimized */}
        <div className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileCheck className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">CV Optimized</p>
          <p className="text-xs text-gray-600">ATS-friendly format</p>
        </div>

        {/* Answers */}
        <div className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">
            {job.custom_questions?.length || 0} Answers
          </p>
          <p className="text-xs text-gray-600">Pre-filled responses</p>
        </div>
      </div>

      {/* CTA Button */}
      <button 
        onClick={onGenerateApplication}
        className="btn btn-primary w-full text-lg font-bold h-16 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all group"
      >
        <Zap className="w-6 h-6 group-hover:animate-pulse" />
        Generate Complete Application
        <span className="text-sm opacity-90">(2 min)</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Subtext */}
      <p className="text-xs text-gray-600 text-center mt-3">
        ✨ Includes cover letter, optimized CV, and pre-filled answers
      </p>
    </div>
  )
}

export default QuickApplyCard