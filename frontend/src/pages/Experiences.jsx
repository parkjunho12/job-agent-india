import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { experiencesApi } from '../services/api'
import { Briefcase, GraduationCap, Code, Plus, Edit2, Trash2, Save, X } from 'lucide-react'

function Experiences() {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  const { data, isLoading } = useQuery({
    queryKey: ['experiences'],
    queryFn: () => experiencesApi.list()
  })
  
  const experiences = data?.data || []
  
  const deleteMutation = useMutation({
    mutationFn: (id) => experiencesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['experiences'])
    }
  })
  
  const getTypeIcon = (type) => {
    switch(type) {
      case 'work': return <Briefcase className="w-5 h-5" />
      case 'education': return <GraduationCap className="w-5 h-5" />
      case 'project': return <Code className="w-5 h-5" />
      default: return <Briefcase className="w-5 h-5" />
    }
  }
  
  const getTypeColor = (type) => {
    switch(type) {
      case 'work': return 'bg-blue-100 text-blue-700'
      case 'education': return 'bg-green-100 text-green-700'
      case 'project': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
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
          <button 
            onClick={() => setIsAdding(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Experience
          </button>
        </div>
      </div>
      
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
      
      {/* Experience List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="spinner"></div>
        </div>
      ) : experiences.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No experiences yet</h3>
          <p className="text-gray-600 mb-6">
            Add your work experience, education, or projects to generate better applications
          </p>
          <button 
            onClick={() => setIsAdding(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Experience
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map(exp => (
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
                        onClick={() => setEditingId(exp.id)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteMutation.mutate(exp.id)}
                        className="btn btn-secondary btn-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {exp.description && (
                    <p className="text-gray-600 mb-3">{exp.description}</p>
                  )}
                  
                  {/* Skills */}
                  {exp.skills_used && exp.skills_used.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {exp.skills_used.map((skill, idx) => (
                        <span key={idx} className="badge badge-primary text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Achievements */}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="border-t border-gray-200 pt-3 mt-3">
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
                  
                  {/* Dates */}
                  <div className="text-sm text-gray-500 mt-3">
                    {exp.start_date && (
                      <span>
                        {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        {' - '}
                        {exp.is_current ? 'Present' : 
                         exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Experiences