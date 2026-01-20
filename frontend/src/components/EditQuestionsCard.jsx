import { useState } from 'react'
import { MessageSquare, Plus, Trash2, Save, X, Sparkles, Lightbulb, GripVertical } from 'lucide-react'
import { jobsApi } from '../services/api'

/**
 * Final EditQuestionsCard Component
 * Uses PATCH /jobs/{id}/questions endpoint
 */
function EditQuestionsCard({ job, onSave, onCancel }) {
  const [questions, setQuestions] = useState(
    // Extract text from structured questions
    job.custom_questions?.map(q => 
      typeof q === 'string' ? q : q.text
    ) || []
  )
  const [newQuestion, setNewQuestion] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, newQuestion.trim()])
      setNewQuestion('')
    }
  }

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, idx) => idx !== index))
  }

  const handleUseExample = (example) => {
    setNewQuestion(example)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Call new PATCH endpoint
      const response = await jobsApi.updateQuestions(job.id, questions)
      
      // Success!
      if (onSave) {
        await onSave(response.data.questions)
      }
      
      alert(`✅ ${response.data.message}`)
      
    } catch (error) {
      console.error('Failed to save questions:', error)
      alert('❌ Failed to save questions. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const exampleQuestions = [
    "Why do you want to work at our company?",
    "What interests you about this role?",
    "Describe a challenging project you've worked on",
    "How do you handle tight deadlines?",
    "What's your greatest professional strength?"
  ]

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">
                Edit Custom Questions
              </h2>
              <p className="text-blue-100 text-sm">
                {questions.length === 0 
                  ? 'Add questions for AI to answer'
                  : `${questions.length} question${questions.length !== 1 ? 's' : ''} added`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Why Section */}
        <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">
                Why add questions?
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Many job applications ask custom questions. Add them here and our AI will generate 
                personalized, compelling answers based on your experience and the job requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Add Question Section */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            ➕ Add New Question
          </label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newQuestion.trim()) {
                    handleAddQuestion()
                  }
                }}
                placeholder="Type a question or click an example below..."
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900 placeholder-gray-400"
              />
              <button
                onClick={handleAddQuestion}
                disabled={!newQuestion.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary h-9 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Example Questions */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold text-gray-900">
              Quick Examples (click to use)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleUseExample(example)}
                className="text-sm px-3 py-2 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        {questions.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              📝 Your Questions ({questions.length})
            </h3>
            <div className="space-y-2">
              {questions.map((question, idx) => (
                <div
                  key={idx}
                  className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 text-gray-400 cursor-move mt-1">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    
                    {/* Number */}
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    
                    {/* Question Text */}
                    <p className="flex-1 text-gray-900 leading-relaxed">
                      {question}
                    </p>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleRemoveQuestion(idx)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6 text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">No questions added yet</p>
            <p className="text-sm text-gray-500">Add your first question above or click an example</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="flex-1 btn btn-outline h-12 text-base font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 btn btn-primary h-12 text-base font-semibold flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save {questions.length > 0 && `(${questions.length})`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditQuestionsCard