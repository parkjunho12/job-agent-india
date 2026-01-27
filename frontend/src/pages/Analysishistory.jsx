import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Lock,
  Unlock
} from 'lucide-react';
import AnalysisDetail from './AnalysisDetail';
import { useNavigate } from 'react-router-dom';
import { analysisApi } from '../services/api';


/**
 * Analysis History 화면
 * 
 * 기능:
 * - 과거 분석 리스트
 * - 필터 (status, locked/unlocked)
 * - 검색
 * - 클릭하면 디테일 표시
 */
export default function AnalysisHistory({ onNewAnalysis }) {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, unlocked, locked
  const navigate = useNavigate();

  const handleSelectAnalysis = (analysisId) => {
    navigate(`/analysis-history/${analysisId}`);
  };
  
  // Fetch analyses
  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['analyses', filter],
    queryFn: async () => {
      const params = new URLSearchParams(); 
      if (filter === 'unlocked') params.append('unlocked_only', 'true');
      if (filter === 'locked') params.append('locked_only', 'true');
      
      const response = analysisApi.listAnalyses(params)
      return response;
    }
  });
  
  // Filter by search
  const filteredAnalyses = analyses.filter(analysis => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      analysis.jd_title?.toLowerCase().includes(query) ||
      analysis.jd_company?.toLowerCase().includes(query)
    );
  });

  const onNewAnalysisClick = () => {
    navigate('/new-analysis');
}
  
  // Get verdict badge
  const getVerdictBadge = (verdictType) => {
    const badges = {
      'strong_match': { label: 'Strong Match', className: 'bg-green-500 text-white' },
      'good_match': { label: 'Good Match', className: 'bg-blue-500 text-white' },
      'needs_work': { label: 'Needs Work', className: 'bg-orange-500 text-white' },
      'borderline': { label: 'Borderline', className: 'bg-yellow-500 text-white' }
    };
    
    const badge = badges[verdictType] || { label: 'Unknown', className: 'bg-gray-500 text-white' };
    return <span className={`badge ${badge.className}`}>{badge.label}</span>;
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'analyzing':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  
  return (
    <div>
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by job title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`btn ${filter === 'unlocked' ? 'btn-primary' : 'btn-outline'}`}
          >
            Unlocked
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`btn ${filter === 'locked' ? 'btn-primary' : 'btn-outline'}`}
          >
            Locked
          </button>
        </div>
        
        {/* New Analysis Button */}
        <button onClick={onNewAnalysisClick} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Analysis
        </button>
      </div>
      
      {/* Empty State */}
      {filteredAnalyses.length === 0 && !isLoading && (
        <div className="card text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No analyses yet</h3>
            <p className="text-gray-600 mb-6">
              Start analyzing job descriptions to see your matches
            </p>
            <button onClick={onNewAnalysisClick} className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create First Analysis
            </button>
          </div>
        </div>
      )}
      
      {/* Analysis List */}
      <div className="space-y-4">
        {filteredAnalyses.map((analysis) => (
          <div
            key={analysis.id}
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleSelectAnalysis(analysis.id)}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left: Job Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold truncate">{analysis.jd_title || 'Untitled'}</h3>
                  {getStatusIcon(analysis.status)}
                </div>
                
                <p className="text-gray-600 mb-3 truncate">{analysis.jd_company || 'Unknown Company'}</p>
                
                {/* CV Set */}
                <p className="text-sm text-gray-500 mb-3 truncate">
                  CV: {analysis.cv_set_name || 'Unknown CV'}
                </p>
                
                {/* Date */}
                <p className="text-xs text-gray-400">
                  {new Date(analysis.created_at).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              {/* Right: Results */}
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                {/* Verdict Badge */}
                {analysis.verdict_type && getVerdictBadge(analysis.verdict_type)}
                
                {/* Scores */}
                {analysis.match_score !== null && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {Math.round(analysis.match_score)}%
                    </div>
                    <div className="text-xs text-gray-500">Match Score</div>
                  </div>
                )}
                
                {/* Lock Status */}
                <div className="flex items-center gap-2">
                  {analysis.is_unlocked ? (
                    <>
                      <Unlock className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 whitespace-nowrap">Full Access</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500 whitespace-nowrap">Preview Only</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analyses...</p>
        </div>
      )}
    </div>
  );
}