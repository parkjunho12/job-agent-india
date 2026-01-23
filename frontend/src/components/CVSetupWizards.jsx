
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, User, ArrowRight, ArrowLeft, X, CheckCircle, Loader } from 'lucide-react'
import { experiencesApi, cvApi } from '../services/api'

/**
 * CVSetupWizard Component
 * Critical first step - get user's CV/experience before job analysis
 */
function CVSetupWizard({ onComplete, onSkip }) {
  const [step, setStep] = useState(0) // 0: choose method, 1: input, 2: summary
  const [method, setMethod] = useState(null) // 'upload' | 'manual' | null
  const [experiences, setExperiences] = useState([])

  const queryClient = useQueryClient()
  const { data: experiencesData } = useQuery({
    queryKey: ['experiences'],
    queryFn: () => experiencesApi.getAll()
  })
  
  const queryData = experiencesData?.data || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Progress Bar */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-2">
            {[0, 1, 2].map(i => (
              <div 
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Step {step + 1} of 3: {
              step === 0 ? 'Choose method' :
              step === 1 ? 'Add your profile' :
              'Review & continue'
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 0 && (
            <ChooseMethod 
              onUpload={() => { setMethod('upload'); setStep(1) }}
              onManual={() => { setMethod('manual'); setStep(1) }}
              onDemo={onSkip}
            />
          )}
          
          {step === 1 && method === 'upload' && (
            <CVUpload 
              onComplete={() => {
                queryClient.invalidateQueries(['experiences'])
                setExperiences(queryData)
                setStep(2)
              }}
              onBack={() => setStep(0)}
            />
          )}
          
          {step === 1 && method === 'manual' && (
            <QuickExperienceForm 
              onComplete={(exp) => {
                setExperiences([exp])
                setStep(2)
              }}
              onBack={() => setStep(0)}
            />
          )}
          
          {step === 2 && (
            <ProfileSummary 
              experiences={queryData.length > 0 ? queryData : experiences}
              onComplete={onComplete}
              onBack={() => setStep(1)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Step 0: Choose Method
 */
function ChooseMethod({ onUpload, onManual, onDemo }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Before We Start... 🎯
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        To give you accurate verdicts, we need to know about <strong>YOUR</strong> experience.
      </p>

      <div className="space-y-4 mb-6">
        {/* Upload CV */}
        <button 
          onClick={onUpload}
          className="w-full p-6 border-2 border-primary-300 rounded-xl hover:bg-primary-50 hover:border-primary-400 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                📄 Upload Your CV
              </h3>
              <p className="text-sm text-gray-600">
                We'll extract your experience automatically (PDF, DOCX)
              </p>
              <p className="text-xs text-primary-600 mt-1 font-medium">
                ⚡ Fastest method - takes 30 seconds
              </p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        {/* Manual Entry */}
        <button 
          onClick={onManual}
          className="w-full p-6 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-7 h-7 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                ✍️ Add Experience Manually
              </h3>
              <p className="text-sm text-gray-600">
                Quick form - just your most recent experience
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Takes 2-3 minutes
              </p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>

      {/* Why This Matters */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>💡 Why we need this:</strong> Without your profile, we can only give generic advice. 
          With your experience, we can tell you exactly if YOU should apply to each job.
        </p>
      </div>

      {/* Skip Option */}
      <div className="text-center pt-4 border-t">
        <button 
          onClick={onDemo}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
          Skip for now - Use demo profile (not recommended)
        </button>
      </div>
    </div>
  )
}

/**
 * Step 1a: CV Upload
 */
function CVUpload({ onComplete, onBack }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileSelect = async (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setUploading(true)
    setError(null)

    try {

      const response = await cvApi.parseAndSave(uploadedFile)
      
      onComplete(response.data)
    } catch (err) {
        console.error('CV upload failed:', err)
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
      setUploading(false)
    }
  }

  return (
    <div>
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Upload Your CV
      </h2>
      
      {!file || error ? (
        <>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary-400 transition-colors">
            <Upload className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-700 mb-2">
              Drag & drop your CV here
            </p>
            <p className="text-sm text-gray-500 mb-6">
              or click below to browse
            </p>
            <input 
              type="file" 
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="cv-upload"
            />
            <label 
              htmlFor="cv-upload" 
              className="btn btn-primary btn-lg cursor-pointer inline-flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Choose File
            </label>
            <p className="text-xs text-gray-500 mt-4">
              Supports PDF, DOC, DOCX • Max 5MB
            </p>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </>
      ) : uploading ? (
        <div className="text-center py-16">
          <Loader className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Analyzing Your CV...
          </h3>
          <p className="text-gray-600">
            This takes about 30 seconds. We're extracting your experiences, skills, and achievements.
          </p>
          
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
              <Loader className="w-5 h-5 text-primary-600 animate-spin" />
              <span className="text-sm text-gray-700">Parsing document...</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
              <Loader className="w-5 h-5 text-primary-600 animate-spin" />
              <span className="text-sm text-gray-700">Extracting work experience...</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Loader className="w-5 h-5 text-primary-600 animate-spin" />
              <span className="text-sm text-gray-700">Identifying skills...</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Step 1b: Quick Experience Form
 */
function QuickExperienceForm({ onComplete, onBack }) {
  const [form, setForm] = useState({
    type: 'work',
    title: '',
    organization: '',
    location: '',
    is_current: false,
    skills_used: '',
    achievements: '',
    description: '',
    start_date: '',
    end_date: ''
  })

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      
        const experience = {
            ...form,
            start_date: new Date(form.start_date).toISOString(),
            end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
            achievements: form.achievements.split('\n').filter(a => a.trim()),
            skills_used: form.skills_used.split(',').map(s => s.trim()).filter(s => s),
          }
          
      await experiencesApi.create(experience)
      onComplete(experience)
    } catch (err) {
      console.error('Failed to save experience:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const isValid = form.title && form.organization && form.start_date && form.end_date

  return (
    <div>
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Add Your Most Recent Experience
      </h2>
      <p className="text-gray-600 mb-6">
        Just your current or most recent role - you can add more later
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job Title*
          </label>
          <input 
            type="text"
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="e.g. Senior Software Developer"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company*
          </label>
          <input 
            type="text"
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="e.g. Tech Corp Ltd"
            value={form.organization}
            onChange={(e) => setForm({ ...form, organization: e.target.value })}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date*
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date*
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={form.is_current}
                />
              </div>
            </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Key Skills (comma separated)
          </label>
          <input 
            type="text"
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Python, JavaScript, React, Node.js, AWS"
            value={form.skills_used}
                onChange={(e) => setForm({ ...form, skills_used: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            List your main technical skills for this role
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Main Achievements (optional)
          </label>
          <textarea 
             className="w-full px-3 py-2 border rounded-lg"
            rows="5"
            placeholder="• Built API serving 1M requests/day&#10;• Led team of 5 developers&#10;• Reduced load time by 50%"
            onChange={(e) => setForm({ ...form, achievements: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            One achievement per line (use • for bullets)
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button 
          onClick={onBack}
          className="btn btn-secondary flex-1"
        >
          Back
        </button>
        <button 
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="btn btn-primary flex-1 flex items-center justify-center gap-2"
        >
            <span className="inline-flex items-center gap-2">
                {submitting && <Loader className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Saving...' : 'Continue'}</span>
                {!submitting && <ArrowRight className="w-4 h-4" />}
            </span>
        </button>
      </div>
    </div>
  )
}

/**
 * Step 2: Profile Summary
 */
function ProfileSummary({ experiences, onComplete, onBack }) {
    const expList = Array.isArray(experiences)
    ? experiences
    : Array.isArray(experiences?.saved_experiences)
      ? experiences.saved_experiences
      : []
    const totalSkills = new Set(
        expList.flatMap(exp => exp.skills_used || exp.skills || [])
      )

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-success-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Profile Setup Complete! 🎉
        </h2>
        <p className="text-gray-600">
          We can now analyze jobs based on YOUR experience
        </p>
      </div>

      <div className="bg-gradient-to-br from-primary-50 to-success-50 rounded-xl p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Your Profile Summary</h3>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Experience</p>
            <p className="text-2xl font-bold text-gray-900">
              {experiences.length} role{experiences.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Skills</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalSkills.size} skills
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {experiences.map((exp, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4">
              <h4 className="font-bold text-gray-900">
                {exp.title} @ {exp.company}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {exp.duration}
              </p>
              {(exp.skills_used || exp.skills) && (
                <div className="flex flex-wrap gap-2">
                  {(exp.skills_used || exp.skills).slice(0, 5).map((skill, i) => (
                    <span 
                      key={i}
                      className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {(exp.skills_used || exp.skills).length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{(exp.skills_used || exp.skills).length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>✨ What's next:</strong> Now you can add jobs and get personalized verdicts 
          based on YOUR exact experience and skills!
        </p>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={onBack}
          className="btn btn-secondary"
        >
          Add More Experience
        </button>
        <button 
          onClick={onComplete}
          className="btn btn-primary flex-1 flex items-center justify-center gap-2"
        >
          Continue to Jobs
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default CVSetupWizard