import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Search, Filter, Download, Mail, Ban, CheckCircle,
  User, Calendar, CreditCard, TrendingUp, MoreVertical,
  Crown, Zap, AlertCircle
} from 'lucide-react'
import api from '../services/api'

function AdminUsers() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('created_desc')

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm, filterPlan, filterStatus, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        plan: filterPlan,
        status: filterStatus,
        sort: sortBy
      })
      const response = await api.get(`/admin/users?${params}`)
      return response.data
    }
  })

  const users = usersData?.users || []
  const stats = usersData?.stats || {}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            User Management
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <StatCard
              label="Total Users"
              value={stats.total || 0}
              icon={User}
              color="blue"
            />
            <StatCard
              label="Free Plan"
              value={stats.free || 0}
              icon={User}
              color="gray"
            />
            <StatCard
              label="Paid Users"
              value={stats.paid || 0}
              icon={Crown}
              color="success"
            />
            <StatCard
              label="Active (7d)"
              value={stats.active_7d || 0}
              icon={TrendingUp}
              color="green"
            />
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Plan Filter */}
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="revenue_desc">Revenue High-Low</option>
            </select>

            {/* Export */}
            <button className="btn btn-outline flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Usage
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No users found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color }) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    gray: 'text-gray-600 bg-gray-50',
    success: 'text-success-600 bg-success-50',
    green: 'text-green-600 bg-green-50'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  )
}

// User Row Component
function UserRow({ user }) {
  const [showMenu, setShowMenu] = useState(false)

  const planBadge = {
    free: 'bg-gray-100 text-gray-700',
    basic: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
    premium: 'bg-success-100 text-success-700'
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* User Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
            {user.full_name?.[0] || user.email[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.full_name || 'No name'}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Plan */}
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${planBadge[user.plan] || planBadge.free}`}>
          {user.plan === 'premium' && <Crown className="w-3 h-3" />}
          {user.plan === 'pro' && <Zap className="w-3 h-3" />}
          {user.plan.toUpperCase()}
        </span>
      </td>

      {/* Usage */}
      <td className="px-6 py-4">
        <div className="text-sm">
          <p className="text-gray-900 font-medium">{user.total_analyses || 0} analyses</p>
          <p className="text-gray-600">{user.total_jobs || 0} jobs</p>
        </div>
      </td>

      {/* Revenue */}
      <td className="px-6 py-4">
        <p className="text-gray-900 font-semibold">
          £{(user.total_revenue || 0).toFixed(2)}
        </p>
      </td>

      {/* Joined */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Send Email
              </button>
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                View Billing
              </button>
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                <Ban className="w-4 h-4" />
                Suspend User
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

export default AdminUsers