import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Clock, AlertCircle } from 'lucide-react';
import { pesapalService } from '../lib/pesapal';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/utils';
import toast from 'react-hot-toast';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handlePaymentCallback();
  }, []);

  const handlePaymentCallback = async () => {
    try {
      // Get parameters from URL
      const orderTrackingId = searchParams.get('OrderTrackingId');
      const merchantReference = searchParams.get('OrderMerchantReference');
      
      if (!orderTrackingId || !merchantReference) {
        setError('Missing payment parameters');
        setStatus('failed');
        return;
      }

      // Get stored payment info
      const storedPayment = localStorage.getItem('manziz_payment_tracking');
      let paymentInfo = null;
      
      if (storedPayment) {
        paymentInfo = JSON.parse(storedPayment);
      }

      // Handle payment callback with PesaPal
      const paymentStatus = await pesapalService.handlePaymentCallback(orderTrackingId, merchantReference);
      
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', merchantReference)
        .single();

      if (orderError) {
        console.error('Error fetching order:', orderError);
      } else {
        setOrderDetails(order);
      }

      setPaymentDetails(paymentStatus);

      // Determine final status
      if (paymentStatus.status_code === 1) {
        setStatus('success');
        toast.success('Payment successful! Your order has been confirmed.');
        
        // Clear stored payment info
        localStorage.removeItem('manziz_payment_tracking');
        
        // Redirect to order tracking after a delay
        setTimeout(() => {
          navigate(`/track?order=${merchantReference}`);
        }, 3000);
        
      } else if (paymentStatus.status_code === 2) {
        setStatus('failed');
        setError(paymentStatus.payment_status_description || 'Payment failed');
        toast.error('Payment failed. Please try again.');
        
      } else {
        setStatus('pending');
        toast.info('Payment is being processed. Please wait...');
        
        // Check status again after a delay
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }

    } catch (error: any) {
      console.error('Payment callback error:', error);
      setError(error.message || 'An error occurred while processing your payment');
      setStatus('failed');
      toast.error('Payment processing failed');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      default:
        return <Loader className="w-16 h-16 text-brand-orange animate-spin" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return {
          title: 'Payment Successful!',
          message: 'Your order has been confirmed and is being prepared.',
          color: 'text-green-600'
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          message: error || 'There was an issue processing your payment.',
          color: 'text-red-600'
        };
      case 'pending':
        return {
          title: 'Payment Processing',
          message: 'Your payment is being verified. Please wait...',
          color: 'text-yellow-600'
        };
      default:
        return {
          title: 'Processing Payment',
          message: 'Please wait while we verify your payment...',
          color: 'text-brand-orange'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        {/* Status Message */}
        <h1 className={`text-2xl font-bold mb-4 ${statusInfo.color}`}>
          {statusInfo.title}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {statusInfo.message}
        </p>

        {/* Payment Details */}
        {paymentDetails && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
            <div className="space-y-2 text-sm">
              {paymentDetails.confirmation_code && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmation Code:</span>
                  <span className="font-medium">{paymentDetails.confirmation_code}</span>
                </div>
              )}
              {paymentDetails.payment_method && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{paymentDetails.payment_method}</span>
                </div>
              )}
              {paymentDetails.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formatPrice(paymentDetails.amount)}</span>
                </div>
              )}
              {paymentDetails.created_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {new Date(paymentDetails.created_date).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Details */}
        {orderDetails && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">#{orderDetails.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{orderDetails.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{orderDetails.delivery_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{formatPrice(orderDetails.total_amount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === 'success' && (
            <button
              onClick={() => navigate(`/track?order=${orderDetails?.id}`)}
              className="w-full bg-brand-orange text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-red transition-colors"
            >
              Track Your Order
            </button>
          )}

          {status === 'failed' && (
            <div className="space-y-3">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-brand-orange text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-red transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Contact Support
              </button>
            </div>
          )}

          {status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  This page will automatically refresh to check your payment status.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full text-gray-600 hover:text-gray-800 py-2 transition-colors"
          >
            Back to Home
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Need help? Call us at{' '}
            <a href="tel:+256784811208" className="text-brand-orange hover:text-brand-red">
              +256 784 811 208
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;