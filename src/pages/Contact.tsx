import React, { useState } from 'react';
import { Phone, MapPin, Clock, Mail, MessageSquare, Instagram, Twitter, MessageCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { MessageService } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';

interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

const Contact: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactForm>({
    defaultValues: {
      name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone_number || '',
      subject: '',
      message: ''
    }
  });

  const onSubmit = async (data: ContactForm) => {
    setLoading(true);
    try {
      // Send message through the message system
      const { error } = await MessageService.sendCustomerMessage(
        `Subject: ${data.subject}\n\n${data.message}`,
        data.name,
        data.email,
        data.phone
      );

      if (error) {
        throw new Error(error);
      }

      toast.success('Message sent successfully! We\'ll get back to you soon.');
      reset({
        name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone_number || '',
        subject: '',
        message: ''
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = '256784811208'; // Remove the + for WhatsApp URL
    const message = encodeURIComponent(
      `Hello Manziz! 👋\n\nI'm interested in your delicious food and would like to know more about your menu and services.\n\nThank you!`
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // Open WhatsApp in a new tab/window
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-black mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have a question, feedback, or just want to say hello? We'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="Your full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
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
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  {...register('phone', {
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: 'Please enter a valid phone number'
                    }
                  })}
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  placeholder="+256 700 000 000"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  {...register('subject', { required: 'Subject is required' })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Order Support">Order Support</option>
                  <option value="Menu Questions">Menu Questions</option>
                  <option value="Delivery Issues">Delivery Issues</option>
                  <option value="Reservations">Reservations</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Other">Other</option>
                </select>
                {errors.subject && (
                  <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  {...register('message', { 
                    required: 'Message is required',
                    minLength: {
                      value: 10,
                      message: 'Message must be at least 10 characters long'
                    }
                  })}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none"
                  placeholder="Tell us what's on your mind..."
                />
                {errors.message && (
                  <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-orange text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-brand-red transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>

            {/* Success Message */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800">
                <strong>📧 Message Delivery:</strong> Your message will be sent directly to our support team. 
                We typically respond within 2-4 hours during business hours.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-brand-orange bg-opacity-10 p-3 rounded-xl">
                    <Phone className="w-6 h-6 text-brand-orange" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                    <a 
                      href="tel:+256784811208"
                      className="text-brand-orange hover:text-brand-red transition-colors text-lg font-medium"
                    >
                      +256 784 811 208
                    </a>
                    <p className="text-sm text-gray-600 mt-1">Available 8:00 AM - 10:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-brand-orange bg-opacity-10 p-3 rounded-xl">
                    <MapPin className="w-6 h-6 text-brand-orange" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Location</h4>
                    <p className="text-gray-600">
                      Children's Medical Center Area<br />
                      Kampala, Uganda
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-brand-orange bg-opacity-10 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-brand-orange" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Opening Hours</h4>
                    <p className="text-gray-600">
                      Monday - Sunday<br />
                      8:00 AM - 10:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media & WhatsApp */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Connect With Us</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {/* WhatsApp Button - Featured */}
                <button
                  onClick={openWhatsApp}
                  className="flex items-center space-x-4 p-4 border-2 border-green-500 bg-green-50 rounded-xl hover:bg-green-100 transition-all duration-200 group"
                >
                  <div className="bg-green-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">WhatsApp</h4>
                    <p className="text-sm text-gray-600">Chat with us instantly</p>
                    <p className="text-xs text-green-600 font-medium">+256 784 811 208</p>
                  </div>
                </button>

                {/* Social Media Links */}
                <a
                  href="https://www.instagram.com/manziz_rollandnosh?igsh=cGRpbmRpbGRiOWRo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:border-brand-orange hover:bg-orange-50 transition-all duration-200"
                >
                  <Instagram className="w-6 h-6 text-brand-orange" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Instagram</h4>
                    <p className="text-sm text-gray-600">@manziz_rollandnosh</p>
                  </div>
                </a>

                <a
                  href="https://x.com/ManzizRolex"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:border-brand-orange hover:bg-orange-50 transition-all duration-200"
                >
                  <Twitter className="w-6 h-6 text-brand-orange" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Twitter</h4>
                    <p className="text-sm text-gray-600">@ManzizRolex</p>
                  </div>
                </a>

                <a
                  href="https://vm.tiktok.com/ZMSAfFJ9P/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:border-brand-orange hover:bg-orange-50 transition-all duration-200"
                >
                  <svg className="w-6 h-6 text-brand-orange fill-current" viewBox="0 0 24 24">
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17C19.32 5.3 20.91 5.5 22.5 5.6v3.67c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900">TikTok</h4>
                    <p className="text-sm text-gray-600">@manziz</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Quick Contact Options */}
            <div className="bg-gradient-to-r from-brand-orange to-brand-red rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Need Immediate Help?</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5" />
                  <span>Call us for urgent matters</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp for quick responses</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5" />
                  <span>Use our chat widget (bottom right)</span>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Find Us</h3>
              <div className="rounded-xl overflow-hidden">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.756531011437!2d32.616301837560144!3d0.3188734640272452!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177dbbf999c78f09%3A0x7d4e837ab62db04f!2sChildren's%20Medical%20Center!5e0!3m2!1sen!2sug!4v1749384442804!5m2!1sen!2sug" 
                  width="100%" 
                  height="300" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Manziz Location"
                />
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  📍 Located near Children's Medical Center for easy access and convenient pickup/delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;