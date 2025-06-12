import React, { useState } from 'react';
import { Calendar, Clock, Users, Phone, User, MessageSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ReservationForm {
  name: string;
  phoneNumber: string;
  reservationDate: string;
  reservationTime: string;
  guests: number;
  specialRequest?: string;
}

const Reservations: React.FC = () => {
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReservationForm>();

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30'
  ];

  const onSubmit = async (data: ReservationForm) => {
    setLoading(true);
    try {
      const reservationDateTime = `${data.reservationDate}T${data.reservationTime}:00`;
      
      const { error } = await supabase
        .from('reservations')
        .insert([
          {
            name: data.name,
            phone_number: data.phoneNumber,
            reservation_time: reservationDateTime,
            guests: data.guests,
            special_request: data.specialRequest
          }
        ]);

      if (error) throw error;

      toast.success('Reservation booked successfully! We\'ll call you to confirm.');
      reset();
    } catch (error) {
      console.error('Error booking reservation:', error);
      toast.error('Failed to book reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-brand-black mb-4">Book a Table</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Reserve your spot at Manziz and enjoy our delicious meals in a comfortable setting.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reservation Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Make a Reservation</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name *
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
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

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date *
                  </label>
                  <input
                    {...register('reservationDate', { required: 'Date is required' })}
                    type="date"
                    min={today}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  />
                  {errors.reservationDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.reservationDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time *
                  </label>
                  <select
                    {...register('reservationTime', { required: 'Time is required' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  {errors.reservationTime && (
                    <p className="text-red-500 text-sm mt-1">{errors.reservationTime.message}</p>
                  )}
                </div>
              </div>

              {/* Number of Guests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Number of Guests *
                </label>
                <select
                  {...register('guests', { 
                    required: 'Number of guests is required',
                    min: { value: 1, message: 'At least 1 guest is required' }
                  })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                >
                  <option value="">Select number of guests</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
                {errors.guests && (
                  <p className="text-red-500 text-sm mt-1">{errors.guests.message}</p>
                )}
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Special Requests (Optional)
                </label>
                <textarea
                  {...register('specialRequest')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none"
                  placeholder="Any special requests or dietary requirements..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-orange text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-brand-red transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Booking...' : 'Book Table'}
              </button>
            </form>
          </div>

          {/* Restaurant Info */}
          <div className="space-y-6">
            {/* Opening Hours */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-brand-orange" />
                Opening Hours
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Sunday</span>
                  <span className="font-semibold">8:00 AM - 10:00 PM</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-brand-orange" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600">Phone</p>
                  <a 
                    href="tel:+256784811208"
                    className="font-semibold text-brand-orange hover:text-brand-red"
                  >
                    +256 784 811 208
                  </a>
                </div>
                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="font-semibold">Children's Medical Center Area, Kampala</p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Find Us</h3>
              <div className="rounded-xl overflow-hidden">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.756531011437!2d32.616301837560144!3d0.3188734640272452!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177dbbf999c78f09%3A0x7d4e837ab62db04f!2sChildren's%20Medical%20Center!5e0!3m2!1sen!2sug!4v1749384442804!5m2!1sen!2sug" 
                  width="100%" 
                  height="200" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reservations;