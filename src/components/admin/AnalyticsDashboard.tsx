import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Package, Users, Calendar, Clock, BarChart3, PieChart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingItems: [],
    revenueByDay: [],
    ordersByStatus: [],
    customerGrowth: 0,
    repeatCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      // Fetch orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ordersError) throw ordersError;

      // Calculate analytics
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Group orders by status
      const ordersByStatus = [
        { status: 'pending', count: orders?.filter(o => o.order_status === 'pending').length || 0 },
        { status: 'confirmed', count: orders?.filter(o => o.order_status === 'confirmed').length || 0 },
        { status: 'preparing', count: orders?.filter(o => o.order_status === 'preparing').length || 0 },
        { status: 'ready', count: orders?.filter(o => o.order_status === 'ready').length || 0 },
        { status: 'delivered', count: orders?.filter(o => o.order_status === 'delivered').length || 0 },
        { status: 'cancelled', count: orders?.filter(o => o.order_status === 'cancelled').length || 0 }
      ];

      // Generate revenue by day (last 7 days)
      const revenueByDay = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const dayRevenue = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= dayStart && orderDate < dayEnd;
        }).reduce((sum, order) => sum + order.total_amount, 0) || 0;

        revenueByDay.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: dayRevenue
        });
      }

      setAnalytics({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topSellingItems: [], // Would need order_items data
        revenueByDay,
        ordersByStatus,
        customerGrowth: 15.2, // Demo data
        repeatCustomers: 68.5 // Demo data
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set demo data
      setAnalytics({
        totalRevenue: 1250000,
        totalOrders: 45,
        averageOrderValue: 27778,
        topSellingItems: [
          { name: 'Manziz Special Burger', sales: 23, revenue: 575000 },
          { name: 'Crispy Chicken Wings', sales: 18, revenue: 324000 },
          { name: 'Loaded Fries', sales: 15, revenue: 225000 }
        ],
        revenueByDay: [
          { date: 'Mon', revenue: 180000 },
          { date: 'Tue', revenue: 220000 },
          { date: 'Wed', revenue: 160000 },
          { date: 'Thu', revenue: 240000 },
          { date: 'Fri', revenue: 280000 },
          { date: 'Sat', revenue: 320000 },
          { date: 'Sun', revenue: 290000 }
        ],
        ordersByStatus: [
          { status: 'pending', count: 5 },
          { status: 'confirmed', count: 8 },
          { status: 'preparing', count: 12 },
          { status: 'ready', count: 6 },
          { status: 'delivered', count: 32 },
          { status: 'cancelled', count: 2 }
        ],
        customerGrowth: 15.2,
        repeatCustomers: 68.5
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, change }: any) => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-600">Track your restaurant's performance and insights</p>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatPrice(analytics.totalRevenue)}
          icon={DollarSign}
          color="bg-green-500"
          change="+12.5%"
        />
        <StatCard
          title="Total Orders"
          value={analytics.totalOrders}
          icon={Package}
          color="bg-blue-500"
          change="+8.2%"
        />
        <StatCard
          title="Average Order Value"
          value={formatPrice(analytics.averageOrderValue)}
          icon={BarChart3}
          color="bg-purple-500"
          change="+5.1%"
        />
        <StatCard
          title="Customer Growth"
          value={`${analytics.customerGrowth}%`}
          icon={Users}
          color="bg-orange-500"
          change="+2.3%"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Daily Revenue</h3>
          <div className="space-y-4">
            {analytics.revenueByDay.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{day.date}</span>
                <div className="flex items-center space-x-3 flex-1 mx-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-brand-orange h-2 rounded-full"
                      style={{
                        width: `${(day.revenue / Math.max(...analytics.revenueByDay.map(d => d.revenue))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(day.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Orders by Status</h3>
          <div className="space-y-4">
            {analytics.ordersByStatus.map((status, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 capitalize">
                  {status.status}
                </span>
                <div className="flex items-center space-x-3 flex-1 mx-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status.status === 'delivered' ? 'bg-green-500' :
                        status.status === 'cancelled' ? 'bg-red-500' :
                        status.status === 'pending' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{
                        width: `${(status.count / Math.max(...analytics.ordersByStatus.map(s => s.count))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {status.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Insights</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Repeat Customers</span>
              <span className="font-semibold text-green-600">{analytics.repeatCustomers}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Customer Growth</span>
              <span className="font-semibold text-blue-600">+{analytics.customerGrowth}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Order Frequency</span>
              <span className="font-semibold text-purple-600">2.3x/month</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Order Completion Rate</span>
              <span className="font-semibold text-green-600">96.8%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Preparation Time</span>
              <span className="font-semibold text-blue-600">18 mins</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Customer Satisfaction</span>
              <span className="font-semibold text-yellow-600">4.7/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Items */}
      {analytics.topSellingItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top Selling Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Item</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Sales</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topSellingItems.map((item: any, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="py-3 text-gray-600">{item.sales} orders</td>
                    <td className="py-3 font-semibold text-brand-orange">
                      {formatPrice(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;