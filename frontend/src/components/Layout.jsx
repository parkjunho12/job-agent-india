import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  CreditCard,
  User, 
  Settings, 
  LogOut,
  Sparkles 
} from 'lucide-react'

function Layout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Applications', path: '/applications', icon: FileText },
    { name: 'Experiences', path: '/experiences', icon: User },
    { name: 'Billing', path: '/billing', icon: CreditCard },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center gap-2 p-6 border-b border-gray-200">
          <Sparkles className="w-8 h-8 text-primary-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Job Agent</h1>
          </div>
        </div>
        
        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
              {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          
          {/* Tier Badge */}
          <div className="mt-3">
            <span className={`badge ${
              user?.plan === 'free' ? 'badge-primary' :
              user?.plan === 'basic' ? 'badge-basic-primary' :
              user?.plan === 'pro' ? 'badge-success' : 
              'bg-purple-100 text-purple-700'
            }`}>
              {user?.plan?.toUpperCase() || 'FREE'} Plan
            </span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 space-y-1">
          
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout