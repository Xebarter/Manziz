import React, { useState, useEffect } from 'react'
import { Order, OrderItem } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import toast from 'react-hot-toast'
import Icon from '../components/icons'

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<{ [key: string]: OrderItem[] }>({})
  const [loading, setLoading] = useState(true)
  const [searchPhone, setSearchPhone] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const { addToCart } = useCart()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Load user's orders directly
      fetchUserOrders()
      
      // Set up real-time subscription for authenticated users
      const subscription = supabase
        .channel('user_order_updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('Order change received:', payload.eventType, payload.new || payload.old)
            
            if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Order
            // Only update if it's the current user's order
            if (updatedOrder.user_id === user.id) {
              console.log('User order updated:', updatedOrder)
                // Update the specific order in the state
                setOrders(prevOrders => 
                  prevOrders.map(order => 
                    order.id === updatedOrder.id ? updatedOrder : order
                  )
                )
                // Show a toast notification for status changes
                if (payload.old && (payload.old as Order).order_status !== updatedOrder.order_status) {
                  toast.success(`Order status updated to: ${updatedOrder.order_status.replace('_', ' ')}`)
                }
              }
            } else if (payload.eventType === 'DELETE') {
            const deletedOrder = payload.old as Order
            // Only update if it's the current user's order
            if (deletedOrder.user_id === user.id) {
              console.log('User order deleted:', deletedOrder)
                setOrders(prevOrders => prevOrders.filter(order => order.id !== deletedOrder.id))
                toast('An order has been cancelled')
              }
            } else if (payload.eventType === 'INSERT') {
              const newOrder = payload.new as Order
              // Only update if it's the current user's order
              if (newOrder.user_id === user.id) {
                console.log('New user order:', newOrder)
                setOrders(prevOrders => [newOrder, ...prevOrders])
                toast.success('New order received!')
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to order updates')
          } else if (status === 'CLOSED') {
            console.log('Subscription closed, attempting to reconnect...')
            // Attempt to reconnect after a delay
            setTimeout(() => {
              subscription.subscribe()
            }, 5000)
          }
        })

      return () => {
        subscription.unsubscribe()
      }
    } else {
      // Check if there's a saved phone number from previous searches
      const savedPhone = localStorage.getItem('manziz_customer_phone')
      if (savedPhone) {
        setSearchPhone(savedPhone)
        fetchOrdersByPhone(savedPhone)
      } else {
        setLoading(false)
      }
    }
  }, [isAuthenticated, user])

  const fetchUserOrders = async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log('Fetching orders for user:', user.id)

      // Fetch orders for authenticated user
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      console.log('Found user orders:', ordersData?.length || 0)

      if (!ordersData || ordersData.length === 0) {
        setOrders([])
        setOrderItems({})
        return
      }

      setOrders(ordersData)

      // Fetch order items for each order
      const itemsMap: { [key: string]: OrderItem[] } = {}
      
      for (const order of ordersData) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            menu_item:menu_items(*)
          `)
          .eq('order_id', order.id)

        if (itemsError) {
          console.error('Error fetching items for order:', order.id, itemsError)
          continue
        }

        itemsMap[order.id] = items || []
      }

      setOrderItems(itemsMap)

    } catch (error) {
      console.error('Error fetching user orders:', error)
      toast.error('Failed to load your orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrdersByPhone = async (phoneNumber: string) => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    setIsSearching(true)
    setLoading(true)

    try {
      // Normalize phone number for search
      let normalizedPhone = phoneNumber.replace(/\s/g, '')
      
      // Try different phone number formats
      const phoneVariants = [
        normalizedPhone,
        normalizedPhone.startsWith('+') ? normalizedPhone : `+${normalizedPhone}`,
        normalizedPhone.startsWith('256') ? `+${normalizedPhone}` : normalizedPhone,
        normalizedPhone.startsWith('0') ? `+256${normalizedPhone.slice(1)}` : normalizedPhone,
        normalizedPhone.startsWith('+256') ? normalizedPhone.replace('+256', '0') : normalizedPhone
      ]

      console.log('Searching for orders with phone variants:', phoneVariants)

      // Search for orders with any of the phone variants
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('phone_number', phoneVariants)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      console.log('Found orders:', ordersData?.length || 0)

      if (!ordersData || ordersData.length === 0) {
        setOrders([])
        setOrderItems({})
        toast.error('No orders found for this phone number')
        return
      }

      setOrders(ordersData)

      // Fetch order items for each order
      const itemsMap: { [key: string]: OrderItem[] } = {}
      
      for (const order of ordersData) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            menu_item:menu_items(*)
          `)
          .eq('order_id', order.id)

        if (itemsError) {
          console.error('Error fetching items for order:', order.id, itemsError)
          continue
        }

        itemsMap[order.id] = items || []
      }

      setOrderItems(itemsMap)

      // Save phone number for future searches
      localStorage.setItem('manziz_customer_phone', phoneNumber)
      
      toast.success(`Found ${ordersData.length} order${ordersData.length === 1 ? '' : 's'}`)

    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  const refreshOrders = async () => {
    setRefreshing(true)
    if (isAuthenticated && user) {
      await fetchUserOrders()
    } else if (searchPhone.trim()) {
      await fetchOrdersByPhone(searchPhone)
    }
    setRefreshing(false)
  }

  const handleSearch = () => {
    fetchOrdersByPhone(searchPhone)
  }

  const clearSearch = () => {
    setSearchPhone('')
    setOrders([])
    setOrderItems({})
    localStorage.removeItem('manziz_customer_phone')
  }

  const reorderItems = (order: Order) => {
    const items = orderItems[order.id] || []
    let addedCount = 0

    items.forEach(item => {
      if (item.menu_item) {
        addToCart({
          menu_item: item.menu_item,
          quantity: item.quantity,
          notes: item.notes
        })
        addedCount++
      }
    })

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} item${addedCount === 1 ? '' : 's'} to cart!`)
    } else {
      toast.error('No items could be added to cart')
    }
  }

  const getStatusSteps = (deliveryType: string) => {
    const steps = [
      { 
        id: 'received', 
        label: 'Order Received', 
        icon: 'CheckCircle', 
        description: 'Your order has been received and is being processed' 
      },
      { 
        id: 'preparing', 
        label: 'Preparing', 
        icon: 'Clock', 
        description: 'Our chefs are preparing your delicious meal' 
      },
      ...(deliveryType === 'delivery' 
        ? [
            { 
        id: 'out_for_delivery', 
        label: 'Out for Delivery', 
              icon: 'Truck', 
              description: 'Your order is on its way to you' 
            }
          ]
        : [
            { 
        id: 'ready_for_pickup', 
        label: 'Ready for Pickup', 
              icon: 'Package', 
              description: 'Your order is ready for pickup' 
    }
          ]
      ),
      { 
      id: 'completed', 
      label: 'Completed', 
        icon: 'CheckCircle', 
        description: 'Your order has been delivered/picked up' 
      }
    ]

    return steps
  }

  const getStatusIndex = (status: string, deliveryType: string) => {
    const steps = getStatusSteps(deliveryType)
    return steps.findIndex(step => step.id === status)
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
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const isOrderActive = (status: string) => {
    return !['completed', 'cancelled'].includes(status)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Section */}
        {!isAuthenticated && (
        <div className="mb-8">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="tel"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
                <button
                  onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSearching ? (
                    <>
                    <Icon name="RefreshCw" className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                    <Icon name="Search" className="w-4 h-4" />
                    <span>Search</span>
                    </>
                  )}
                </button>
                {searchPhone && (
                  <button
                    onClick={clearSearch}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                  <Icon name="RotateCcw" className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Orders Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isAuthenticated ? 'My Orders' : 'Order History'}
          </h1>
            <button
              onClick={refreshOrders}
              disabled={refreshing}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
            {refreshing ? (
              <Icon name="RefreshCw" className="w-5 h-5 animate-spin" />
            ) : (
              <Icon name="RefreshCw" className="w-5 h-5" />
            )}
            </button>
          </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Package" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500">
              {isAuthenticated 
                ? "You haven't placed any orders yet."
                : "Enter your phone number to view your order history."}
                </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      orderItems={orderItems[order.id] || []}
                      getStatusSteps={getStatusSteps}
                      getStatusIndex={getStatusIndex}
                      getStatusColor={getStatusColor}
                      formatTime={formatTime}
                      formatDate={formatDate}
                isActive={isOrderActive(order.order_status)}
                      onReorder={reorderItems}
                    />
                  ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface OrderCardProps {
  order: Order
  orderItems: OrderItem[]
  getStatusSteps: (deliveryType: string) => any[]
  getStatusIndex: (status: string, deliveryType: string) => number
  getStatusColor: (status: string) => string
  formatTime: (timestamp: string) => string
  formatDate: (timestamp: string) => string
  isActive: boolean
  onReorder: (order: Order) => void
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  orderItems,
  getStatusSteps,
  getStatusIndex,
  getStatusColor,
  formatTime,
  formatDate,
  isActive,
  onReorder
}) => {
  const steps = getStatusSteps(order.delivery_type)
  const currentStepIndex = getStatusIndex(order.order_status, order.delivery_type)
  const deliveryFee = order.delivery_type === 'delivery' ? 5000 : 0 // 5000 UGX for delivery

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
      {/* Order Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.id.slice(0, 8)}
            </h3>
            <p className="text-sm text-gray-500">
                {formatDate(order.created_at)} at {formatTime(order.created_at)}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.order_status)}`}>
            {order.order_status.replace('_', ' ')}
          </span>
        </div>

        {/* Status Timeline */}
        <div className="mb-6">
          <div className="relative">
            {/* Progress Bar */}
            <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
              <div 
                className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex
                const isCurrent = index === currentStepIndex

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${isCompleted ? 'bg-orange-500' : 'bg-gray-200'}
                      ${isCurrent ? 'ring-4 ring-orange-200' : ''}
                      transition-all duration-300
                    `}>
                      <Icon 
                        name={step.icon} 
                        className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} 
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-gray-500 mt-1">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
      </div>

          {/* Order Items */}
        <div className="space-y-3 mb-4">
              {orderItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                  <img
                    src={item.menu_item?.image_url || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=100'}
                    alt={item.menu_item?.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  loading="lazy"
                  />
                <div>
                  <p className="font-medium text-gray-900">{item.menu_item?.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    {item.notes && (
                    <p className="text-xs text-gray-500">Note: {item.notes}</p>
                    )}
                  </div>
              </div>
                    <p className="font-medium text-gray-900">
                      UGX {(item.price_at_time * item.quantity).toLocaleString()}
                    </p>
                </div>
              ))}
            </div>

        {/* Order Summary */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">UGX {order.total_amount.toLocaleString()}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Delivery Fee</span>
              <span className="font-medium">UGX {deliveryFee.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Total</span>
            <span>UGX {(order.total_amount + deliveryFee).toLocaleString()}</span>
            </div>
          </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-3">
          {isActive && (
              <button
                onClick={() => onReorder(order)}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
              >
              <Icon name="ShoppingCart" className="w-4 h-4" />
                <span>Reorder</span>
              </button>
          )}
              <a
            href={`https://wa.me/${order.phone_number?.replace('+', '') || ''}`}
                target="_blank"
                rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Icon name="MessageCircle" className="w-4 h-4" />
            <span>Contact Support</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default MyOrders