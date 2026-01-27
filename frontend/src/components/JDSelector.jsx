import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  FileText, 
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Edit
} from 'lucide-react';
import AIGenerationHub from './AIGenerationHub'
import EditQuestionsCard from './EditQuestionsCard'
import { jobsApi } from '../services/api'

/**
 * JD Selector 컴포넌트
 * 
 * 기능:
 * - 저장된 JD 리스트 (검색 가능)
 * - Manual JD input
 * - Single select (radio)
 */
export default function JDSelector({ selectedJD, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualJD, setManualJD] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  
  // Fetch saved jobs
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => jobsApi.list({ skip: 0, limit: 50 })
  });

  const jobs = jobsData?.data || []

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(query) ||
      job.company?.toLowerCase().includes(query)
    );
  });
  
  // Handle select saved job
  const handleSelectJob = (job) => {
    console.log(jobs)
    onSelect({
      id: job.id,
      title: job.title,
      company: job.company,
      custom_questions: job.custom_questions || []
    });
    setShowManualInput(false);
  };

  const handleSaveQuestions = async (structuredQuestions) => {
    try {
      // structuredQuestions comes from backend after save
      // Update local state with the structured format
      setCurrentJob({ ...currentJob, custom_questions: structuredQuestions })
      setIsEditingQuestions(false)
      
      // Notify parent if callback provided
      if (onJobUpdate) {
        onJobUpdate({ ...currentJob, custom_questions: structuredQuestions })
      }
      
    } catch (error) {
      console.error('Failed to update local state:', error)
      throw error
    }
  }
  
  // Handle select manual JD
  const handleSelectManual = () => {
    if (!manualJD.trim()) {
      alert('Please enter a job description');
      return;
    }
    
    onSelect({
      manual_jd: manualJD,
      title: manualTitle || 'Manual JD',
      company: 'Manual Entry',
      custom_questions: []
    });
  };
  
  const isJobSelected = (job) => {
    return selectedJD?.id === job.id;
  };
  
  const isManualSelected = selectedJD?.manual_jd && !selectedJD?.id;
  const [isEditingQuestions, setIsEditingQuestions] = useState(false)
  
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search saved jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>
      
      {/* Manual Input Toggle */}
      <button
        onClick={() => setShowManualInput(!showManualInput)}
        className="btn btn-outline w-full flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Paste Manual JD
        </span>
        {showManualInput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {/* Manual Input Form */}
      {showManualInput && (
        <div className="card bg-blue-50 border-blue-200 space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Job Title (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Product Manager"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              className="input"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">
              Job Description *
            </label>
            <textarea
              placeholder="Paste the full job description here..."
              value={manualJD}
              onChange={(e) => setManualJD(e.target.value)}
              rows={8}
              className="input bg-white resize-none"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSelectManual}
              disabled={!manualJD.trim()}
              className={`btn flex-1 ${
                isManualSelected ? 'btn-primary' : 'btn-outline'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isManualSelected && <CheckCircle2 className="w-4 h-4 mr-2" />}
              Use This JD
            </button>
            
            <button
              onClick={() => {
                setManualJD('');
                setManualTitle('');
                setShowManualInput(false);
              }}
              className="btn btn-secondary"
            >
              Clear
            </button>
          </div>
        </div>
      )}
      
      {/* Saved Jobs List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {isLoading && (
          <div className="text-center py-8 text-gray-500">
            <div className="spinner mx-auto mb-3"></div>
            Loading jobs...
          </div>
        )}
        
        {!isLoading && filteredJobs.length === 0 && (
          <div className="card text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No saved jobs found</p>
            <p className="text-sm text-gray-500 mt-1">
              Use manual input or save jobs first
            </p>
          </div>
        )}
        
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            onClick={() => handleSelectJob(job)}
            className={`card cursor-pointer transition-all ${
              isJobSelected(job)
                ? 'border-2 border-primary-500 bg-primary-50'
                : 'hover:shadow-md hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{job.title}</h3>
                  {isJobSelected(job) && (
                    <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2 truncate">{job.company}</p>
                
                {job.location && (
                  <p className="text-xs text-gray-500 truncate">{job.location}</p>
                )}
                
                {/* Status badge */}
                <div className="mt-2">
                  <span className="badge badge-primary text-xs">
                    {job.status}
                  </span>
                </div>
              </div>
              
              {/* Match score if available */}
              {job.match_score && (
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-lg font-bold text-primary-600">
                    {Math.round(job.match_score)}%
                  </div>
                  <div className="text-xs text-gray-500">Previous</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Selection Info */}
      {selectedJD && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium truncate">
              Selected: {selectedJD.title}
            </span>
          </div>
        </div>
      )}
      {selectedJD && (
      isEditingQuestions ? (
            <EditQuestionsCard
              job={selectedJD}
              onSave={handleSaveQuestions}
              onCancel={() => setIsEditingQuestions(false)}
            />
          ) : (
            <div id="ai-generation-hub" className="relative">
              {/* Edit Questions Button */}
              <div className="mb-4">
                <button
                  onClick={() => setIsEditingQuestions(true)}
                  className="w-full rounded-xl border-2 border-primary-300 bg-primary-50 px-4 py-4 text-left shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-primary-200 flex-shrink-0">
                      <Edit className="w-5 h-5 text-primary-700" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-bold text-gray-900">
                          Add application questions to generate better answers
                        </p>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white border border-primary-200 text-primary-700">
                          {selectedJD.custom_questions?.length || 0} saved
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-700">
                        Copy questions from the application form, the AI Hub will use them to create job-specific responses.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                          Takes ~30 seconds
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                          Improves answer quality
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                          Works for all jobs
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )
        )}
    </div>
  );
}