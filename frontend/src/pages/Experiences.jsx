import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { experiencesApi, cvApi } from '../services/api'
import { 
  Briefcase, GraduationCap, Code, Plus, Edit2, Trash2, Award, Upload, 
  Calendar, MapPin, AlertCircle, CheckCircle, Loader
} from 'lucide-react'

const EXPERIENCE_TYPES = {
  work: { label: 'Work Experience', icon: Briefcase, color: 'blue' },
  education: { label: 'Education', icon: GraduationCap, color: 'purple' },
  project: { label: 'Projects', icon: Code, color: 'green' },
  certification: { label: 'Certifications', icon: Award, color: 'yellow' },
}

function Experiences() {
  const queryClient = useQueryClient()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingExperience, setEditingExperience] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Fetch experiences
  const { data, isLoading } = useQuery({
    queryKey: ['experiences'],
    queryFn: () => experiencesApi.getAll()
  })
  
  const experiences = data?.data || []
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => experiencesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['experiences'])
      setSuccess('Experience deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    },
    onError: () => {
      setError('Failed to delete experience')
      setTimeout(() => setError(''), 3000)
    }
  })
  
  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this experience?')) {
      deleteMutation.mutate(id)
    }
  }
  
  const filteredExperiences = filterType === 'all' 
    ? experiences 
    : experiences.filter(exp => exp.type === filterType)
  
  const getTypeIcon = (type) => {
    const Icon = EXPERIENCE_TYPES[type]?.icon || Briefcase
    return <Icon className="w-5 h-5" />
  }
  
  const getTypeColor = (type) => {
    const colors = {
      work: 'bg-blue-100 text-blue-700',
      education: 'bg-purple-100 text-purple-700',
      project: 'bg-green-100 text-green-700',
      certification: 'bg-yellow-100 text-yellow-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Present'
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    })
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }
  
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Experiences</h1>
            <p className="text-gray-600">Add your work, education, and projects</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Upload size={20} />
              Upload CV
            </button>
            <button
              onClick={() => {
                setEditingExperience(null)
                setShowAddModal(true)
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Experience
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-4">
          <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Info Card */}
      <div className="card bg-blue-50 border-blue-200 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Why add experiences?</h3>
            <p className="text-sm text-gray-700">
              The AI uses your experiences to generate personalized, evidence-based answers. 
              The more details you add (achievements, metrics, skills), the better your applications will be!
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterType === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          All ({experiences.length})
        </button>
        {Object.entries(EXPERIENCE_TYPES).map(([type, config]) => {
          const count = experiences.filter(e => e.type === type).length
          const Icon = config.icon
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                filterType === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              <Icon size={18} />
              {config.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Experience List */}
      {filteredExperiences.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No experiences yet
          </h3>
          <p className="text-gray-600 mb-6">
            Add your work experience, education, and projects to get started
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Upload size={20} />
              Upload CV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExperiences.map((exp) => (
            <div key={exp.id} className="card hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(exp.type)}`}>
                  {getTypeIcon(exp.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{exp.title}</h3>
                      <p className="text-gray-700 font-medium">{exp.organization}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingExperience(exp)
                          setShowAddModal(true)
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(exp.id)}
                        className="btn btn-secondary btn-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                    </div>
                    {exp.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        {exp.location}
                      </div>
                    )}
                  </div>

                  {exp.description && (
                    <p className="text-gray-700 mb-3">{exp.description}</p>
                  )}

                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="border-t border-gray-200 pt-3 mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Key Achievements:</p>
                      <ul className="space-y-1">
                        {exp.achievements.map((achievement, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-success-500 mt-1">•</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exp.skills_used && exp.skills_used.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {exp.skills_used.map((skill, idx) => (
                        <span
                          key={idx}
                          className="badge badge-primary text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showUploadModal && (
        <CVUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['experiences'])
            setShowUploadModal(false)
            setSuccess('CV uploaded successfully!')
            setTimeout(() => setSuccess(''), 3000)
          }}
        />
      )}

      {showAddModal && (
        <ExperienceFormModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setEditingExperience(null)
          }}
          experience={editingExperience}
          onSuccess={() => {
            queryClient.invalidateQueries(['experiences'])
            setShowAddModal(false)
            setEditingExperience(null)
            setSuccess(editingExperience ? 'Experience updated!' : 'Experience added!')
            setTimeout(() => setSuccess(''), 3000)
          }}
        />
      )}
    </div>
  )
}

// CV Upload Modal Component
function CVUploadModal({ isOpen, onClose, onSuccess }) {
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!uploadFile) {
      setError('Please select a file')
      return
    }
    
    try {
      setUploading(true)
      setUploadProgress('Uploading CV...')
      setError('')
      
      const result = await cvApi.parseAndSave(uploadFile)
      
      setUploadProgress('')
      onSuccess(result.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload CV')
      setUploadProgress('')
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Upload CV</h2>
          
          <form onSubmit={handleUpload}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CV (PDF or DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full"
                disabled={uploading}
              />
              {uploadFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {uploadFile.name}
                </p>
              )}
            </div>

            {uploadProgress && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm flex items-center gap-2">
                  <Loader size={16} className="animate-spin" />
                  {uploadProgress}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!uploadFile || uploading}
                className="btn btn-primary"
              >
                {uploading ? 'Uploading...' : 'Upload & Parse'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Experience Form Modal Component
function ExperienceFormModal({ isOpen, onClose, experience, onSuccess }) {
  const [formData, setFormData] = useState({
    type: experience?.type || 'work',
    title: experience?.title || '',
    organization: experience?.organization || '',
    location: experience?.location || '',
    start_date: experience?.start_date ? experience.start_date.split('T')[0] : '',
    end_date: experience?.end_date ? experience.end_date.split('T')[0] : '',
    is_current: experience?.is_current || false,
    description: experience?.description || '',
    achievements: experience?.achievements?.join('\n') || '',
    skills_used: experience?.skills_used?.join(', ') || '',
  })
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError('')
      
      const payload = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        achievements: formData.achievements.split('\n').filter(a => a.trim()),
        skills_used: formData.skills_used.split(',').map(s => s.trim()).filter(s => s),
      }
      
      if (experience) {
        await experiencesApi.update(experience.id, payload)
      } else {
        await experiencesApi.create(payload)
      }
      
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save experience')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 my-8">
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">
            {experience ? 'Edit Experience' : 'Add Experience'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                {Object.entries(EXPERIENCE_TYPES).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title / Position
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization / Company
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location (optional)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., London, UK"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={formData.is_current}
                />
              </div>
            </div>

            {/* Current */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_current"
                checked={formData.is_current}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  is_current: e.target.checked,
                  end_date: e.target.checked ? '' : formData.end_date
                })}
                className="rounded"
              />
              <label htmlFor="is_current" className="text-sm text-gray-700">
                I currently work here
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>

            {/* Achievements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Achievements (one per line)
              </label>
              <textarea
                value={formData.achievements}
                onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                placeholder="Increased sales by 30%&#10;Led team of 5 developers"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills (comma separated)
              </label>
              <input
                type="text"
                value={formData.skills_used}
                onChange={(e) => setFormData({ ...formData, skills_used: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Python, React, SQL, AWS"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : (experience ? 'Update' : 'Add')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Experiences