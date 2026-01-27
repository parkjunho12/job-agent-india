import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X
} from 'lucide-react';
import { experiencesApi, cvApi } from '../services/api'

/**
 * CV Selector 컴포넌트
 * 
 * 기능:
 * - 저장된 CV 리스트
 * - Manual CV input
 * - Multi-select (checkbox)
 * - CV Set 이름 지정
 */

export default function CVSelector({ selectedCVs, onSelect, cvSetName, onSetNameChange }) {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCV, setManualCV] = useState('');

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Present'
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    })
  };


    // Fetch experiences
    const { data, isLoading } = useQuery({
        queryKey: ['experiences'],
        queryFn: () => experiencesApi.getAll()
      })
    const experiences = data?.data || []

    const savedCVs = experiences.map(exp => ({
        id: exp.id,
        title: exp.title || 'Untitled CV',
        organisation: exp.organisation || '',
        location: exp.location,
        duration: `${formatDate(exp.start_date)} - ${formatDate(exp.end_date)}`,
        description: exp.description || '',
        tags: exp.achievements || [],
        keySkills: exp.skills_used || [],
        keywords: (exp.keywords || []).map(k =>
            k
              .replace(/[^a-zA-Z0-9\s]/g, '') // 알파벳/숫자/공백만 유지
              .trim()
              .toUpperCase()
          ),
    }));
  
  // Handle toggle CV
  const handleToggleCV = (cv) => {
    const isSelected = selectedCVs.some(item => item.resume_id === cv.id);
    
    if (isSelected) {
      // Remove
      onSelect(selectedCVs.filter(item => item.resume_id !== cv.id));
    } else {
      // Add
      
      onSelect([...selectedCVs, { resume_id: cv.id, name: cv.title }]);
    }
  };
  
  // Handle add manual CV
  const handleAddManual = () => {
    if (!manualCV.trim()) {
      alert('Please enter CV text');
      return;
    }
    
    onSelect([...selectedCVs, { 
      manual_resume: manualCV,
      name: 'Manual CV'
    }]);
    
    setManualCV('');
    setShowManualInput(false);
  };
  
  // Handle remove selected
  const handleRemove = (index) => {
    onSelect(selectedCVs.filter((_, i) => i !== index));
  };
  
  const isCVSelected = (cv) => {
    return selectedCVs.some(item => item.resume_id === cv.id);
  };
  
  return (
    <div className="space-y-4">
      {/* CV Set Name */}
      {selectedCVs.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-1 block">
            CV Set Name (optional)
          </label>
          <input
            type="text"
            placeholder={`${selectedCVs.length} CV(s) selected`}
            value={cvSetName}
            onChange={(e) => onSetNameChange(e.target.value)}
            className="input"
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Give this combination a name for easy reference
          </p>
        </div>
      )}
      
      {/* Manual Input Toggle */}
      <button
        onClick={() => setShowManualInput(!showManualInput)}
        className="btn btn-outline w-full flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Manual CV
        </span>
        {showManualInput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {/* Manual Input Form */}
      {showManualInput && (
        <div className="card bg-blue-50 border-blue-200 space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">
              CV / Resume Text
            </label>
            <textarea
              placeholder="Paste your CV or resume text here..."
              value={manualCV}
              onChange={(e) => setManualCV(e.target.value)}
              rows={10}
              className="input bg-white font-mono text-sm resize-none"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleAddManual}
              disabled={!manualCV.trim()}
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Selection
            </button>
            
            <button
              onClick={() => {
                setManualCV('');
                setShowManualInput(false);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Selected CVs Display */}
      {selectedCVs.length > 0 && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">
                {selectedCVs.length} CV{selectedCVs.length > 1 ? 's' : ''} Selected
              </span>
            </div>
            
            <button
              onClick={() => onSelect([])}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2">
            {selectedCVs.map((cv, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-200"
              >
                <span className="text-sm font-medium truncate">
                  {cv.name || 'Manual CV'}
                </span>
                
                <button
                  onClick={() => handleRemove(index)}
                  className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-green-700 mt-3">
            💡 Selected CVs will be merged as one profile for analysis
          </p>
        </div>
      )}
      
      {/* Saved CVs List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Saved CVs ({savedCVs.length})
        </div>
        
        {savedCVs.length === 0 ? (
          <div className="card text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No saved CVs found</p>
            <p className="text-sm text-gray-500 mt-1">
              Use manual input or create CV first
            </p>
          </div>
        ) : (
          savedCVs.map((cv) => (
            <div
              key={cv.id}
              onClick={() => handleToggleCV(cv)}
              className={`card cursor-pointer transition-all ${
                isCVSelected(cv)
                  ? 'border-2 border-primary-500 bg-primary-50'
                  : 'hover:shadow-md hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className="mt-1 flex-shrink-0">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isCVSelected(cv)
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-gray-300'
                  }`}>
                    {isCVSelected(cv) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Title & Meta */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                    {cv.title}
                    </h3>

                    {cv.location && (
                    <span className="text-sm text-gray-500">
                        • {cv.location}
                    </span>
                    )}

                    {cv.tags.map(tag => (
                    <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                    >
                        {tag}
                    </span>
                    ))}
                </div>
                  
                  {/* Duration */}
                    {cv.duration && (
                        <div className="text-xs text-gray-500 mb-1">
                        {cv.duration}
                        </div>
                    )}

                    {/* Description */}
                    {cv.description && (
                        <p className="text-sm text-gray-700 line-clamp-2">
                        {cv.description}
                        </p>
                    )}

                  {/* Key Words */}
                    {cv.keywords.length > 0 && (
                    <div className="mt-3">
                        <h5 className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-2">
                        Key Words
                        </h5>

                        <div className="flex flex-wrap gap-1.5">
                        {cv.keywords.slice(0, 4).map(word => (
                            <span
                            key={word}
                            className="px-2 py-0.5 rounded-full bg-green-100 text-gray-700 text-xs font-medium"
                            >
                            {word}
                            </span>
                        ))}

                        {cv.keywords.length > 4 && (
                            <span className="px-2 py-0.5 rounded-full bg-green-200 text-gray-600 text-xs font-medium">
                            +{cv.keywords.length - 4} more
                            </span>
                        )}
                        </div>
                    </div>
                    )}



                  {/* Key Skills */}
                    {cv.keySkills.length > 0 && (
                    <div className="mt-3">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Key Skills
                        </h5>

                        <div className="flex flex-wrap gap-1.5">
                        {cv.keySkills.slice(0, 5).map(skill => (
                            <span
                            key={skill}
                            className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                            >
                            {skill}
                            </span>
                        ))}

                        {cv.keySkills.length > 5 && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-xs font-medium">
                            +{cv.keySkills.length - 5} more
                            </span>
                        )}
                        </div>
                    </div>
                    )}

                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Helper Text */}
      <div className="card bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          💡 <strong>Pro tip:</strong> Select multiple CVs to combine experiences from different roles. 
          Great for showing versatility!
        </p>
      </div>
    </div>
  );
}