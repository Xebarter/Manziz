import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  MessageSquare,
  Eye,
  Phone,
  Star,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Message } from '../../lib/supabase'

interface Stats {
  totalRevenue: number
  totalOrders: number
  totalReservations: number
  pendingOrders: number
  pendingReservations: number
  totalMessages: number
  unreadMessages: number
  recentOrders: any[]
  recentReservations: any[]
  recentMessages: Message[]
  revenueGrowth: number
  ordersGrowth: number
}

const Overview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalReservations: 0,
    pendingOrders: 0,
    pendingReservations: 0,
    totalMessages: 0,
    unreadMessages: 0,
    recentOrders: [],
    recentReservations: [],
    recentMessages: [],
    revenueGrowth: 0,
    ordersGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('today')

  useEffect(() => {
    fetchStats()
  }, [selectedTimeframe])

  const fetchStats = async () => {
    try {
      const now = new Date()
      let startDate = new Date()
      
      // Set date range based on selected timeframe
      switch (selectedTimeframe) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }

      // Fetch orders statistics
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())

      if (ordersError) throw ordersError

      // Fetch all orders for growth calculation
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders')
        .select('*')

      if (allOrdersError) throw allOrdersError

      // Fetch reservations statistics
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .gte('created_at', startDate.toISOString())

      if (reservationsError) throw reservationsError

      // Fetch all reservations for pending count
      const { data: allReservations, error: allReservationsError } = await supabase
        .from('reservations')
        .select('*')

      if (allReservationsError) throw allReservationsError

      // Fetch messages statistics
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (messagesError) throw messagesError

      // Calculate revenue and growth
      const currentRevenue = orders?.reduce((sum, order) => {
        return order.payment_status === 'completed' ? sum + order.total_amount : sum
      }, 0) || 0

      // Calculate previous period for growth comparison
      const previousStartDate = new Date(startDate)
      const timeDiff = now.getTime() - startDate.getTime()
      previousStartDate.setTime(startDate.getTime() - timeDiff)

      const { data: previousOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString())

      const previousRevenue = previousOrders?.reduce((sum, order) => {
        return order.payment_status === 'completed' ? sum + order.total_amount : sum
      }, 0) || 0

      const revenueGrowth = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0

      const ordersGrowth = previousOrders?.length > 0 
        ? ((orders?.length - previousOrders.length) / previousOrders.length) * 100 
        : 0

      const pendingOrders = orders?.filter(order => 
        ['received', 'preparing', 'out_for_delivery', 'ready_for_pickup'].includes(order.order_status)
      ).length || 0

      // Count pending reservations (pending status)
      const pendingReservations = allReservations?.filter(reservation => 
        reservation.status === 'pending'
      ).length || 0

      // Count customer messages (unread = from customers)
      const customerMessages = messages?.filter(msg => msg.sender === 'customer') || []
      const unreadMessages = customerMessages.length

      // Get recent orders with order items
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_item:menu_items(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentOrdersError) throw recentOrdersError

      // Get recent reservations
      const { data: recentReservationsData, error: recentReservationsError } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentReservationsError) throw recentReservationsError

      setStats({
        totalRevenue: currentRevenue,
        totalOrders: orders?.length || 0,
        totalReservations: reservations?.length || 0,
        pendingOrders,
        pendingReservations,
        totalMessages: messages?.length || 0,
        unreadMessages,
        recentOrders: recentOrdersData || [],
        recentReservations: recentReservationsData || [],
        recentMessages: messages?.slice(0, 5) || [],
        revenueGrowth,
        ordersGrowth
      })

    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-blue-100 text-blue-800'
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800'
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800'
      case 'ready_for_pickup':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0
    const Icon = isPositive ? ArrowUp : ArrowDown
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
    
    return (
      <div className={`flex items-center ${colorClass}`}>
        <Icon className="w-4 h-4 mr-1" />
        <span className="text-sm font-medium">{Math.abs(growth).toFixed(1)}%</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-lg text-gray-600 mt-2">Welcome to your restaurant management dashboard</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base min-w-[160px]"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-7 h-7 lg:w-8 lg:h-8 text-green-600" />
              </div>
              <div className="ml-4 lg:ml-6 min-w-0 flex-1">
                <p className="text-sm lg:text-base font-medium text-gray-600">Revenue</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  UGX {stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="hidden lg:block ml-4">
              {formatGrowth(stats.revenueGrowth)}
            </div>
          </div>
          <div className="lg:hidden mt-3 flex justify-end">
            {formatGrowth(stats.revenueGrowth)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-7 h-7 lg:w-8 lg:h-8 text-blue-600" />
              </div>
              <div className="ml-4 lg:ml-6 min-w-0 flex-1">
                <p className="text-sm lg:text-base font-medium text-gray-600">Orders</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
            <div className="hidden lg:block ml-4">
              {formatGrowth(stats.ordersGrowth)}
            </div>
          </div>
          <div className="lg:hidden mt-3 flex justify-end">
            {formatGrowth(stats.ordersGrowth)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-7 h-7 lg:w-8 lg:h-8 text-purple-600" />
            </div>
            <div className="ml-4 lg:ml-6 min-w-0 flex-1">
              <p className="text-sm lg:text-base font-medium text-gray-600">Reservations</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalReservations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-7 h-7 lg:w-8 lg:h-8 text-orange-600" />
            </div>
            <div className="ml-4 lg:ml-6 min-w-0 flex-1">
              <p className="text-sm lg:text-base font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages and Communication Stats */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl lg:text-2xl font-semibold text-gray-900">Customer Messages</h3>
            <button
              onClick={() => window.location.href = '/admin/chat'}
              className="text-orange-600 hover:text-orange-700 text-base font-medium px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors"
            >
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center p-4 lg:p-6 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-blue-600">{stats.totalMessages}</p>
              <p className="text-sm lg:text-base text-gray-600 mt-1">Total Messages</p>
            </div>
            <div className="text-center p-4 lg:p-6 bg-red-50 rounded-xl">
              <div className="flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 lg:w-7 lg:h-7 text-red-600" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-red-600">{stats.unreadMessages}</p>
              <p className="text-sm lg:text-base text-gray-600 mt-1">Customer Messages</p>
            </div>
          </div>

          {stats.recentMessages.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-base lg:text-lg font-medium text-gray-700">Recent Messages</h4>
              {stats.recentMessages.slice(0, 3).map((message) => (
                <div key={message.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-medium text-base ${
                      message.sender === 'customer' ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {message.sender === 'customer' ? 'Customer' : 'Admin'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700 line-clamp-2">{message.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6">Revenue Breakdown</h3>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 lg:p-6 bg-green-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 text-base lg:text-lg">Completed Orders</p>
                <p className="text-sm lg:text-base text-gray-600">
                  {stats.recentOrders.filter(o => o.payment_status === 'completed').length} orders
                </p>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-green-600">
                UGX {stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            
            <div className="flex justify-between items-center p-4 lg:p-6 bg-yellow-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 text-base lg:text-lg">Pending Payments</p>
                <p className="text-sm lg:text-base text-gray-600">
                  {stats.recentOrders.filter(o => o.payment_status === 'pending').length} orders
                </p>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-yellow-600">
                UGX {stats.recentOrders
                  .filter(o => o.payment_status === 'pending')
                  .reduce((sum, o) => sum + o.total_amount, 0)
                  .toLocaleString()}
              </p>
            </div>

            <div className="flex justify-between items-center p-4 lg:p-6 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 text-base lg:text-lg">Average Order Value</p>
                <p className="text-sm lg:text-base text-gray-600">Per completed order</p>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-gray-600">
                UGX {stats.totalOrders > 0 
                  ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString()
                  : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Recent Orders</h2>
              <button
                onClick={() => window.location.href = '/admin/orders'}
                className="text-orange-600 hover:text-orange-700 text-base font-medium px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-6 lg:p-8">
            {stats.recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-lg">No recent orders</p>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order, index) => (
                  <div key={order.id} className="flex items-center justify-between p-4 lg:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-lg">#{order.id.slice(0, 8)}</p>
                      <p className="text-base text-gray-600 truncate">{order.customer_name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.order_items?.length || 0} items • UGX {order.total_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right ml-6">
                      <span className={`px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                        {order.order_status.replace('_', ' ')}
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Reservations */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Recent Reservations</h2>
              <button
                onClick={() => window.location.href = '/admin/reservations'}
                className="text-orange-600 hover:text-orange-700 text-base font-medium px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-6 lg:p-8">
            {stats.recentReservations.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-lg">No recent reservations</p>
            ) : (
              <div className="space-y-4">
                {stats.recentReservations.map((reservation, index) => (
                  <div key={reservation.id} className="flex items-center justify-between p-4 lg:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-lg truncate">{reservation.name}</p>
                      <p className="text-base text-gray-600 truncate">{reservation.phone_number}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {reservation.guests} guests • {new Date(reservation.reservation_time).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right ml-6">
                      <span className={`px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(reservation.reservation_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
        <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
          <button
            onClick={() => window.location.href = '/admin/menu'}
            className="p-4 lg:p-6 text-center bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors group"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <p className="text-sm lg:text-base font-medium text-gray-900">Add Menu Item</p>
          </button>

          <button
            onClick={() => window.location.href = '/admin/orders'}
            className="p-4 lg:p-6 text-center bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group relative"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <p className="text-sm lg:text-base font-medium text-gray-900">View Orders</p>
            {stats.pendingOrders > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center font-bold">
                {stats.pendingOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => window.location.href = '/admin/reservations'}
            className="p-4 lg:p-6 text-center bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group relative"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <p className="text-sm lg:text-base font-medium text-gray-900">Reservations</p>
            {stats.pendingReservations > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center font-bold">
                {stats.pendingReservations}
              </span>
            )}
          </button>

          <button
            onClick={() => window.location.href = '/admin/chat'}
            className="p-4 lg:p-6 text-center bg-green-50 hover:bg-green-100 rounded-xl transition-colors relative group"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <p className="text-sm lg:text-base font-medium text-gray-900">Messages</p>
            {stats.unreadMessages > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center font-bold">
                {stats.unreadMessages}
              </span>
            )}
          </button>

          <button
            onClick={() => window.location.href = '/admin/analytics'}
            className="p-4 lg:p-6 text-center bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors group"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <p className="text-sm lg:text-base font-medium text-gray-900">Analytics</p>
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="p-4 lg:p-6 text-center bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Eye className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <p className="text-sm lg:text-base font-medium text-gray-900">View Website</p>
          </button>
        </div>
      </div>

      {/* Alerts and Notifications */}
      {(stats.pendingOrders > 0 || stats.unreadMessages > 0 || stats.pendingReservations > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 lg:p-8">
          <h3 className="text-xl lg:text-2xl font-semibold text-yellow-800 mb-4">Attention Required</h3>
          <div className="space-y-3">
            {stats.pendingOrders > 0 && (
              <div className="flex items-center text-yellow-700">
                <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" />
                <span className="text-base lg:text-lg">You have {stats.pendingOrders} pending orders that need attention</span>
              </div>
            )}
            {stats.unreadMessages > 0 && (
              <div className="flex items-center text-yellow-700">
                <MessageSquare className="w-6 h-6 mr-3 flex-shrink-0" />
                <span className="text-base lg:text-lg">You have {stats.unreadMessages} new customer messages</span>
              </div>
            )}
            {stats.pendingReservations > 0 && (
              <div className="flex items-center text-yellow-700">
                <Calendar className="w-6 h-6 mr-3 flex-shrink-0" />
                <span className="text-base lg:text-lg">You have {stats.pendingReservations} pending reservations awaiting confirmation</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Overview