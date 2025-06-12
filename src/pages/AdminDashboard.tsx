import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAdminAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { formatPrice, formatDate, getStatusColor } from '../lib/utils';
import OrderManagement from '../components/admin/OrderManagement';
import MenuManagement from '../components/admin/MenuManagement';
import ReservationManagement from '../components/admin/ReservationManagement';
import MessageManagement from '../components/admin/MessageManagement';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdminAuthenticated, adminLogout } = useAdminAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalReservations: 0,
    todayOrders: 0,
    todayRevenue: 0,
    averageOrderValue: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdminAuthenticated) {
      navigate('/admin');
      return;
    }
    fetchStats();
  }, [isAdminAuthenticated, navigate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      // Fetch reservations
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('*');

      if (ordersError || reservationsError) {
        console.error('Error fetching data:', ordersError || reservationsError);
        // Set demo data
        setStats({
          totalOrders: 156,
          totalRevenue: 4250000,
          pendingOrders: 8,
          totalReservations: 23,
          todayOrders: 12,
          todayRevenue: 320000,
          averageOrderValue: 27244,
          completionRate: 94.2
        });
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrders = orders?.filter(order => 
          new Date(order.created_at) >= today
        ) || [];
        
        const completedOrders = orders?.filter(order => 
          order.order_status === 'delivered'
        ) || [];

        setStats({
          totalOrders: orders?.length || 0,
          totalRevenue: orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
          pendingOrders: orders?.filter(order => order.order_status === 'pending').length || 0,
          totalReservations: reservations?.length || 0,
          todayOrders: todayOrders.length,
          todayRevenue: todayOrders.reduce((sum, order) => sum + order.total_amount, 0),
          averageOrderValue: orders?.length ? (orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length) : 0,
          completionRate: orders?.length ? (completedOrders.length / orders.length) * 100 : 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'menu', label: 'Menu', icon: Settings },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const StatCard = ({ title, value, icon: Icon, color, change, subtitle }: any) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-brand-orange to-brand-red rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-xl font-bold text-brand-black">Manziz Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchStats}
                className="p-2 text-gray-600 hover:text-brand-orange transition-colors rounded-lg hover:bg-gray-100"
                title="Refresh Data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-brand-orange transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="bg-white rounded-2xl shadow-lg p-4 sticky top-24">
              <ul className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-brand-orange text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-brand-orange'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    subtitle="All time"
                    icon={Package}
                    color="bg-blue-500"
                    change="+12% from last month"
                  />
                  <StatCard
                    title="Total Revenue"
                    value={formatPrice(stats.totalRevenue)}
                    subtitle="All time"
                    icon={TrendingUp}
                    color="bg-green-500"
                    change="+8% from last month"
                  />
                  <StatCard
                    title="Today's Orders"
                    value={stats.todayOrders}
                    subtitle={formatPrice(stats.todayRevenue)}
                    icon={Clock}
                    color="bg-purple-500"
                  />
                  <StatCard
                    title="Pending Orders"
                    value={stats.pendingOrders}
                    subtitle="Needs attention"
                    icon={AlertCircle}
                    color="bg-yellow-500"
                  />
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Average Order Value"
                    value={formatPrice(stats.averageOrderValue)}
                    icon={BarChart3}
                    color="bg-indigo-500"
                  />
                  <StatCard
                    title="Completion Rate"
                    value={`${stats.completionRate.toFixed(1)}%`}
                    icon={CheckCircle}
                    color="bg-green-500"
                  />
                  <StatCard
                    title="Total Reservations"
                    value={stats.totalReservations}
                    icon={Calendar}
                    color="bg-pink-500"
                  />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-brand-orange hover:bg-orange-50 transition-all duration-200"
                    >
                      <Package className="w-6 h-6 text-brand-orange" />
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">Manage Orders</h4>
                        <p className="text-sm text-gray-600">View and update orders</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('menu')}
                      className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-brand-orange hover:bg-orange-50 transition-all duration-200"
                    >
                      <Settings className="w-6 h-6 text-brand-orange" />
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">Update Menu</h4>
                        <p className="text-sm text-gray-600">Add or edit menu items</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('reservations')}
                      className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-brand-orange hover:bg-orange-50 transition-all duration-200"
                    >
                      <Calendar className="w-6 h-6 text-brand-orange" />
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">Reservations</h4>
                        <p className="text-sm text-gray-600">Manage table bookings</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('messages')}
                      className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-brand-orange hover:bg-orange-50 transition-all duration-200"
                    >
                      <MessageSquare className="w-6 h-6 text-brand-orange" />
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">Messages</h4>
                        <p className="text-sm text-gray-600">Customer support</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">Order #MZ123456 completed</p>
                        <p className="text-sm text-gray-600">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <div className="flex-1">
                        <p className="font-medium">New reservation for 4 guests</p>
                        <p className="text-sm text-gray-600">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <Package className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium">New order #MZ123457 received</p>
                        <p className="text-sm text-gray-600">8 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && <OrderManagement />}
            {activeTab === 'menu' && <MenuManagement />}
            {activeTab === 'reservations' && <ReservationManagement />}
            {activeTab === 'messages' && <MessageManagement />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;