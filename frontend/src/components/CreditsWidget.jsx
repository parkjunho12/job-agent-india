import { useQuery } from '@tanstack/react-query'
import { billingApi } from '../services/api'
import { Zap, Loader2 } from 'lucide-react'

function CreditsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['billing', 'credits'],
    queryFn: billingApi.getCredits,
    staleTime: 30_000,
    refetchInterval: 60_000
  })
  
  const credits = data?.data?.credits || 0
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg">
      <Zap className="w-4 h-4 text-primary-600" />
      <span className="text-sm font-medium text-gray-900">
        {credits} Credits
      </span>
    </div>
  )
}

export default CreditsWidget