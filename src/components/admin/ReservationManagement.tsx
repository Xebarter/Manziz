import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Phone, CheckCircle, X, Eye } from 'lucide-react'
import { Reservation } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const ReservationManagement: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const statusOptions = [
    { value: 'all', label: 'All Reservations' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('reservation_time', { ascending: true })

      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error('Error fetching reservations:', error)
      toast.error('Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const updateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservationId)

      if (error) throw error
      
      toast.success('Reservation status updated successfully')
      fetchReservations()
      
      // Update selected reservation if it's currently being viewed
      if (selectedReservation?.id === reservationId) {
        setSelectedReservation(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (error) {
      console.error('Error updating reservation status:', error)
      toast.error('Failed to update reservation status')
    }
  }

  const openModal = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedReservation(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isUpcoming = (reservationTime: string) => {
    return new Date(reservationTime) > new Date()
  }

  const isPast = (reservationTime: string) => {
    return new Date(reservationTime) < new Date()
  }

  const filteredReservations = reservations.filter(reservation => 
    statusFilter === 'all' || reservation.status === statusFilter
  )

  const upcomingReservations = filteredReservations.filter(r => isUpcoming(r.reservation_time))
  const pastReservations = filteredReservations.filter(r => isPast(r.reservation_time))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reservation Management</h1>
          <p className="text-gray-600">Manage customer table reservations</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm text-gray-600">Total</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{reservations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm text-gray-600">Pending</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {reservations.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm text-gray-600">Confirmed</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {reservations.filter(r => r.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm text-gray-600">Upcoming</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{upcomingReservations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Reservations */}
      {upcomingReservations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Reservations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guests
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                          {reservation.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-32">
                          {reservation.phone_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {new Date(reservation.reservation_time).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(reservation.reservation_time).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reservation.guests}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <select
                        value={reservation.status}
                        onChange={(e) => updateReservationStatus(reservation.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(reservation.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(reservation)}
                          className="text-orange-600 hover:text-orange-900 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={`https://wa.me/${reservation.phone_number.replace('+', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Contact Customer"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Past Reservations */}
      {pastReservations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Past Reservations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guests
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pastReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50 opacity-75">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                          {reservation.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-32">
                          {reservation.phone_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {new Date(reservation.reservation_time).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(reservation.reservation_time).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reservation.guests}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal(reservation)}
                        className="text-orange-600 hover:text-orange-900 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredReservations.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No reservations found.</p>
          <p className="text-gray-400">Reservations will appear here when customers book tables.</p>
        </div>
      )}

      {/* Reservation Details Modal */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Reservation Details
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {selectedReservation.name}</p>
                    <p><strong>Phone:</strong> {selectedReservation.phone_number}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Reservation Details</h3>
                  <div className="space-y-2">
                    <p><strong>Date:</strong> {new Date(selectedReservation.reservation_time).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {new Date(selectedReservation.reservation_time).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</p>
                    <p><strong>Guests:</strong> {selectedReservation.guests}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReservation.status)}`}>
                        {selectedReservation.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {selectedReservation.special_request && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Request</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedReservation.special_request}
                  </p>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateReservationStatus(selectedReservation.id, 'confirmed')}
                    disabled={selectedReservation.status === 'confirmed'}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Confirm Reservation
                  </button>
                  
                  <button
                    onClick={() => updateReservationStatus(selectedReservation.id, 'cancelled')}
                    disabled={selectedReservation.status === 'cancelled'}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Cancel Reservation
                  </button>

                  <a
                    href={`https://wa.me/${selectedReservation.phone_number.replace('+', '')}?text=Hi ${selectedReservation.name}, regarding your reservation for ${selectedReservation.guests} guests on ${new Date(selectedReservation.reservation_time).toLocaleDateString()}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
                  >
                    <Phone className="w-4 h-4" />
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

export default ReservationManagement