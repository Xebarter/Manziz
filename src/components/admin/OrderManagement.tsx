import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  Edit,
  Plus,
  Minus,
  X,
  Package
} from 'lucide-react'
import { Order, OrderItem } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription'

// Create an icon map to avoid multiple imports
const icons = {
  search: Search,
  filter: Filter,
  phone: Phone,
  mapPin: MapPin,
  clock: Clock,
  checkCircle: CheckCircle,
  xCircle: XCircle,
  alertCircle: AlertCircle,
  trash: Trash2,
  edit: Edit,
  plus: Plus,
  minus: Minus,
  close: X,
  package: Package
}

// Define status options
const statusOptions = [
  { value: 'all', label: 'All Orders' },
  { value: 'received', label: 'Received' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Fetch initial orders
  useEffect(() => {
    fetchOrders()
  }, [])

  // Set up real-time subscription
  useRealtimeSubscription({
    table: 'orders',
    callback: (payload) => {
      console.log('Real-time order change:', payload.eventType, payload.new || payload.old)
      
      switch (payload.eventType) {
        case 'INSERT':
          const newOrder = payload.new as Order
          setOrders(prev => [newOrder, ...prev])
          toast.success('New order received!')
          break
          
        case 'UPDATE':
          const updatedOrder = payload.new as Order
          setOrders(prev => 
            prev.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            )
          )
          if (selectedOrder && selectedOrder.id === updatedOrder.id) {
            setSelectedOrder(updatedOrder)
          }
          // Show toast for status changes
          if (payload.old && (payload.old as Order).order_status !== updatedOrder.order_status) {
            toast.success(`Order status updated to: ${updatedOrder.order_status.replace('_', ' ')}`)
          }
          break
          
        case 'DELETE':
          const deletedOrder = payload.old as Order
          setOrders(prev => prev.filter(order => order.id !== deletedOrder.id))
          if (selectedOrder && selectedOrder.id === deletedOrder.id) {
            setSelectedOrder(null)
          }
          break
      }
    }
  })

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('Fetched orders:', data)
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          menu_item:menu_items(*)
        `)
        .eq('order_id', orderId)

      if (error) throw error
      setOrderItems(data || [])
    } catch (error) {
      console.error('Error fetching order items:', error)
      toast.error('Failed to load order items')
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      // The real-time subscription will handle the UI update
      console.log('Order status update initiated:', orderId, newStatus)
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const openDeleteModal = (order: Order) => {
    setOrderToDelete(order)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setOrderToDelete(null)
  }

  const deleteOrder = async () => {
    if (!orderToDelete) return

    setDeletingOrder(orderToDelete.id)

    try {
      // First delete all order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderToDelete.id)

      if (itemsError) throw itemsError

      // Then delete the order - real-time subscription will handle UI update
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete.id)

      if (orderError) throw orderError

      // Success message will be shown by real-time subscription
      
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Failed to delete order')
    } finally {
      setDeletingOrder(null)
      closeDeleteModal()
    }
  }

  const openOrderModal = async (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
    await fetchOrderItems(order.id)
  }

  const closeOrderModal = () => {
    setShowOrderModal(false)
    setSelectedOrder(null)
    setOrderItems([])
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getNextStatusOptions = (currentStatus: string, deliveryType: string) => {
    const statusFlow = {
      'received': ['preparing'],
      'preparing': deliveryType === 'delivery' ? ['out_for_delivery'] : ['ready_for_pickup'],
      'out_for_delivery': ['completed'],
      'ready_for_pickup': ['completed'],
      'completed': [],
      'cancelled': []
    }

    return statusFlow[currentStatus as keyof typeof statusFlow] || []
  }

  const getStatusButtonText = (status: string) => {
    const buttonTexts = {
      'preparing': 'Mark as Preparing',
      'out_for_delivery': 'Out for Delivery',
      'ready_for_pickup': 'Ready for Pickup',
      'completed': 'Mark as Completed',
      'cancelled': 'Cancel Order'
    }

    return buttonTexts[status as keyof typeof buttonTexts] || status
  }

  const canCancelOrder = (status: string) => {
    return !['completed', 'cancelled'].includes(status)
  }

  const canDeleteOrder = (order: Order) => {
    // Allow deletion of any order except those that are currently being processed
    return !['preparing', 'out_for_delivery'].includes(order.order_status)
  }

  // Filter orders based on search query and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone_number?.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders with real-time updates</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <icons.alertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
          <p className="text-gray-600 mb-6">
            When customers place orders, they will appear here.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start">
              <icons.alertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Ready for Orders</p>
                <p>Your restaurant is ready to receive and process orders.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table - Only show if there are orders */}
      {filteredOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            <div className="divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const nextStatuses = getNextStatusOptions(order.order_status, order.delivery_type)
                const isUpdating = updatingStatus === order.id
                const canCancel = canCancelOrder(order.order_status)
                const canDelete = canDeleteOrder(order)
                const isDeleting = deletingOrder === order.id
                
                return (
                  <div key={order.id} className="p-4 hover:bg-gray-50">
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          #{order.id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          UGX {order.total_amount.toLocaleString()}
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
                          {order.order_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-3">
                      <div className="font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-600">{order.phone_number}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.delivery_type === 'delivery' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.delivery_type}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {nextStatuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateOrderStatus(order.id, status)}
                          disabled={isUpdating || isDeleting}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            status === 'preparing' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                            status === 'out_for_delivery' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                            status === 'ready_for_pickup' ? 'bg-green-600 hover:bg-green-700 text-white' :
                            status === 'completed' ? 'bg-green-600 hover:bg-green-700 text-white' :
                            'bg-gray-600 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {isUpdating ? 'Updating...' : getStatusButtonText(status)}
                        </button>
                      ))}
                      
                      {canCancel && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          disabled={isUpdating || isDeleting}
                          className="px-3 py-1 text-xs font-medium rounded bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={() => openOrderModal(order)}
                        disabled={isDeleting}
                        className="px-3 py-1 text-xs font-medium rounded bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50"
                      >
                        View Details
                      </button>

                      <a
                        href={`https://wa.me/${order.phone_number.replace('+', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-xs font-medium rounded bg-green-600 hover:bg-green-700 text-white transition-colors"
                      >
                        Contact
                      </a>

                      {canDelete && (
                        <button
                          onClick={() => openDeleteModal(order)}
                          disabled={isUpdating || isDeleting}
                          className="px-3 py-1 text-xs font-medium rounded bg-red-700 hover:bg-red-800 text-white transition-colors disabled:opacity-50 flex items-center space-x-1"
                        >
                          {isDeleting ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <icons.trash className="w-3 h-3" />
                              <span>Delete</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const nextStatuses = getNextStatusOptions(order.order_status, order.delivery_type)
                  const isUpdating = updatingStatus === order.id
                  const canCancel = canCancelOrder(order.order_status)
                  const canDelete = canDeleteOrder(order)
                  const isDeleting = deletingOrder === order.id
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.id.slice(0, 8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.phone_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.delivery_type === 'delivery' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.delivery_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        UGX {order.total_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.order_status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          disabled={updatingStatus === order.id}
                          className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.order_status)} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                        >
                          {statusOptions
                            .filter(option => option.value !== 'all')
                            .map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                        </select>
                        {updatingStatus === order.id && (
                          <div className="mt-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-orange-500 border-t-transparent"></div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openOrderModal(order)}
                            disabled={isDeleting}
                            className="text-orange-600 hover:text-orange-900 p-1 disabled:opacity-50"
                            title="View Details"
                          >
                            <icons.search className="w-4 h-4" />
                          </button>
                          <a
                            href={`https://wa.me/${order.phone_number.replace('+', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Contact Customer"
                          >
                            <icons.phone className="w-4 h-4" />
                          </a>
                          {canDelete && (
                            <button
                              onClick={() => openDeleteModal(order)}
                              disabled={isUpdating || isDeleting}
                              className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                              title="Delete Order"
                            >
                              {isDeleting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                              ) : (
                                <icons.trash className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <icons.trash className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Order</h3>
                <p className="text-gray-600">Order #{orderToDelete.id.slice(0, 8)}</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. The order and all its items will be permanently deleted.
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 space-y-1">
                <span className="block"><strong>Customer:</strong> {orderToDelete.customer_name}</span>
                <span className="block"><strong>Total:</strong> UGX {orderToDelete.total_amount.toLocaleString()}</span>
                <span className="block"><strong>Status:</strong> {orderToDelete.order_status.replace('_', ' ')}</span>
                <span className="block"><strong>Payment:</strong> {orderToDelete.payment_status}</span>
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                disabled={deletingOrder === orderToDelete.id}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteOrder}
                disabled={deletingOrder === orderToDelete.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {deletingOrder === orderToDelete.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <icons.trash className="w-4 h-4" />
                    <span>Delete Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Details #{selectedOrder.id.slice(0, 8)}
                </h2>
                <button
                  onClick={closeOrderModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <icons.close className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                    <p><strong>Phone:</strong> {selectedOrder.phone_number}</p>
                    <p><strong>Order Type:</strong> {selectedOrder.delivery_type}</p>
                    {selectedOrder.delivery_address && (
                      <p><strong>Address:</strong> {selectedOrder.delivery_address}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
                  <div className="space-y-2">
                    <p><strong>Order Status:</strong> 
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.order_status)}`}>
                        {selectedOrder.order_status.replace('_', ' ')}
                      </span>
                    </p>
                    <p><strong>Payment Status:</strong>
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                        {selectedOrder.payment_status}
                      </span>
                    </p>
                    <p><strong>Total Amount:</strong> UGX {selectedOrder.total_amount.toLocaleString()}</p>
                    <p><strong>Placed:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={item.menu_item?.image_url || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=100'}
                        alt={item.menu_item?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{item.menu_item?.name}</h4>
                        <p className="text-gray-600">Qty: {item.quantity}</p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 truncate">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          UGX {(item.price_at_time * item.quantity).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          UGX {item.price_at_time.toLocaleString()} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {getNextStatusOptions(selectedOrder.order_status, selectedOrder.delivery_type).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      disabled={updatingStatus === selectedOrder.id}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm ${
                        status === 'preparing' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                        status === 'out_for_delivery' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                        status === 'ready_for_pickup' ? 'bg-green-600 hover:bg-green-700 text-white' :
                        status === 'completed' ? 'bg-green-600 hover:bg-green-700 text-white' :
                        'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {updatingStatus === selectedOrder.id ? 'Updating...' : getStatusButtonText(status)}
                    </button>
                  ))}
                  
                  {canCancelOrder(selectedOrder.order_status) && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      disabled={updatingStatus === selectedOrder.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      Cancel Order
                    </button>
                  )}

                  {canDeleteOrder(selectedOrder) && (
                    <button
                      onClick={() => {
                        closeOrderModal()
                        openDeleteModal(selectedOrder)
                      }}
                      disabled={updatingStatus === selectedOrder.id}
                      className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 text-sm flex items-center space-x-2"
                    >
                      <icons.trash className="w-4 h-4" />
                      <span>Delete Order</span>
                    </button>
                  )}

                  <a
                    href={`https://wa.me/${selectedOrder.phone_number.replace('+', '')}?text=Hi ${selectedOrder.customer_name}, your order #${selectedOrder.id.slice(0, 8)} is ${selectedOrder.order_status.replace('_', ' ')}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
                  >
                    <icons.phone className="w-4 h-4" />
                    <span>Contact Customer</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderManagement