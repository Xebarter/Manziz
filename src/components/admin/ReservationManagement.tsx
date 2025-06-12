import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Eye, Phone, Users, Clock, CheckCircle, X } from 'lucide-react';
import { supabase, Reservation } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const ReservationManagement: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchTerm, dateFilter]);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('reservation_time', { ascending: true });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      // Demo data
      setReservations([
        {
          id: '1',
          name: 'John Doe',
          phone_number: '+256784811208',
          reservation_time: new Date(Date.now() + 86400000).toISOString(),
          guests: 4,
          special_request: 'Window seat preferred',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Jane Smith',
          phone_number: '+256784811209',
          reservation_time: new Date(Date.now() + 172800000).toISOString(),
          guests: 2,
          special_request: null,
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          name: 'Mike Johnson',
          phone_number: '+256784811210',
          reservation_time: new Date(Date.now() + 259200000).toISOString(),
          guests: 6,
          special_request: 'Birthday celebration - need cake table',
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = reservations;

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 86400000);
      const nextWeek = new Date(today.getTime() + 7 * 86400000);

      filtered = filtered.filter(reservation => {
        const reservationDate = new Date(reservation.reservation_time);
        
        switch (dateFilter) {
          case 'today':
            return reservationDate >= today && reservationDate < tomorrow;
          case 'tomorrow':
            return reservationDate >= tomorrow && reservationDate < new Date(tomorrow.getTime() + 86400000);
          case 'week':
            return reservationDate >= today && reservationDate < nextWeek;
          case 'past':
            return reservationDate < today;
          default:
            return true;
        }
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(reservation =>
        reservation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.phone_number.includes(searchTerm) ||
        reservation.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReservations(filtered);
  };

  const viewReservationDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  const getReservationStatus = (reservationTime: string) => {
    const now = new Date();
    const reservation = new Date(reservationTime);
    const diffHours = (reservation.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return { status: 'past', label: 'Completed', color: 'bg-gray-100 text-gray-800' };
    } else if (diffHours < 2) {
      return { status: 'soon', label: 'Coming Soon', color: 'bg-red-100 text-red-800' };
    } else if (diffHours < 24) {
      return { status: 'today', label: 'Today', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'upcoming', label: 'Upcoming', color: 'bg-green-100 text-green-800' };
    }
  };

  const deleteReservation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return;

    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReservations(reservations.filter(reservation => reservation.id !== id));
      toast.success('Reservation deleted successfully');
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Failed to delete reservation');
    }
  };

  const dateFilterOptions = [
    { value: 'all', label: 'All Reservations' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'This Week' },
    { value: 'past', label: 'Past' }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reservations...</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Reservation Management</h2>
            <p className="text-gray-600">Manage table reservations and bookings</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reservations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
              >
                {dateFilterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {filteredReservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No reservations found</h3>
            <p className="text-gray-600">No reservations match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Special Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => {
                  const status = getReservationStatus(reservation.reservation_time);
                  return (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {reservation.phone_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(reservation.reservation_time).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(reservation.reservation_time).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          {reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {reservation.special_request || 'None'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => viewReservationDetails(reservation)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteReservation(reservation.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reservation Details Modal */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Reservation Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">Name:</span>
                      <span className="text-gray-900">{selectedReservation.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{selectedReservation.phone_number}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Reservation Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {formatDate(selectedReservation.reservation_time)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {selectedReservation.guests} {selectedReservation.guests === 1 ? 'guest' : 'guests'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedReservation.special_request && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Special Request</h4>
                    <p className="text-gray-700">{selectedReservation.special_request}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Booking Information</h4>
                  <p className="text-sm text-gray-600">
                    Booked on: {formatDate(selectedReservation.created_at)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Reservation ID: #{selectedReservation.id.slice(0, 8)}
                  </p>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Close
                  </button>
                  <a
                    href={`tel:${selectedReservation.phone_number}`}
                    className="flex items-center space-x-2 bg-brand-orange text-white px-4 py-2 rounded-lg hover:bg-brand-red transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Customer</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManagement;