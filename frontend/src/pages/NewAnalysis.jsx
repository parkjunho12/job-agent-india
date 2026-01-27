import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import JDSelector from '../components/JDSelector';
import CVSelector from '../components/CVSelector';
import { useNavigate } from 'react-router-dom';
import { analysisApi, jobsApi } from '../services/api';
import analytics from '../services/analytics'

/**
 * New Analysis 화면
 * 
 * 기능:
 * - 왼쪽: JD 선택 (1개)
 * - 오른쪽: CV 선택 (여러 개)
 * - 하단: Analyze 버튼
 * 
 * Flow:
 * 1. Create analysis (POST /api/v1/analysis)
 * 2. Run analysis (POST /api/v1/analysis/{id}/analyze)
 * 3. Redirect to detail view
 */
export default function NewAnalysis({ onComplete }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Selection state
  const [selectedJD, setSelectedJD] = useState(null);
  const [selectedCVs, setSelectedCVs] = useState([]);
  const [cvSetName, setCvSetName] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const createManualAnalysisMutation = useMutation({
    mutationFn: async (data) => {

        const payload = {
            title: selectedJD.title,
            company: selectedJD.company,
            location:  null,
            url:  "",
            description: selectedJD.description || "",
            required_skills:  [],
            required_experience: null,
            salary_range: null,
            job_type: null,
            portal_type: 'manual',
            status: 'saved'
          }
          
          const response = await jobsApi.create(payload)
          analytics.trackJobAdded(response.data.id)

          createAnalysisMutation.mutate(data);
    },
    onSuccess: (analysis) => {

    },
    onError: (error) => {
        console.error('Failed to create manual job description:', error);
        }
  })
  
  // Create analysis mutation
  const createAnalysisMutation = useMutation({
    mutationFn: async (data) => {
    
      const analysis = await analysisApi.createAnalysis(data);
      
      console.log('Created analysis:', analysis);
      return analysis;
    },
    onSuccess: (analysis) => {
      console.log('Analysis created successfully:', analysis.id);
      
      // Invalidate queries
      queryClient.invalidateQueries(['analyses']);

      analytics.trackAnalysis(analysis.id, analysis.can_view_full);
      
      // Check if already done (synchronous API)
      if (analysis.status === 'done' && analysis.preview_payload) {
        console.log('Analysis already complete (sync)');
        
        // Set result immediately
        setAnalysisResult({
          analysis_id: analysis.id,
          status: 'done',
          preview: analysis.preview_payload
        });
        

        // Redirect to detail after 2 seconds
        setTimeout(() => {
          navigate(`/analysis-history/${analysis.id}`);
        }, 2000);
      } else {
        // Run analysis if not done
        console.log('Running analysis...');
        runAnalysisMutation.mutate(analysis.id);
      }
    },
    onError: (error) => {
      console.error('Failed to create analysis:', error);
    }
  });
  
  // Run analysis mutation
  const runAnalysisMutation = useMutation({
    mutationFn: async (analysisId) => {
      console.log('Running analysis:', analysisId);
      
      // ✅ FIX: Add await
      const response = await analysisApi.runAnalysis(analysisId);
      
      console.log('Analysis result:', response);
      return response;
    },
    onSuccess: (data) => {
      
      setAnalysisResult(data);
      
      // Invalidate queries
      queryClient.invalidateQueries(['analyses']);
      queryClient.invalidateQueries(['analysis', data.analysis_id]);

        console.log(data);
      
      // ✅ FIX: Redirect to detail view, not history
      setTimeout(() => {
        if (data.analysis_id) {
          navigate(`/analysis-history/${data.analysis_id}`);
        } else if (onComplete) {
          onComplete();
        }
      }, 2000);
    },
    onError: (error) => {
      console.error('Failed to run analysis:', error);
    }
  });
  
  // Handle analyze
  const handleAnalyze = () => {
    // Validation
    if (!selectedJD) {
      alert('Please select a job description');
      return;
    }
    
    if (selectedCVs.length === 0) {
      alert('Please select at least one CV');
      return;
    }
    
    // ✅ IMPROVED: Better data preparation
    const data = {
      cv_set_name: cvSetName || `${selectedCVs.length} CV(s) selected`,
      save_jd: false
    };
    
    // Add JD
    if (selectedJD.id) {
      data.job_id = selectedJD.id;
    } else if (selectedJD.manual_jd) {
      data.manual_jd = selectedJD.manual_jd;
    } else {
      alert('Invalid job description selected');
      return;
    }
    
    // ✅ FIX: Better CV handling
    // Check if all CVs are saved (have resume_id)
    const allSaved = selectedCVs.every(cv => cv.resume_id);
    const allManual = selectedCVs.every(cv => cv.manual_resume);
    
    if (allSaved) {
      // All saved CVs - use resume_ids array
      data.resume_ids = selectedCVs.map(cv => cv.resume_id);
    } else if (allManual) {
      // All manual CVs - combine into one text
      data.manual_resume = selectedCVs
        .map(cv => cv.manual_resume)
        .filter(Boolean)
        .join('\n\n---\n\n');
    } else {
      // Mixed - combine all into manual_resume
      const combinedText = selectedCVs
        .map(cv => {
          if (cv.resume_id) {
            return `[Saved CV: ${cv.name || 'Resume ' + cv.resume_id}]`;
          } else {
            return cv.manual_resume || '';
          }
        })
        .filter(Boolean)
        .join('\n\n---\n\n');
      
      data.manual_resume = combinedText;
      
      // If we have resume_ids, include them too
      const savedIds = selectedCVs
        .filter(cv => cv.resume_id)
        .map(cv => cv.resume_id);
      
      if (savedIds.length > 0) {
        data.resume_ids = savedIds;
      }
    }
    analytics.trackCTAClick('Analyze')
    createAnalysisMutation.mutate(data);
  };
  
  const canAnalyze = selectedJD && selectedCVs.length > 0;
  const isAnalyzing = createAnalysisMutation.isPending || runAnalysisMutation.isPending;
  
  // ✅ NEW: Get current step for better UX
  const getCurrentStep = () => {
    if (createAnalysisMutation.isPending) {
      return 'Creating analysis...';
    }
    if (runAnalysisMutation.isPending) {
      return 'Running AI analysis (~30 seconds)...';
    }
    if (analysisResult) {
      return 'Complete! Redirecting...';
    }
    return '';
  };
  
  return (
    <div>
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-900 text-sm">
          <strong>How it works:</strong> Select a job description from your saved jobs (or paste one manually), 
          then select one or more CVs to analyze the match. You'll get a detailed compatibility report.
        </p>
      </div>
      
      {/* Main Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: JD Selector */}
        <div>
          <h2 className="text-2xl font-bold mb-4">1. Select Job Description</h2>
          <JDSelector
            selectedJD={selectedJD}
            onSelect={setSelectedJD}
          />
        </div>
        
        {/* Right: CV Selector */}
        <div>
          <h2 className="text-2xl font-bold mb-4">2. Select Your CV(s)</h2>
          <CVSelector
            selectedCVs={selectedCVs}
            onSelect={setSelectedCVs}
            cvSetName={cvSetName}
            onSetNameChange={setCvSetName}
          />
        </div>
      </div>
      
      {/* Bottom Action Bar */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Left: Selection Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div>
              <div className="text-sm text-gray-500">Job Description</div>
              <div className="font-semibold">
                {selectedJD 
                  ? (selectedJD.title || 'Manual JD')
                  : 'Not selected'
                }
              </div>
            </div>
            
            <div className="hidden sm:block h-12 w-px bg-gray-200"></div>
            
            <div>
              <div className="text-sm text-gray-500">CVs Selected</div>
              <div className="font-semibold">
                {selectedCVs.length > 0 
                  ? `${selectedCVs.length} CV(s)`
                  : 'None'
                }
              </div>
            </div>
          </div>
          
          
          {/* Right: Analyze Button */}
          <button
            disabled={!canAnalyze || isAnalyzing}
            onClick={handleAnalyze}
            className="btn btn-primary text-lg px-6 py-3 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center">
                <Zap className="w-5 h-5" />
                Analyze Match
              </span>
            )}
          </button>
        </div>
        
        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{getCurrentStep()}</span>
            </div>
            
            {/* ✅ NEW: Progress indicator */}
            {runAnalysisMutation.isPending && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: '50%' }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Analyzing with AI... Please wait
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Success */}
        {analysisResult && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">
                Analysis complete! Match score: {Math.round(analysisResult.preview?.match_score || 0)}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Redirecting to results...
            </p>
          </div>
        )}
        
        {/* Error */}
        {(createAnalysisMutation.isError || runAnalysisMutation.isError) && (
          <div className="mt-4 pt-4 border-t">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 text-sm font-medium mb-1">
                    Analysis Failed
                  </p>
                  <p className="text-red-700 text-sm">
                    {createAnalysisMutation.error?.message || 
                     runAnalysisMutation.error?.message || 
                     'An unexpected error occurred. Please try again.'}
                  </p>
                  
                  {/* ✅ NEW: Retry button */}
                  <button
                    onClick={handleAnalyze}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Helper Text */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          💡 <strong>Tip:</strong> Select multiple CVs to merge them into one profile for a comprehensive analysis
        </p>
      </div>
    </div>
  );
}