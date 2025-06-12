import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, Clock, CheckCircle, Truck, MapPin } from 'lucide-react';
import { supabase, Order } from '../lib/supabase';
import { formatPrice, formatDate, getStatusColor } from '../lib/utils';
import toast from 'react-hot-toast';

const TrackOrder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const statusSteps = [
    { key: 'pending', label: 'Order Received', icon: Package },
    { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
    { key: 'preparing', label: 'Preparing', icon: Clock },
    { key: 'ready', label: 'Ready', icon: CheckCircle },
    { key: 'delivered', label: 'Delivered', icon: Truck }
  ];

  useEffect(() => {
    if (orderId) {
      trackOrder();
    }
  }, [orderId]);

  const trackOrder = async () => {
    if (!orderId.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      if (data) {
        setOrder(data);
      } else {
        toast.error('Order not found');
        setOrder(null);
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      toast.error('Order not found');
      setOrder(null);
      
      // Demo order for testing
      setOrder({
        id: orderId,
        customer_name: 'John Doe',
        phone_number: '+256784811208',
        delivery_type: 'delivery',
        delivery_address: '123 Main Street, Kampala',
        order_status: 'preparing',
        total_amount: 35000,
        payment_status: 'completed',
        created_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    return statusSteps.findIndex(step => step.key === order.order_status);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    trackOrder();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-black mb-4">Track Your Order</h1>
          <p className="text-gray-600">
            Enter your order ID to see real-time updates on your delicious meal
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter your order ID (e.g., MZ123456)"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>
        </div>

        {/* Order Details */}
        {order && (
          <div className="space-y-6 animate-slide-up">
            {/* Order Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Order #{orderId}
                  </h2>
                  <p className="text-gray-600">
                    Placed on {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="mt-4 lg:mt-0">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                    {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Customer</h3>
                  <p className="text-gray-600">{order.customer_name}</p>
                  <p className="text-gray-600">{order.phone_number}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Order Type</h3>
                  <p className="text-gray-600 capitalize">{order.delivery_type}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Total Amount</h3>
                  <p className="text-brand-orange font-bold text-xl">
                    {formatPrice(order.total_amount)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Payment</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    order.payment_status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </span>
                </div>
              </div>

              {order.delivery_address && (
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Delivery Address
                  </h3>
                  <p className="text-gray-600">{order.delivery_address}</p>
                </div>
              )}
            </div>

            {/* Order Progress */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Order Progress</h3>
              
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                <div 
                  className="absolute left-6 top-12 w-0.5 bg-brand-orange transition-all duration-500"
                  style={{ 
                    height: `${Math.max(0, (getCurrentStepIndex() / (statusSteps.length - 1)) * 100)}%` 
                  }}
                ></div>

                {/* Steps */}
                <div className="space-y-8">
                  {statusSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isCompleted = index <= getCurrentStepIndex();
                    const isCurrent = index === getCurrentStepIndex();
                    
                    return (
                      <div key={step.key} className="relative flex items-center">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-brand-orange border-brand-orange text-white' 
                            : 'bg-white border-gray-300 text-gray-400'
                        }`}>
                          <StepIcon className="w-6 h-6" />
                        </div>
                        
                        <div className="ml-6">
                          <h4 className={`font-semibold ${
                            isCompleted ? 'text-brand-orange' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </h4>
                          {isCurrent && (
                            <p className="text-sm text-gray-600 mt-1">
                              {step.key === 'preparing' && 'Your order is being prepared with care'}
                              {step.key === 'ready' && order.delivery_type === 'pickup' && 'Your order is ready for pickup'}
                              {step.key === 'ready' && order.delivery_type === 'delivery' && 'Your order is ready for delivery'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="bg-gradient-to-r from-brand-orange to-brand-red rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {order.delivery_type === 'delivery' ? 'Estimated Delivery' : 'Estimated Pickup'}
                  </h3>
                  <p className="text-orange-100">
                    {order.order_status === 'preparing' && `${order.delivery_type === 'delivery' ? '25-35' : '10-15'} minutes`}
                    {order.order_status === 'ready' && order.delivery_type === 'pickup' && 'Ready now'}
                    {order.order_status === 'ready' && order.delivery_type === 'delivery' && '5-10 minutes'}
                    {order.order_status === 'delivered' && 'Delivered'}
                  </p>
                </div>
                <Clock className="w-12 h-12 text-orange-200" />
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                If you have any questions about your order, feel free to contact us.
              </p>
              <a
                href="tel:+256784811208"
                className="inline-flex items-center px-6 py-3 bg-brand-orange text-white rounded-xl font-semibold hover:bg-brand-red transition-colors"
              >
                Call +256 784 811 208
              </a>
            </div>
          </div>
        )}

        {/* No Order Found State */}
        {!order && !loading && orderId && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find an order with ID "{orderId}". Please check your order ID and try again.
            </p>
            <button
              onClick={() => setOrderId('')}
              className="text-brand-orange hover:text-brand-red font-semibold"
            >
              Try Another Order ID
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;