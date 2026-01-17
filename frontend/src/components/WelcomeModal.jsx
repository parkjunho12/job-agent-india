import { useState } from 'react'
import { X, ArrowRight, ArrowLeft, Sparkles, Target, CheckCircle } from 'lucide-react'

/**
 * WelcomeModal Component
 * 3-step introduction for first-time users
 */
function WelcomeModal({ onComplete, onSkip }) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      icon: <Sparkles className="w-16 h-16 text-primary-600" />,
      title: "Welcome to JobAgent! 👋",
      subtitle: "Stop Wasting Time on Jobs That Will Reject You",
      content: "Know your chances in 30 seconds. Apply only to jobs you'll actually get.",
      features: [
        "✅  Instant verdict on every job",
        "⚡  30-second analysis",
        "🎯  See exactly what to fix"
      ]
    },
    {
      icon: <Target className="w-16 h-16 text-success-600" />,
      title: "Here's How It Works",
      subtitle: "3 Simple Steps to Smart Job Applications",
      steps: [
        {
          number: "1",
          title: "Add a Job",
          description: "Paste any job description"
        },
        {
          number: "2",
          title: "Get Your Verdict",
          description: "AI analyzes in 30 seconds"
        },
        {
          number: "3",
          title: "Make Smart Decisions",
          description: "Apply, Skip, or Fix gaps"
        }
      ]
    },
    {
      icon: <CheckCircle className="w-16 h-16 text-success-600" />,
      title: "You're All Set! 🎉",
      subtitle: "Start with 3 Free Analyses",
      content: "No credit card required. See the value before you pay.",
      cta: "Let's get started!"
    }
  ]

  const currentStep = steps[step]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            {[0, 1, 2].map(i => (
              <div 
                key={i}
                className={`h-2 w-12 rounded-full transition-colors ${
                  i <= step ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <button 
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {currentStep.icon}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStep.title}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {currentStep.subtitle}
          </p>

          {/* Step 0: Features */}
          {step === 0 && (
            <div className="space-y-4 mb-8">
              <p className="text-lg text-gray-700 mb-6">
                {currentStep.content}
              </p>
              {currentStep.features.map((feature, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg text-left"
                >
                  <span className="text-2xl">{feature.split(' ')[0]}</span>
                  <span className="text-gray-800">{feature.slice(3)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step 1: How it works */}
          {step === 1 && (
            <div className="space-y-6 mb-8">
              {currentStep.steps.map((s, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-4 p-6 bg-gradient-to-r from-primary-50 to-success-50 rounded-xl text-left"
                >
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xl">
                    {s.number}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {s.title}
                    </h3>
                    <p className="text-gray-600">
                      {s.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Ready */}
          {step === 2 && (
            <div className="mb-8">
              <p className="text-lg text-gray-700 mb-6">
                {currentStep.content}
              </p>
              <div className="p-6 bg-gradient-to-r from-primary-500 to-success-500 rounded-xl text-white">
                <p className="text-2xl font-bold mb-2">3 Free Analyses</p>
                <p className="opacity-90">Try it risk-free. No payment needed.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button 
            onClick={handleBack}
            disabled={step === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              step === 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button 
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            Skip tour
          </button>

          <button 
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            {step < steps.length - 1 ? (
              <>
                Next
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                {currentStep.cta}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WelcomeModal