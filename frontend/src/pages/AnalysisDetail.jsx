import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Lock, 
  Unlock,
  Star,
  FileText,
  MessageSquare,
  Target,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Zap,
  Copy,
  Download,
  RefreshCw
} from 'lucide-react';
import { analysisApi, billingApi } from '../services/api';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react'
import { 
    exportCompletePDF, 
    exportCoverLetterPDF, 
    exportInterviewQAPDF 
  } from '../utils/pdfExport';
import analytics from '../services/analytics';

/**
 * Analysis Detail 화면
 * 
 * 기능:
 * - Preview 표시 (Free)
 * - Unlock CTA
 * - Full Analysis 표시 (Unlocked)
 * 
 * Improvements:
 * - Added await to API calls
 * - Better error handling
 * - Copy/Export functionality
 * - Regenerate option
 * - Responsive design
 * - Loading states
 */
export default function AnalysisDetail() {
  const queryClient = useQueryClient();
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [unlockStage, setUnlockStage] = useState('idle');
// idle | redirecting | finalizing | done | cancelled | error
    const [unlockMsg, setUnlockMsg] = useState('');

  
  // Local state for interactions
  const [copiedSection, setCopiedSection] = React.useState(null);
  
  // Fetch analysis
  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: async () => {
      const response = await analysisApi.getAnalysis(analysisId);
      return response;
    },
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const startCheckoutMutation = useMutation({
    mutationFn: async () => {
      const billingRes = await billingApi.unlockAnalysis(analysisId);
  
      const checkoutUrl = billingRes?.data?.checkout_url;
      const transactionId = billingRes?.data?.session_id;
  
      if (!checkoutUrl || !transactionId) {
        throw new Error('Invalid billing response: missing checkout_url/transactionId');
      }
  
      // success return 시 finalize에 사용
      sessionStorage.setItem(`unlock_tx_${analysisId}`, transactionId);
      
      // Stripe Checkout로 이동
      window.location.href = checkoutUrl;
    },
    onMutate: () => {
        setUnlockStage('redirecting');
        setUnlockMsg('Redirecting to secure checkout…');
      },
      onError: (err) => {
        setUnlockStage('error');
        setUnlockMsg(err?.message || 'Failed to start checkout.');
      }
  });
  
  // Unlock mutation
  const unlockMutation = useMutation({
    mutationFn: async ({ analysisId, transactionId }) => {
      const response = await analysisApi.unlockAnalysis(analysisId, transactionId);
      return response;
    },
    onSuccess: () => {
      
      // Invalidate queries
      queryClient.invalidateQueries(['analysis', analysisId]);
      queryClient.invalidateQueries(['analyses']);

      setUnlockStage('done');
      setUnlockMsg('Unlocked! Loading full analysis…');
      
      // URL clean (unlock_success 제거)
      const next = new URLSearchParams(searchParams);
      next.delete('unlock_success');
      next.delete('unlock_cancelled');
      setSearchParams(next, { replace: true });
  
      // 사용 끝났으면 tx 제거
      sessionStorage.removeItem(`unlock_tx_${analysisId}`);
    },
    onError: (error) => {
      console.error('Failed to unlock analysis:', error);
      setUnlockStage('error');
    setUnlockMsg(err?.message || 'Failed to finalize unlock.');
    }
  });


  // ✅ NEW: Regenerate full content mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      console.log('Regenerating full content:', analysisId);
      const response = await analysisApi.regenerateFullContent(analysisId);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['analysis', analysisId]);
      alert('Content regenerated successfully!');

      setUnlockStage('done');
      setUnlockMsg('Unlocked! Loading full analysis…');
    },
    onError: (error) => {
      alert('Failed to regenerate content. Please try again.');
      setUnlockStage('error');
        setUnlockMsg(err?.message || 'Failed to finalize unlock.');
    }
  });
  
  // ✅ NEW: Copy to clipboard
  const handleCopy = async (text, section) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedSection(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };
  
  // ✅ NEW: Export as PDF (placeholder)
  const handleExportPDF = (section) => {
    try {
      if (section === 'cover-letter') {
        exportCoverLetterPDF(analysis, full.cover_letter_full);
      } else if (section === 'complete-analysis') {
        exportCompletePDF(analysis, preview, full);
      }
      alert('PDF exported successfully!');
    } catch (error) {
      alert('Failed to export PDF');
    }
  };

  useEffect(() => {
    const unlockSuccess = searchParams.get('unlock_success') === 'true';
    const unlockCancelled = searchParams.get('unlock_cancelled') === 'true';
  
    if (unlockCancelled) {
      // 필요하면 토스트/알림
      const next = new URLSearchParams(searchParams);
      next.delete('unlock_cancelled');
      setSearchParams(next, { replace: true });
      return;
    }
  
    if (!unlockSuccess) return;

    setUnlockStage('finalizing');
    setUnlockMsg('Finalizing unlock… fetching full content.');
  
    // success면 저장해둔 transactionId로 finalize
    const tx = sessionStorage.getItem(`unlock_tx_${analysisId}`);
    if (!tx) {
      // 사용자가 다른 탭/기기에서 결제 완료 등 케이스 대비
      alert('Payment succeeded, but transaction info is missing. Please refresh or contact support.');
      return;
    }
  
    // 중복 호출 방지(React strict mode / rerender 대비)
    const guardKey = `unlock_finalized_${analysisId}_${tx}`;
    if (sessionStorage.getItem(guardKey) === '1') return;
    sessionStorage.setItem(guardKey, '1');

    analytics.trackUnlockPremium(analysisId);
  
    unlockMutation.mutate({ analysisId, transactionId: tx });
  }, [analysisId, searchParams]);

  
  // ✅ IMPROVED: Loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="spinner mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading analysis...</p>
      </div>
    );
  }
  
  // ✅ IMPROVED: Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Failed to Load Analysis</h2>
        <p className="text-gray-600 mb-4">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => navigate('/analysis-history')} 
            className="btn btn-secondary"
          >
            Go Back
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // ✅ IMPROVED: Not found state
  if (!analysis) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Analysis Not Found</h2>
        <p className="text-gray-600 mb-4">
          The analysis you're looking for doesn't exist or has been deleted.
        </p>
        <button 
          onClick={() => navigate('/analysis')} 
          className="btn btn-primary"
        >
          Back to History
        </button>
      </div>
    );
  }
  
  const preview = analysis.preview_payload || {};
  const full = analysis.full_payload || {};
  const isUnlocked = analysis.is_unlocked;
  const isUnlockPending = startCheckoutMutation.isPending || unlockMutation.isPending
  
  // Get verdict badge
  const getVerdictBadge = (verdictType) => {
    const badges = {
      'strong_match': { 
        label: 'Strong Match', 
        className: 'bg-green-500', 
        icon: CheckCircle 
      },
      'good_match': { 
        label: 'Good Match', 
        className: 'bg-blue-500', 
        icon: CheckCircle 
      },
      'needs_work': { 
        label: 'Needs Work', 
        className: 'bg-orange-500', 
        icon: AlertCircle 
      },
      'borderline': { 
        label: 'Borderline', 
        className: 'bg-yellow-500', 
        icon: AlertCircle 
      },
      'high_risk': {
        label: 'High Risk',
        className: 'bg-red-500',
        icon: AlertCircle
      }
    };
    
    const badge = badges[verdictType] || { 
      label: 'Unknown', 
      className: 'bg-gray-500', 
      icon: AlertCircle 
    };
    const Icon = badge.icon;
    
    return (
      <span className={`badge ${badge.className} text-white text-lg px-4 py-2 inline-flex items-center gap-2`}>
        <Icon className="w-5 h-5" />
        {badge.label}
      </span>
    );
  };
  
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/analysis-history')}
          className="btn btn-secondary mb-4 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2 break-words">
              {analysis.jd_title || 'Untitled Analysis'}
            </h1>
            <p className="text-gray-600 text-lg">{analysis.jd_company}</p>
            <p className="text-sm text-gray-500 mt-2">
              CV: {analysis.cv_set_name || 'Unknown CV'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Created: {new Date(analysis.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {preview.verdict_type && getVerdictBadge(preview.verdict_type)}
            
            {isUnlocked ? (
              <span className="badge bg-green-100 text-green-600 border-2 border-green-600 inline-flex items-center gap-2">
                <Unlock className="w-4 h-4" />
                Full Access
              </span>
            ) : (
              <span className="badge bg-gray-100 text-gray-600 border-2 border-gray-300 inline-flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Preview Only
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative">

      {(unlockStage === 'redirecting' || unlockStage === 'finalizing' || isUnlockPending) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm border border-gray-200">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-[min(520px,92vw)]">
            <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5 text-primary-600 animate-spin" />
            </div>

            <div className="flex-1">
                <p className="font-semibold text-gray-900 text-lg">
                {unlockStage === 'redirecting' ? 'Redirecting to checkout…' : 'Unlocking your analysis…'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                {unlockMsg || 'Please don’t close this tab.'}
                </p>

                <div className="mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-primary-600 animate-pulse rounded-full" />
                </div>

                <p className="text-xs text-gray-500 mt-3">
                This usually takes a few seconds.
                </p>
            </div>
            </div>
        </div>
        </div>
    )}

      {/* Preview Section (Always visible) */}
      <div className="space-y-6 mb-8">
        {/* Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-500 mb-1">Match Score</div>
            <div className="text-4xl font-bold text-primary-600">
              {Math.round(preview.match_score || 0)}%
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {preview.match_score >= 80 && '🎉 Excellent match!'}
              {preview.match_score >= 60 && preview.match_score < 80 && '✅ Good match'}
              {preview.match_score < 60 && '⚠️ Needs improvement'}
            </div>
          </div>
          
          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-500 mb-1">ATS Score</div>
            <div className="text-4xl font-bold text-blue-600">
              {Math.round(preview.ats_score || 0)}%
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Keyword coverage
            </div>
          </div>
          
          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-500 mb-1">Risk Score</div>
            <div className="text-4xl font-bold text-orange-600">
              {Math.round(preview.risk_score || 0)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Lower is better</div>
          </div>
        </div>
        
        {/* Top 3 Fixes */}
        {preview.top_fixes && preview.top_fixes.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold">Top 3 Fixes</h2>
              <span className="badge bg-green-500 text-white">FREE</span>
            </div>
            
            <div className="space-y-4">
              {preview.top_fixes.map((fix, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-300 hover:border-orange-400 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-2 break-words">{fix.title}</h3>
                      <p className="text-gray-700 italic break-words">
                        Example: {fix.example}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Cover Letter Preview */}
        {preview.cover_letter_preview?.visible_sentences && (
          <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold">Cover Letter Preview</h2>
            <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-semibold">
              FREE
            </span>
          </div>
      
          <div className="prose prose-sm max-w-none">
            {/* 1) FREE로 보여줄 문장들 */}
            {preview.cover_letter_preview.visible_sentences?.map((sentence, i) => (
              <p key={`v-${i}`} className="mb-2">
                {sentence}
              </p>
            ))}
      
            {/* 2) 잠금이면 “이어지는 본문”을 블러 처리 + 클릭 유도 */}
            {!isUnlocked && (
              <div className="relative mt-4">
                {/* 블러 처리되는 '이어지는 내용' (더미 대신 실제 continuation 추천) */}
                <div className="blur-sm select-none pointer-events-none opacity-90">
                  {(preview.cover_letter_preview.hidden_sentences ?? []).slice(0, 10).map((s, i) => (
                    <p key={`h-${i}`} className="mb-2 text-gray-700">
                      {s}
                    </p>
                  ))}
      
                  {/* hidden_sentences가 없다면 fallback */}
                  {(preview.cover_letter_preview.hidden_sentences ?? []).length === 0 && (
                    <>
                      <p className="mb-2 text-gray-700">
                        I am excited to apply for this role because it aligns closely with my experience in building
                        production-grade AI systems…
                      </p>
                      <p className="mb-2 text-gray-700">
                        In my previous role, I delivered end-to-end features from model development to deployment…
                      </p>
                      <p className="mb-2 text-gray-700">
                        I would welcome the opportunity to discuss how I can contribute to your team…
                      </p>
                    </>
                  )}
                </div>
      
                {/* 클릭 가능한 오버레이 */}
                <button
                  type="button"
                  onClick={() => {
                    // 1) 결제 모달/언락 플로우로 연결
                    // openPaywallModal() or navigate('/billing') etc.
                    navigate('/billing');
                  }}
                  className="absolute inset-0 flex items-center justify-center rounded-lg
                             bg-gradient-to-b from-white/40 via-white/75 to-white/95
                             border border-gray-200 hover:border-primary-400
                             transition-colors"
                >
                  <div className="text-center p-5 max-w-sm">
                    <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-primary-600" />
                    </div>
                    <p className="font-semibold text-lg mb-1 text-gray-900">
                      Continue reading
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      Unlock the full cover letter (300–400 words)
                    </p>
                    <span className="inline-flex items-center justify-center px-4 py-2 rounded-md
                                     bg-primary-600 text-white text-sm font-semibold
                                     hover:bg-primary-700 transition-colors">
                      Unlock Full Letter
                    </span>
                    <p className="mt-2 text-xs text-gray-500">
                      Click to unlock and view the complete version
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      
      {/* Unlock CTA (if not unlocked) */}
      {!isUnlocked && (
        <div className="card bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 border-4 border-primary-500 mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold mb-3">Unlock Full Analysis</h2>
            <p className="text-lg text-gray-700 mb-6">
              Get complete insights to maximize your application success
            </p>
            
            {/* What's Included */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
              <div className="bg-white rounded-lg p-4 border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <div className="flex items-start gap-3">
                  <Star className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Rewritten Resume Bullets</h3>
                    <p className="text-sm text-gray-600">
                      8 optimized bullets with metrics and keywords
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Full Cover Letter</h3>
                    <p className="text-sm text-gray-600">
                      Complete professional letter (300-400 words)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Interview Q&A</h3>
                    <p className="text-sm text-gray-600">
                      10 role-specific questions with STAR answers
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <div className="flex items-start gap-3">
                  <Target className="w-6 h-6 text-orange-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Gap Analysis</h3>
                    <p className="text-sm text-gray-600">
                      Detailed skill gaps and action plan
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Price & CTA */}
            <div className="bg-white rounded-xl p-6 border-2 border-purple-300 mb-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                <div className="text-center sm:text-left">
                  <div className="text-sm text-gray-500">One-time payment</div>
                  <div className="text-4xl font-bold text-primary-600">$2.99</div>
                </div>
                
                <div className="hidden sm:block h-12 w-px bg-gray-200"></div>
                
                <div className="text-center sm:text-left text-sm text-gray-600">
                  <div>✓ Lifetime access to this analysis</div>
                  <div>✓ All premium features</div>
                  <div>✓ Export to PDF</div>
                </div>
              </div>
              
              <button
                onClick={() => startCheckoutMutation.mutate()}
                disabled={isUnlockPending}
                className="btn btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
              >
                {isUnlockPending ? (
                  <span className="flex items-center gap-2 justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <Zap className="w-5 h-5" />
                    Unlock Full Analysis Now
                  </span>
                )}
              </button>
              
              <p className="text-xs text-gray-500 mt-3">
                🔒 Secure payment • 💯 Money-back guarantee • ⚡ Instant access
              </p>
            </div>
            
            {unlockMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-red-800 font-medium mb-1">Failed to Unlock</p>
                    <p className="text-red-700 text-sm">
                      {unlockMutation.error?.message || 'An unexpected error occurred. Please try again.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Full Analysis (if unlocked) */}
      {isUnlocked && full && (
        <div className="space-y-6">
          {/* Success Banner with Regenerate */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-green-900">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <strong>Full Access Unlocked!</strong> You have lifetime access to this complete analysis.
              </div>
              
              {/* ✅ NEW: Regenerate button */}
              <button
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
                className="btn btn-outline text-sm whitespace-nowrap"
                title="Regenerate AI content"
              >
                {regenerateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Rewritten Bullets */}
          {full.rewritten_bullets && full.rewritten_bullets.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                  Rewritten Resume Bullets
                </h2>
                
                {/* ✅ NEW: Copy all button */}
                <button
                  onClick={() => {
                    const allBullets = full.rewritten_bullets
                      .map(b => b.rewritten)
                      .join('\n\n');
                    handleCopy(allBullets, 'bullets');
                  }}
                  className="btn btn-outline btn-sm"
                >
                  {copiedSection === 'bullets' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy All
                    </>
                  )}
                </button>
              </div>
              
              <div className="space-y-4">
                {full.rewritten_bullets.map((item, index) => (
                  <div 
                    key={index} 
                    className="border-l-4 border-primary-500 pl-4 py-2 hover:bg-gray-50 rounded-r transition-colors"
                  >
                    <div className="text-sm text-gray-500 mb-1">Original:</div>
                    <div className="text-gray-700 mb-3">{item.original}</div>
                    
                    <div className="text-sm text-green-600 font-medium mb-1 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Improved:
                    </div>
                    <div className="font-medium text-lg">{item.rewritten}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Full Cover Letter */}
          {full.cover_letter_full && (
            <div className="card">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-500" />
                Complete Cover Letter
              </h2>
              
              <div className="prose prose-sm max-w-none bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="whitespace-pre-wrap">{full.cover_letter_full}</div>
              </div>
              
              {/* ✅ IMPROVED: Action buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                <button 
                  onClick={() => handleCopy(full.cover_letter_full, 'cover')}
                  className="btn btn-outline"
                >
                  {copiedSection === 'cover' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => handleExportPDF('cover-letter')}
                  className="btn btn-outline"
                >
                  <Download className="w-4 h-4" />
                  Export as PDF
                </button>
              </div>
            </div>
          )}
          
          {/* Interview Q&A */}
          {full.interview_qa && full.interview_qa.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-green-500" />
                  Interview Preparation ({full.interview_qa.length} Questions)
                </h2>
                
                {/* ✅ NEW: Copy all Q&A */}
                <button
                  onClick={() => {
                    const allQA = full.interview_qa
                      .map((qa, i) => `Q${i + 1}: ${qa.question}\n\nA: ${qa.answer}`)
                      .join('\n\n---\n\n');
                    handleCopy(allQA, 'qa');
                  }}
                  className="btn btn-outline btn-sm"
                >
                  {copiedSection === 'qa' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy All
                    </>
                  )}
                </button>
              </div>
              
              <div className="space-y-4">
                {full.interview_qa.map((qa, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-semibold text-lg mb-3 flex items-start gap-2">
                      <span className="text-primary-600 flex-shrink-0">Q{index + 1}:</span>
                      <span className="break-words flex-1">{qa.question}</span>
                    </div>
                    
                    <div className="pl-8 text-gray-700">
                      <div className="text-sm text-green-600 font-medium mb-2 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Suggested Answer:
                      </div>
                      <div className="whitespace-pre-wrap break-words">{qa.answer}</div>
                    </div>
                    
                    {/* ✅ NEW: Individual copy button */}
                    <button
                      onClick={() => handleCopy(`Q: ${qa.question}\n\nA: ${qa.answer}`, `qa-${index}`)}
                      className="mt-3 ml-8 text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                    >
                      {copiedSection === `qa-${index}` ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy this Q&A
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Gap Analysis */}
          {(full.strong_matches || full.missing_skills || full.action_plan) && (
            <div className="card">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-orange-500" />
                Gap Analysis & Action Plan
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strong Matches */}
                {full.strong_matches && full.strong_matches.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Your Strengths ({full.strong_matches.length})
                    </h3>
                    <ul className="space-y-2">
                      {full.strong_matches.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-600 flex-shrink-0 font-bold">✓</span>
                          <span className="break-words text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Missing Skills */}
                {full.missing_skills && full.missing_skills.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h3 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Areas to Address ({full.missing_skills.length})
                    </h3>
                    <ul className="space-y-2">
                      {full.missing_skills.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-orange-600 flex-shrink-0 font-bold">!</span>
                          <span className="break-words text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Action Plan */}
              {full.action_plan && full.action_plan.length > 0 && (
                <div className="mt-6 pt-6 border-t bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Recommended Actions ({full.action_plan.length} steps)
                  </h3>
                  <ol className="space-y-2 list-decimal list-inside">
                    {full.action_plan.map((item, i) => (
                      <li key={i} className="text-gray-800 break-words text-sm pl-2">
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
          
          {/* ✅ NEW: Export All */}
          <div className="card bg-gray-50">
            <div className="text-center">
              <h3 className="font-semibold mb-3">Export Complete Analysis</h3>
              <button
                onClick={() => handleExportPDF('complete-analysis')}
                className="btn btn-primary"
              >
                <Download className="w-5 h-5" />
                Export Everything as PDF
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Includes all sections: bullets, cover letter, Q&A, and gap analysis
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}