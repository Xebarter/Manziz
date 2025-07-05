import React, { useState } from 'react'
import { Calendar, Clock, Users, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useMetaTags } from '../hooks/useMetaTags'

const Reservations: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    specialRequest: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Set meta tags for the reservations page with featured menu item
  useMetaTags({
    title: 'Table Reservations - Manziz Restaurant',
    description: 'Reserve your table at Manziz Restaurant in Kampala, Uganda. Book online for a delightful dining experience with fresh ingredients and fast service.',
    useFirstMenuItem: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const reservationTime = new Date(`${formData.date}T${formData.time}`)
      
      const { error } = await supabase
        .from('reservations')
        .insert({
          name: formData.name,
          phone_number: formData.phone,
          reservation_time: reservationTime.toISOString(),
          guests: formData.guests,
          special_request: formData.specialRequest || null,
          status: 'pending'
        })

      if (error) throw error

      toast.success('Reservation request submitted successfully!')
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        date: '',
        time: '',
        guests: 2,
        specialRequest: ''
      })

      // Send WhatsApp notification (in a real app, this would be handled by the backend)
      const message = `New reservation request:\nName: ${formData.name}\nPhone: ${formData.phone}\nDate: ${formData.date}\nTime: ${formData.time}\nGuests: ${formData.guests}\nSpecial Request: ${formData.specialRequest}`
      const whatsappUrl = `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')

    } catch (error) {
      console.error('Error submitting reservation:', error)
      toast.error('Failed to submit reservation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'guests' ? parseInt(value) : value
    }))
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  // Get minimum time (current time if today is selected)
  const now = new Date()
  const minTime = formData.date === today ? now.toTimeString().slice(0, 5) : '09:00'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Table Reservations</h1>
          <p className="text-xl text-gray-600">Reserve your table at Manziz for a delightful dining experience</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reservation Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Make a Reservation</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Reservation Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={today}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Reservation Time *
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    min={minTime}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Number of Guests *
                </label>
                <select
                  id="guests"
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i + 1 === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="specialRequest" className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="inline w-4 h-4 mr-1" />
                  Special Requests (Optional)
                </label>
                <textarea
                  id="specialRequest"
                  name="specialRequest"
                  value={formData.specialRequest}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Any special dietary requirements, celebration details, or seating preferences?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Reservation'}
              </button>
            </form>
          </div>

          {/* Information & Guidelines */}
          <div className="space-y-6">
            {/* Restaurant Hours */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Restaurant Hours</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Thursday</span>
                  <span className="font-medium">9:00 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Friday - Saturday</span>
                  <span className="font-medium">9:00 AM - 11:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-medium">10:00 AM - 9:00 PM</span>
                </div>
              </div>
            </div>

            {/* Reservation Guidelines */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Reservation Guidelines</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  Reservations are confirmed within 2 hours of submission
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  Please arrive within 15 minutes of your reservation time
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  For parties of 8 or more, please call us directly
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  Cancellations should be made at least 2 hours in advance
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  We hold tables for 15 minutes past reservation time
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Need Immediate Assistance?</h3>
              <p className="text-gray-600 mb-4">
                For urgent requests or modifications to existing reservations, contact us directly:
              </p>
              <div className="space-y-2">
                <a
                  href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-green-600 hover:text-green-700 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  WhatsApp: +256 784 811 208
                </a>
              </div>
            </div>

            {/* Special Occasions */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-orange-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Celebrating Something Special?</h3>
              <p className="text-gray-600 mb-4">
                Let us know if you're celebrating a birthday, anniversary, or other special occasion. 
                We'll do our best to make it memorable!
              </p>
              <div className="flex items-center text-orange-600">
                <span className="text-2xl mr-2">🎉</span>
                <span className="font-medium">Mention it in your special requests above</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reservations