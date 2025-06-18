import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Menu as MenuIcon, 
  ShoppingBag, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  LogOut,
  Settings,
  X,
  ArrowLeft,
  ExternalLink,
  ChevronDown,
  User,
  HelpCircle
} from 'lucide-react'
import MenuManagement from '../../components/admin/MenuManagement'
import OrderManagement from '../../components/admin/OrderManagement'
import ReservationManagement from '../../components/admin/ReservationManagement'
import ChatManagement from '../../components/admin/ChatManagement'
import Analytics from '../../components/admin/Analytics'
import Overview from '../../components/admin/Overview'
import AdminLogin from './AdminLogin'

const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const navigation = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Menu Management', href: '/admin/menu', icon: MenuIcon },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Reservations', href: '/admin/reservations', icon: Calendar },
    { name: 'Chat Support', href: '/admin/chat', icon: MessageSquare },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ]

  useEffect(() => {
    const checkAuthStatus = () => {
      const adminSession = localStorage.getItem('manziz_admin_session')
      
      if (!adminSession) {
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      try {
        const session = JSON.parse(adminSession)
        if (session.expires > Date.now()) {
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem('manziz_admin_session')
          setIsAuthenticated(false)
        }
      } catch (error) {
        localStorage.removeItem('manziz_admin_session')
        setIsAuthenticated(false)
      }
      
      setIsLoading(false)
    }

    checkAuthStatus()
  }, []) // Empty dependency array since we only want to check on mount

  const handleLogout = () => {
    localStorage.removeItem('manziz_admin_session')
    setIsAuthenticated(false)
    navigate('/admin/login')
  }

  const goToWebsite = () => {
    window.open('/', '_blank')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-lg font-bold text-gray-900">Manziz</span>
          </div>
          <div className="w-6"></div> {/* Spacer for balance */}
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="relative w-72 h-full bg-white shadow-xl">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Manziz Admin</span>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="mt-6 px-4 flex-1 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href === '/admin' && location.pathname === '/admin/')
                
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.href)
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={goToWebsite}
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <ExternalLink className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Back to Website</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Manziz Admin</span>
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href === '/admin' && location.pathname === '/admin/')
                
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={goToWebsite}
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <ExternalLink className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Back to Website</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome to Manziz Admin Dashboard
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={goToWebsite}
                className="hidden sm:flex items-center space-x-2 px-3 py-1.5 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Website</span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route index element={<Overview />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="reservations" element={<ReservationManagement />} />
              <Route path="chat" element={<ChatManagement />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard