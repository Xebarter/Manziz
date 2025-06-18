import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Minus, Trash2, ShoppingCart, AlertCircle, User, CreditCard, Smartphone, Shield, Lock } from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { getUserPreferences } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { initiatePesapalPayment, validatePesapalConfig, getPesapalConfigStatus } from '../lib/pesapal'
import toast from 'react-hot-toast'

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalAmount } = useCart()
  const { user, isAuthenticated } = useAuth()
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    deliveryType: 'delivery' as 'delivery' | 'pickup'
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('pesapal')
  const navigate = useNavigate()

  const deliveryFee = customerInfo.deliveryType === 'delivery' ? 7000 : 0
  const taxRate = 0.1
  const subtotal = getTotalAmount()
  const tax = subtotal * taxRate
  const total = subtotal + deliveryFee + tax

  // Pre-fill form with user data when authenticated
  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated && user) {
        // Pre-fill with user information
        setCustomerInfo(prev => ({
          ...prev,
          name: `${user.first_name} ${user.last_name}`,
          phone: user.phone_number || '',
          email: user.email,
          address: user.address || ''
        }))

        // Load user preferences for default delivery address
        try {
          const preferences = await getUserPreferences(user.id)
          if (preferences?.default_delivery_address) {
            setCustomerInfo(prev => ({
              ...prev,
              address: preferences.default_delivery_address || prev.address
            }))
          }
        } catch (error) {
          console.error('Error loading user preferences:', error)
        }
      }
    }

    loadUserData()
  }, [isAuthenticated, user])

  // Check Pesapal configuration on component mount
  React.useEffect(() => {
    const configStatus = getPesapalConfigStatus()
    console.log('Pesapal configuration status:', configStatus)
    if (!configStatus.isValid) {
      console.warn('Pesapal configuration incomplete:', configStatus)
      toast.error('Payment system configuration incomplete. Please contact support.')
    }
  }, [])

  const redirectToLogin = () => {
    navigate('/login', { state: { from: { pathname: '/cart' } } })
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    if (customerInfo.deliveryType === 'delivery' && !customerInfo.address) {
      toast.error('Please provide a delivery address')
      return
    }

    // Validate phone number format
    const phoneRegex = /^(\+?256|0)?[0-9]{9}$/
    if (!phoneRegex.test(customerInfo.phone.replace(/\s/g, ''))) {
      toast.error('Please enter a valid Ugandan phone number')
      return
    }

    // Check Pesapal configuration
    if (!validatePesapalConfig()) {
      const configStatus = getPesapalConfigStatus()
      console.error('Pesapal configuration invalid:', configStatus)
      toast.error('Payment system is not properly configured. Please contact support.')
      return
    }

    setIsProcessing(true)

    try {
      // Create order
      const orderData = {
        customer_name: customerInfo.name,
        phone_number: customerInfo.phone,
        delivery_type: customerInfo.deliveryType,
        delivery_address: customerInfo.deliveryType === 'delivery' ? customerInfo.address : null,
        order_status: 'received',
        total_amount: total,
        payment_status: 'pending',
        user_id: isAuthenticated && user ? user.id : null
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item.id,
        quantity: item.quantity,
        notes: item.notes,
        price_at_time: item.menu_item.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Format phone number for Pesapal
      let formattedPhone = customerInfo.phone.replace(/\s/g, '')
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+256' + formattedPhone.slice(1)
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+256' + formattedPhone
      }

      // Initialize payment with Pesapal
      const paymentRequest = {
        orderId: order.id,
        amount: total,
        currency: 'UGX',
        description: `Manziz Restaurant Order #${order.id.slice(0, 8)} - ${cart.length} item${cart.length === 1 ? '' : 's'}`,
        customer: {
          name: customerInfo.name,
          phone: formattedPhone,
          email: customerInfo.email || `${formattedPhone.replace('+', '')}@manziz.com`
        },
        callbackUrl: `${window.location.origin}/payment-callback`
      }

      console.log('Initiating payment with request:', paymentRequest)

      const paymentResponse = await initiatePesapalPayment(paymentRequest)

      // Store order tracking ID for later verification
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          delivery_address: customerInfo.deliveryType === 'pickup' 
            ? `TRACKING_ID:${paymentResponse.orderTrackingId}`
            : `${customerInfo.address} | TRACKING_ID:${paymentResponse.orderTrackingId}`
        })
        .eq('id', order.id)

      if (updateError) {
        console.warn('Failed to store tracking ID:', updateError)
      }

      // Clear cart and redirect to payment
      clearCart()
      toast.success('Order placed successfully! Redirecting to secure payment...')
      
      // Show loading state briefly before redirect
      setTimeout(() => {
        window.location.href = paymentResponse.paymentUrl
      }, 1500)

    } catch (error: any) {
      console.error('Error processing order:', error)
      
      // Provide specific error messages
      if (error.message.includes('Configuration Error') || error.message.includes('not properly configured')) {
        toast.error('Payment system is not properly configured. Please contact support to resolve this issue.')
      } else if (error.message.includes('Authentication failed') || error.message.includes('Invalid credentials')) {
        toast.error('Payment system authentication failed. Please contact support.')
      } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Unable to connect')) {
        toast.error('Network error. Please check your internet connection and try again.')
      } else if (error.message.includes('Payment initialization failed')) {
        toast.error('Payment initialization failed. Please check your details and try again.')
      } else {
        toast.error('Failed to process order. Please try again or contact support if the problem persists.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-24 w-24 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">Add some delicious items to get started!</p>
            <Link
              to="/menu"
              className="mt-6 inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-200"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <div key={item.menu_item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.menu_item.image_url || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=200'}
                        alt={item.menu_item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{item.menu_item.name}</h3>
                        <p className="text-gray-600">{item.menu_item.description}</p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-1">Note: {item.notes}</p>
                        )}
                        <p className="text-lg font-bold text-orange-600 mt-2">
                          UGX {item.menu_item.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.menu_item.id, item.quantity - 1)}
                          className="p-1 rounded-full border border-gray-300 hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menu_item.id, item.quantity + 1)}
                          className="p-1 rounded-full border border-gray-300 hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.menu_item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary & Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>UGX {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%)</span>
                  <span>UGX {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>UGX {deliveryFee.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>UGX {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* User Status */}
              {!isAuthenticated && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Sign in for a better experience</p>
                      <p className="mb-3">Save your information, track orders, and manage favorites.</p>
                      <button
                        onClick={redirectToLogin}
                        className="text-blue-600 hover:text-blue-700 underline font-medium"
                      >
                        Sign in or create account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Information */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900">Customer Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., +256 700 123 456 or 0700 123 456"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a valid Ugandan phone number for payment notifications
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For order confirmations and receipts
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="delivery"
                        checked={customerInfo.deliveryType === 'delivery'}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, deliveryType: e.target.value as 'delivery' | 'pickup' }))}
                        className="mr-2"
                      />
                      Delivery (+UGX 7,000)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="pickup"
                        checked={customerInfo.deliveryType === 'pickup'}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, deliveryType: e.target.value as 'delivery' | 'pickup' }))}
                        className="mr-2"
                      />
                      Pickup (Free)
                    </label>
                  </div>
                </div>

                {customerInfo.deliveryType === 'delivery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <textarea
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter your complete delivery address including landmarks"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      value="pesapal"
                      checked={paymentMethod === 'pesapal'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">Pesapal Secure Payment</p>
                        <p className="text-sm text-gray-600">Credit/Debit Cards, Mobile Money</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Lock className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Secure Payment via Pesapal</p>
                    <p className="mb-2">You'll be redirected to Pesapal's secure payment gateway to complete your payment using:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center">
                        <Smartphone className="w-3 h-3 mr-1" />
                        <span>MTN Mobile Money</span>
                      </div>
                      <div className="flex items-center">
                        <Smartphone className="w-3 h-3 mr-1" />
                        <span>Airtel Money</span>
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="w-3 h-3 mr-1" />
                        <span>Visa/Mastercard</span>
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="w-3 h-3 mr-1" />
                        <span>Bank Transfer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Processing Order...
                  </div>
                ) : (
                  `Pay UGX ${total.toLocaleString()} - Proceed to Secure Payment`
                )}
              </button>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  🔒 Secure payment powered by Pesapal • SSL encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart