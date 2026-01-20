import { X, Copy, Download, Edit, CheckCircle } from 'lucide-react'
import { useState } from 'react'

/**
 * CoverLetterModal Component
 * Modal to view, edit, copy, and download cover letter
 */
function CoverLetterModal({ letter, onClose, onEdit }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    // Create text file
    const blob = new Blob([letter], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cover-letter.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!letter) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              📝 Your Cover Letter
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-ghost p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="prose prose-sm max-w-none">
              {letter.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4 text-gray-800 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
            <button 
              onClick={handleCopy} 
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
            <button 
              onClick={handleDownload} 
              className="btn btn-secondary flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            {onEdit && (
                <button 
                onClick={onEdit} 
                className="btn btn-primary flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )
            }
            <button 
              onClick={onClose} 
              className="btn btn-outline flex items-center justify-center gap-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoverLetterModal