import { X, Edit, CheckCircle } from 'lucide-react'

/**
 * QuestionAnswersModal Component
 * Modal to view and edit question answers
 */
function QuestionAnswersModal({ questions, answers, onClose, onEdit }) {
  if (!questions || questions.length === 0) return null

  const getAnswerValue = (question, idx) => {
    const byId = question?.id != null ? answers?.[question.id] : undefined
    const byIdx = Array.isArray(answers) ? answers[idx] : undefined
    return byId ?? byIdx
  }

  function parseAnswerPayload(v) {
        // v가 이미 객체면 그대로
        if (v && typeof v === "object") return v
    
        // v가 문자열인데 JSON 문자열일 가능성
        if (typeof v === "string") {
        try {
            const parsed = JSON.parse(v)
            if (parsed && typeof parsed === "object") return parsed
        } catch {}
        // 그냥 일반 텍스트 답변이라면 answer로 감싸기
        return { answer: v }
        }
    
        // 그 외
        if (typeof v === "number") return { answer: String(v) }
        return { answer: "" }
    }
    
    function AnswerCard({ data }) {
        const answerText = data?.answer ?? ""
        const evidence = Array.isArray(data?.evidence) ? data.evidence : []
        const experiencesUsed = Array.isArray(data?.experiences_used) ? data.experiences_used : []
        const confidence = typeof data?.confidence === "number" ? data.confidence : null
    
        const confidencePct = confidence == null ? null : Math.round(confidence * 100)
    
        return (
        <div className="space-y-4">
            {/* Main answer */}
            <div>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {answerText || "Not answered yet"}
            </p>
            </div>
    
            {/* Evidence */}
            {evidence.length > 0 && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Evidence</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                {evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                ))}
                </ul>
            </div>
            )}
    
            {/* Footer metadata */}
            <div className="flex flex-wrap items-center gap-2">
            {confidencePct != null && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-700">
                Confidence: {confidencePct}%
                </span>
            )}
    
            {experiencesUsed.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">Experiences used:</span>
                {experiencesUsed.map((id) => (
                    <span
                    key={id}
                    className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                    >
                    #{id}
                    </span>
                ))}
                </div>
            )}
            </div>
        </div>
        )
    }
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              💬 Your Answers ({questions.length} questions)
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
          <div className="space-y-6">
            {questions.map((question, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                {/* Question */}
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">Question {idx + 1}</p>
                    <p className="text-gray-700">
                    {typeof question === 'string' ? question : (question?.text ?? '(No question text)')}
                    </p>
                  </div>
                </div>

                {/* Answer */}
                <div className="ml-11 bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Your Answer:</p>
                  <AnswerCard data={parseAnswerPayload(getAnswerValue(question, idx))} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              Close
            </button>
            {onEdit && (
                <button 
                    
                    onClick={onEdit} 
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                    <Edit className="w-4 h-4" />
                    Edit Answers
                </button>
            )
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionAnswersModal