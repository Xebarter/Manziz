import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Package, Clock, Edit2, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../lib/store';
import { AuthService } from '../lib/auth';
import { formatPrice, formatDate, getStatusColor } from '../lib/utils';
import toast from 'react-hot-toast';

interface ProfileForm {
  full_name: string;
  phone_number: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, updateUser, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    reset({
      full_name: user.full_name || '',
      phone_number: user.phone_number || ''
    });

    fetchUserOrders();
  }, [isAuthenticated, user, navigate, reset]);

  const fetchUserOrders = async () => {
    if (!user) return;

    try {
      const { orders: userOrders, error } = await AuthService.getUserOrders(user.id);
      if (error) {
        console.error('Error fetching orders:', error);
        // Set demo orders for testing
        setOrders([
          {
            id: '1',
            total_amount: 35000,
            order_status: 'delivered',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            scheduled_for: null,
            order_items: [
              { quantity: 2, menu_item: { name: 'Manziz Special Burger' } },
              { quantity: 1, menu_item: { name: 'Loaded Fries' } }
            ]
          },
          {
            id: '2',
            total_amount: 22000,
            order_status: 'preparing',
            created_at: new Date().toISOString(),
            scheduled_for: new Date(Date.now() + 3600000).toISOString(),
            order_items: [
              { quantity: 1, menu_item: { name: 'Classic Cheese Burger' } }
            ]
          }
        ]);
      } else {
        setOrders(userOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;

    setLoading(true);
    try {
      const { user: updatedUser, error } = await AuthService.updateProfile(user.id, data);
      
      if (error) {
        toast.error(error);
        return;
      }

      updateUser(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (!user) {
    return null;
  }

  const upcomingOrders = orders.filter(order => 
    order.scheduled_for && new Date(order.scheduled_for) > new Date()
  );

  const recentOrders = orders.filter(order => 
    !order.scheduled_for || new Date(order.scheduled_for) <= new Date()
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-black">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account and view your orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-brand-orange hover:text-brand-red transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      reset({
                        full_name: user.full_name || '',
                        phone_number: user.phone_number || ''
                      });
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      {...register('full_name', { required: 'Full name is required' })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    />
                    {errors.full_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      {...register('phone_number', {
                        pattern: {
                          value: /^[0-9+\-\s()]+$/,
                          message: 'Please enter a valid phone number'
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    />
                    {errors.phone_number && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone_number.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-orange text-white py-2 px-4 rounded-lg font-semibold hover:bg-brand-red transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-semibold">{user.full_name || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{user.phone_number || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="font-semibold">{formatDate(user.created_at)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full text-red-600 hover:text-red-800 font-semibold transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Scheduled Orders */}
            {upcomingOrders.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-brand-orange" />
                  Upcoming Scheduled Orders
                </h3>
                <div className="space-y-4">
                  {upcomingOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-600">
                            Scheduled for: {formatDate(order.scheduled_for)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                          {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {order.order_items?.map((item: any, index: number) => (
                          <span key={index}>
                            {item.quantity}x {item.menu_item?.name}
                            {index < order.order_items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                      <p className="font-bold text-brand-orange">{formatPrice(order.total_amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-brand-orange" />
                Recent Orders
              </h3>
              
              {loadingOrders ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No orders yet</p>
                  <button
                    onClick={() => navigate('/menu')}
                    className="mt-4 bg-brand-orange text-white px-6 py-2 rounded-lg hover:bg-brand-red transition-colors"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                          {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {order.order_items?.map((item: any, index: number) => (
                          <span key={index}>
                            {item.quantity}x {item.menu_item?.name}
                            {index < order.order_items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                      <p className="font-bold text-brand-orange">{formatPrice(order.total_amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;