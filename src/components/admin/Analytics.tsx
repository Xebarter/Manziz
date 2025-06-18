import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Calendar,
  Star,
  Clock,
  MapPin
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  totalReservations: number
  averageOrderValue: number
  popularItems: Array<{
    name: string
    count: number
    revenue: number
  }>
  ordersByStatus: Array<{
    status: string
    count: number
  }>
  revenueByDay: Array<{
    date: string
    revenue: number
    orders: number
  }>
  ordersByType: {
    delivery: number
    pickup: number
  }
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalReservations: 0,
    averageOrderValue: 0,
    popularItems: [],
    ordersByStatus: [],
    revenueByDay: [],
    ordersByType: { delivery: 0, pickup: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7') // days

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      const daysAgo = parseInt(dateRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())

      if (ordersError) throw ordersError

      // Fetch order items with menu items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          menu_item:menu_items(name),
          order:orders!inner(created_at)
        `)
        .gte('order.created_at', startDate.toISOString())

      if (itemsError) throw itemsError

      // Fetch reservations
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .gte('created_at', startDate.toISOString())

      if (reservationsError) throw reservationsError

      // Calculate analytics
      const totalRevenue = orders?.reduce((sum, order) => {
        return order.payment_status === 'completed' ? sum + order.total_amount : sum
      }, 0) || 0

      const totalOrders = orders?.length || 0
      const totalReservations = reservations?.length || 0
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Popular items
      const itemCounts: { [key: string]: { count: number; revenue: number; name: string } } = {}
      orderItems?.forEach(item => {
        const name = item.menu_item?.name || 'Unknown Item'
        if (!itemCounts[name]) {
          itemCounts[name] = { count: 0, revenue: 0, name }
        }
        itemCounts[name].count += item.quantity
        itemCounts[name].revenue += item.price_at_time * item.quantity
      })

      const popularItems = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Orders by status
      const statusCounts: { [key: string]: number } = {}
      orders?.forEach(order => {
        statusCounts[order.order_status] = (statusCounts[order.order_status] || 0) + 1
      })

      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }))

      // Revenue by day
      const dailyData: { [key: string]: { revenue: number; orders: number } } = {}
      orders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString()
        if (!dailyData[date]) {
          dailyData[date] = { revenue: 0, orders: 0 }
        }
        if (order.payment_status === 'completed') {
          dailyData[date].revenue += order.total_amount
        }
        dailyData[date].orders += 1
      })

      const revenueByDay = Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          orders: data.orders
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Orders by type
      const ordersByType = {
        delivery: orders?.filter(order => order.delivery_type === 'delivery').length || 0,
        pickup: orders?.filter(order => order.delivery_type === 'pickup').length || 0
      }

      setAnalytics({
        totalRevenue,
        totalOrders,
        totalReservations,
        averageOrderValue,
        popularItems,
        ordersByStatus,
        revenueByDay,
        ordersByType
      })

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-lg text-gray-600 mt-2">Track your restaurant's performance and insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base min-w-[160px]"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <div className="flex items-center">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 lg:w-8 lg:h-8 text-green-600" />
            </div>
            <div className="ml-4 lg:ml-6 min-w-0 flex-1">
              <p className="text-sm lg:text-base font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                UGX {analytics.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <div className="flex items-center">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 lg:w-8 lg:h-8 text-blue-600" />
            </div>
            <div className="ml-4 lg:ml-6">
              <p className="text-sm lg:text-base font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">{analytics.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <div className="flex items-center">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 lg:w-8 lg:h-8 text-purple-600" />
            </div>
            <div className="ml-4 lg:ml-6">
              <p className="text-sm lg:text-base font-medium text-gray-600">Reservations</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">{analytics.totalReservations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <div className="flex items-center">
            <div className="w-14 h-14 lg:w-16 lg:h-16 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 lg:w-8 lg:h-8 text-orange-600" />
            </div>
            <div className="ml-4 lg:ml-6 min-w-0 flex-1">
              <p className="text-sm lg:text-base font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                UGX {Math.round(analytics.averageOrderValue).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
        {/* Popular Items */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6">Popular Menu Items</h3>
          <div className="space-y-6">
            {analytics.popularItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-sm lg:text-base font-bold text-orange-600">#{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate text-base lg:text-lg">{item.name}</p>
                    <p className="text-sm lg:text-base text-gray-500">{item.count} orders</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900 text-base lg:text-lg">
                    UGX {item.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6">Order Status Distribution</h3>
          <div className="space-y-6">
            {analytics.ordersByStatus.map((status) => (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-orange-600 rounded-full"></div>
                  <span className="font-medium text-gray-900 capitalize text-base lg:text-lg">
                    {status.status.replace('_', ' ')}
                  </span>
                </div>
                <span className="font-semibold text-gray-900 text-lg">{status.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
        <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6">Revenue Trend</h3>
        <div className="space-y-4">
          {analytics.revenueByDay.map((day) => (
            <div key={day.date} className="flex items-center justify-between p-4 lg:p-6 bg-gray-50 rounded-xl">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-base lg:text-lg">{day.date}</p>
                <p className="text-sm lg:text-base text-gray-500">{day.orders} orders</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-gray-900 text-base lg:text-lg">
                  UGX {day.revenue.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Type Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6">Order Type Distribution</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <MapPin className="w-6 h-6 lg:w-7 lg:h-7 text-purple-600" />
                <span className="font-medium text-gray-900 text-base lg:text-lg">Delivery</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg">{analytics.ordersByType.delivery}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Clock className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600" />
                <span className="font-medium text-gray-900 text-base lg:text-lg">Pickup</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg">{analytics.ordersByType.pickup}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6">Performance Summary</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-base lg:text-lg">Total Revenue</span>
              <span className="font-semibold text-green-600 text-base lg:text-lg">
                UGX {analytics.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-base lg:text-lg">Completed Orders</span>
              <span className="font-semibold text-blue-600 text-lg">{analytics.totalOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-base lg:text-lg">Average Order Value</span>
              <span className="font-semibold text-orange-600 text-base lg:text-lg">
                UGX {Math.round(analytics.averageOrderValue).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-base lg:text-lg">Table Reservations</span>
              <span className="font-semibold text-purple-600 text-lg">{analytics.totalReservations}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics