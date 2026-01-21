import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, RefreshCw, CheckCircle, XCircle, 
  Clock, AlertCircle
} from 'lucide-react'
import VerdictDisplay from '../components/VerdictDisplay'
import {jobsApi, analysisApi} from '../services/api'

function JobAnalysis() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isLimitError = (err) => {
    const status = err?.response?.status
    return status === 403 || status === 429
  }
  
  const getErrorDetail = (err) => {
    console.error('API Error:', err)
    return err?.response?.data?.error || err?.message || 'Request failed'
  }
  const [limitBanner, setLimitBanner] = useState(null)
  // Fetch job details

  const { data: jobData, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId)
  })

  // Fetch cached verdict (analyze와 동일 스키마라고 가정)
  const verdictQuery = useQuery({
    queryKey: ['analysis', jobId],
    enabled: !!jobId,
    queryFn: async () => analysisApi.getVerdict(jobId)
    ,
    retry: false, // 404면 isError로 빠지게
    onError: (err) => {
      if (isLimitError(err)) {
        console.error('Limit error fetching verdict:', err)
        setLimitBanner({
          title: 'Premium analysis is locked',
          message: getErrorDetail(err) || 'Upgrade or buy credits to view this analysis.',
        })
      }
    }
  })

  // Analyze mutation (처음 분석 or 재분석 둘 다 사용)
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      setLimitBanner(null)
      return analysisApi.analyzeJob(jobId)
    },
    onSuccess: (data) => {
      // 분석 결과를 캐시에 즉시 반영
      queryClient.setQueryData(['analysis', jobId], data)
      
    },
    onError: (err) => {
      if (isLimitError(err)) {
        setLimitBanner({
          title: 'Not enough credits to run analysis',
          message: getErrorDetail(err) || 'Upgrade or buy credits to analyze this job.',
        })
      } else {
        setLimitBanner({
          title: 'Analysis failed',
          message: getErrorDetail(err),
        })
      }
    }
  })

  // Mark decision mutation
  const markDecisionMutation = useMutation({
    mutationFn: (decision) => analysisApi.markDecision(jobId, decision),
    onSuccess: () => {
      verdictQuery.refetch()
    }
  })

  // Re-analyze (버튼에서만 호출)
  const handleReanalyze = () => {
    analyzeMutation.mutate()
  }

  const onError = (err) => {
    console.log('Analysis error:', err)
    if (isLimitError(err)) {
      setLimitBanner({
        title: 'Not enough credits to run analysis',
        message: getErrorDetail(err) || 'Upgrade or buy credits to analyze this job.',
      })
    } else {
      setLimitBanner({
        title: 'Analysis failed',
        message: getErrorDetail(err),
      })
    }
  }

  // (선택) verdict가 404로 실패하면 자동으로 1회 분석 실행하고 싶을 때
  // 원치 않으면 이 useEffect 삭제하면 됨.
  useEffect(() => {
    if (!jobId) return
    if (verdictQuery.isError && !analyzeMutation.isPending && !analyzeMutation.isSuccess) {
      // 404 포함해서 verdict가 없으면 분석 시도
      // 다른 에러까지 자동 분석이 싫으면, 백엔드에서 404 구분해서 여기서 조건 처리 권장
      // 지금은 "최소 변경"이라 단순 처리
      // analyzeMutation.mutate()
    }
  }, [jobId, verdictQuery.isError]) // eslint-disable-line react-hooks/exhaustive-deps

  // Loading (job or verdict or analyzing)
  const isLoading = jobLoading || verdictQuery.isLoading || analyzeMutation.isPending
  const job = jobData?.data

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {analyzeMutation.isPending ? 'Analyzing your match...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Job not found</p>
          <button onClick={() => navigate(`/jobs/${jobId}`)} className="btn btn-secondary">
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  // verdict가 아직 없을 때(대개 404) → 분석 시작 UI
  

  // verdict 데이터 (캐시 or 방금 분석 결과)
  const verdictData = verdictQuery.data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button 
            onClick={() => navigate(`/jobs/${jobId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Jobs
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {job.title}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span>{job.company}</span>
                <span>•</span>
                <span>{job.location}</span>
              </div>
            </div>
            {verdictData &&(
              <button 
              onClick={handleReanalyze}
              disabled={analyzeMutation.isPending}
              className="btn btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
              Re-analyze
            </button>
            )}

          </div>
        </div>
      </div>

      {limitBanner && (
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-bold text-yellow-900">{limitBanner.title}</p>
                <p className="text-sm text-yellow-800 mt-1">{limitBanner.message}</p>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => navigate('/billing')}
                    className="btn btn-primary"
                  >
                    Upgrade / Buy Credits
                  </button>
                  <button
                    onClick={() => setLimitBanner(null)}
                    className="btn btn-outline"
                  >
                    Dismiss
                  </button>
                </div>

                <p className="text-xs text-yellow-700 mt-2">
                  Tip: One analysis uses 1 credit. Upgrade for unlimited usage if you analyze multiple jobs daily.
                </p>
              </div>

              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Verdict Display */}
        <VerdictDisplay 
          verdictData={verdictData}
          isPremium={!!verdictData?.is_premium}
          job={job}
          jobId={jobId}
          onJobUpdate={(updatedJob) => {
            // Invalidate queries to refresh
           
            queryClient.invalidateQueries(['job', jobId])
            queryClient.invalidateQueries(['verdict', jobId])
          }}
          onError={onError}
        />
        {/* Action Buttons */}
        {verdictData &&(
          <div className="mt-8 flex gap-4 justify-center">
          <button 
            onClick={() => markDecisionMutation.mutate('skipped')}
            disabled={markDecisionMutation.isPending}
            className="btn btn-secondary btn-lg flex items-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Skip This Job
          </button>

          <button 
            onClick={() => markDecisionMutation.mutate('saved')}
            disabled={markDecisionMutation.isPending}
            className="btn btn-secondary btn-lg flex items-center gap-2"
          >
            <Clock className="w-5 h-5" />
            Save for Later
          </button>

          <button 
            onClick={() => markDecisionMutation.mutate('applied')}
            disabled={markDecisionMutation.isPending}
            className="btn btn-primary btn-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Mark as Applied
          </button>
        </div>
        )}

        {/* Job Description */}
        <details className="mt-8 bg-white rounded-xl p-6 border-2 border-gray-200">
          <summary className="font-bold text-gray-900 cursor-pointer">
            View Full Job Description
          </summary>
          <div className="mt-4 prose prose-sm max-w-none">
            {job.description}
          </div>
        </details>
      </div>
    </div>
  )
}

export default JobAnalysis
