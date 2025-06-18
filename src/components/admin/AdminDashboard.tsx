import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  MessageSquare, 
  Calendar, 
  Settings, 
  Menu, 
  X,
  LogOut
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Overview from './Overview'
import OrderManagement from './OrderManagement'
import MenuManagement from './MenuManagement'
import ChatManagement from './ChatManagement'
import ReservationManagement from './ReservationManagement'
import SettingsManagement from './SettingsManagement'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Create an icon map to avoid multiple imports
const icons = {
  dashboard: LayoutDashboard,
  orders: ShoppingCart,
  chat: MessageSquare,
  reservations: Calendar,
  settings: Settings,
  menu: Menu,
  close: X,
  logout: LogOut
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      if (!session) {
        navigate('/admin/login')
      }
    } catch (error) {
      console.error('Auth error:', error)
      navigate('/admin/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigate('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />
      case 'orders':
        return <OrderManagement />
      case 'menu':
        return <MenuManagement />
      case 'chat':
        return <ChatManagement />
      case 'reservations':
        return <ReservationManagement />
      case 'settings':
        return <SettingsManagement />
      default:
        return <Overview />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isSidebarOpen ? (
          <icons.close className="w-6 h-6 text-gray-600" />
        ) : (
          <icons.menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-orange-600">Manziz Admin</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <icons.dashboard className="w-5 h-5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'orders'
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <icons.orders className="w-5 h-5" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'menu'
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <icons.menu className="w-5 h-5" />
              <span>Menu</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'chat'
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <icons.chat className="w-5 h-5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('reservations')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'reservations'
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <icons.reservations className="w-5 h-5" />
              <span>Reservations</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <icons.settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <icons.logout className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`lg:ml-64 min-h-screen transition-all duration-300 ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard 