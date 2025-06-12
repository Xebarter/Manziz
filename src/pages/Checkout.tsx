import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Phone, User, Clock, Calendar, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useCartStore, useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { pesapalService, PaymentRequest } from '../lib/pesapal';
import { formatPrice, generateOrderId } from '../lib/utils';
import toast from 'react-hot-toast';

interface CheckoutForm {
  customerName: string;
  phoneNumber: string;
  email: string;
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  paymentMethod: 'pesapal' | 'cash';
  notes?: string;
  scheduleOrder: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: {
      deliveryType: 'delivery',
      paymentMethod: 'pesapal',
      scheduleOrder: false,
      customerName: user?.full_name || '',
      phoneNumber: user?.phone_number || '',
      email: user?.email || ''
    }
  });

  const deliveryType = watch('deliveryType');
  const paymentMethod = watch('paymentMethod');
  const scheduleOrder = watch('scheduleOrder');

  const subtotal = getTotalPrice();
  const deliveryFee = deliveryType === 'delivery' && subtotal < 50000 ? 5000 : 0;
  const total = subtotal + deliveryFee;

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30'
  ];

  const onSubmit = async (data: CheckoutForm) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Validate scheduled order
    if (data.scheduleOrder) {
      if (!data.scheduledDate || !data.scheduledTime) {
        toast.error('Please select date and time for scheduled order');
        return;
      }

      const scheduledDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
      const now = new Date();
      
      if (scheduledDateTime <= now) {
        toast.error('Scheduled time must be in the future');
        return;
      }
    }

    setLoading(true);
    try {
      // Create order in database
      const orderId = crypto.randomUUID();
      let scheduledFor = null;
      
      if (data.scheduleOrder && data.scheduledDate && data.scheduledTime) {
        scheduledFor = `${data.scheduledDate}T${data.scheduledTime}:00`;
      }
      
      const orderData = {
        id: orderId,
        user_id: isAuthenticated ? user?.id : null,
        customer_name: data.customerName,
        phone_number: data.phoneNumber,
        delivery_type: data.deliveryType,
        delivery_address: data.deliveryAddress,
        order_status: 'pending',
        total_amount: total,
        payment_status: 'pending',
        scheduled_for: scheduledFor
      };

      const { error: orderError } = await supabase
        .from('orders')
        .insert([orderData]);

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderId,
        menu_item_id: item.id,
        quantity: item.quantity,
        notes: item.notes,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (paymentMethod === 'pesapal') {
        // Process PesaPal payment
        await processPesapalPayment(orderId, total, data);
      } else {
        // Cash payment - order placed successfully
        clearCart();
        const successMessage = data.scheduleOrder 
          ? 'Scheduled order placed successfully!' 
          : 'Order placed successfully!';
        toast.success(successMessage);
        navigate(`/track?order=${orderId}`);
      }

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processPesapalPayment = async (orderId: string, amount: number, customerData: CheckoutForm) => {
    setProcessingPayment(true);
    try {
      // Validate payment request
      const paymentRequest: PaymentRequest = {
        orderId: orderId,
        amount: pesapalService.formatAmount(amount),
        currency: 'UGX',
        description: `Manziz Order #${orderId.slice(0, 8)} - ${items.length} items`,
        customerName: customerData.customerName,
        customerEmail: customerData.email,
        customerPhone: customerData.phoneNumber
      };

      const validation = pesapalService.validatePaymentRequest(paymentRequest);
      if (!validation.isValid) {
        toast.error(`Payment validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Initiate payment with PesaPal
      const paymentResponse = await pesapalService.initiatePayment(paymentRequest);
      
      if (paymentResponse.error) {
        throw new Error(paymentResponse.error);
      }

      // Store payment tracking info
      localStorage.setItem('manziz_payment_tracking', JSON.stringify({
        orderId: orderId,
        trackingId: paymentResponse.order_tracking_id,
        amount: amount,
        scheduled: customerData.scheduleOrder
      }));

      // Clear cart before redirecting
      clearCart();

      // Show success message
      toast.success('Redirecting to PesaPal for payment...');

      // Redirect to PesaPal payment page
      window.location.href = paymentResponse.redirect_url;

    } catch (error: any) {
      console.error('PesaPal payment error:', error);
      toast.error(`Payment failed: ${error.message || 'Please try again'}`);
      
      // Update order status to failed
      await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate('/menu')}
            className="bg-brand-orange text-white px-6 py-3 rounded-xl hover:bg-brand-red transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-black">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order details</p>
        </div>

        {processingPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center max-w-md">
              <Loader className="w-12 h-12 text-brand-orange animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-gray-600">Please wait while we set up your payment with PesaPal...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Order Details */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-brand-orange" />
                Customer Information
              </h2>
              
              {!isAuthenticated && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Want to save your orders?</strong>{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/login', { state: { from: { pathname: '/checkout' } } })}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Sign in
                    </button>{' '}
                    or{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/register', { state: { from: { pathname: '/checkout' } } })}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      create an account
                    </button>
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    {...register('customerName', { required: 'Name is required' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                  {errors.customerName && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    {...register('phoneNumber', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[0-9+\-\s()]+$/,
                        message: 'Please enter a valid phone number'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="+256 xxx xxx xxx"
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule Order */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-brand-orange" />
                Order Timing
              </h2>

              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    {...register('scheduleOrder')}
                    type="checkbox"
                    className="w-4 h-4 text-brand-orange border-gray-300 rounded focus:ring-brand-orange"
                  />
                  <span className="font-medium">Schedule order for later</span>
                </label>

                {scheduleOrder && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        {...register('scheduledDate', { 
                          required: scheduleOrder ? 'Date is required for scheduled orders' : false
                        })}
                        type="date"
                        min={today}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                      />
                      {errors.scheduledDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.scheduledDate.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time *
                      </label>
                      <select
                        {...register('scheduledTime', { 
                          required: scheduleOrder ? 'Time is required for scheduled orders' : false
                        })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                      >
                        <option value="">Select time</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      {errors.scheduledTime && (
                        <p className="text-red-500 text-sm mt-1">{errors.scheduledTime.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {scheduleOrder && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Payment will be processed now, but your order will be prepared at the scheduled time.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Options */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-brand-orange" />
                Delivery Options
              </h2>

              <div className="space-y-4">
                <div className="flex space-x-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      {...register('deliveryType')}
                      type="radio"
                      value="delivery"
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-xl transition-colors ${
                      deliveryType === 'delivery'
                        ? 'border-brand-orange bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-brand-orange" />
                        <div>
                          <h3 className="font-semibold">Delivery</h3>
                          <p className="text-sm text-gray-600">30-45 mins</p>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className="flex-1 cursor-pointer">
                    <input
                      {...register('deliveryType')}
                      type="radio"
                      value="pickup"
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-xl transition-colors ${
                      deliveryType === 'pickup'
                        ? 'border-brand-orange bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-brand-orange" />
                        <div>
                          <h3 className="font-semibold">Pickup</h3>
                          <p className="text-sm text-gray-600">15-20 mins</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {deliveryType === 'delivery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Address *
                    </label>
                    <textarea
                      {...register('deliveryAddress', { 
                        required: deliveryType === 'delivery' ? 'Delivery address is required' : false
                      })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none"
                      placeholder="Enter your complete address including landmarks"
                    />
                    {errors.deliveryAddress && (
                      <p className="text-red-500 text-sm mt-1">{errors.deliveryAddress.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-brand-orange" />
                Payment Method
              </h2>

              <div className="space-y-3">
                <label className="cursor-pointer">
                  <input
                    {...register('paymentMethod')}
                    type="radio"
                    value="pesapal"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-xl transition-colors ${
                    paymentMethod === 'pesapal'
                      ? 'border-brand-orange bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-brand-orange" />
                      <div>
                        <h3 className="font-semibold">Pay Online (PesaPal)</h3>
                        <p className="text-sm text-gray-600">Mobile Money, Card, Bank Transfer</p>
                        <p className="text-xs text-green-600 mt-1">✓ Secure & Instant</p>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    {...register('paymentMethod')}
                    type="radio"
                    value="cash"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-xl transition-colors ${
                    paymentMethod === 'cash'
                      ? 'border-brand-orange bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-brand-orange" />
                      <div>
                        <h3 className="font-semibold">Cash on {deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}</h3>
                        <p className="text-sm text-gray-600">Pay when you receive your order</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {paymentMethod === 'pesapal' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Secure Payment:</strong> You'll be redirected to PesaPal to complete your payment securely. 
                    We accept Mobile Money (MTN, Airtel), Visa/Mastercard, and bank transfers.
                  </p>
                </div>
              )}
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Special Instructions (Optional)
              </h2>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none"
                placeholder="Any special instructions for your order..."
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-gray-600 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span>
                </div>
                {paymentMethod === 'pesapal' && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Payment Processing</span>
                    <span>Secure via PesaPal</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total</span>
                  <span className="text-brand-orange">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={loading || processingPayment}
                className="w-full bg-brand-orange text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-brand-red transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center space-x-2"
              >
                {loading || processingPayment ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {scheduleOrder ? 'Schedule Order' : 'Place Order'} - {formatPrice(total)}
                    </span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing this order, you agree to our terms and conditions.
                {paymentMethod === 'pesapal' && ' Payment is processed securely by PesaPal.'}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;