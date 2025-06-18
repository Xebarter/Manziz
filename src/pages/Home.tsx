import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Clock, Utensils, Star, ArrowRight } from 'lucide-react'
import { MenuItem } from '../lib/supabase'
import { supabase } from '../lib/supabase'

const Home: React.FC = () => {
  const [popularItems, setPopularItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const features = [
    {
      icon: ChefHat,
      title: 'Fresh Ingredients',
      description: 'We use only the freshest ingredients to create delicious meals that bring smiles to your face.'
    },
    {
      icon: Clock,
      title: 'Fast Service',
      description: 'Quick preparation and delivery without compromising on quality and taste.'
    },
    {
      icon: Utensils,
      title: 'Variety Menu',
      description: 'From burgers to local delicacies, we offer a wide range of options for every taste.'
    },
    {
      icon: Star,
      title: 'Quality Guaranteed',
      description: 'Every meal is prepared with care and attention to deliver the best dining experience.'
    }
  ]

  useEffect(() => {
    fetchPopularItems()
  }, [])

  const fetchPopularItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .contains('tags', ['popular'])
        .eq('is_available', true)
        .limit(3)

      if (error) throw error
      setPopularItems(data || [])
    } catch (error) {
      console.error('Error fetching popular items:', error)
      // Fallback to static data if database query fails
      setPopularItems([
        {
          id: '1',
          name: 'Manziz Special Burger',
          description: 'Our signature burger with premium beef, fresh vegetables, and special sauce',
          price: 25000,
          image_url: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=500',
          category: 'burgers',
          is_available: true,
          tags: ['popular'],
          created_at: ''
        },
        {
          id: '2',
          name: 'Chicken Rolex',
          description: 'Traditional Ugandan wrap with grilled chicken, vegetables, and spices',
          price: 15000,
          image_url: 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=500',
          category: 'chicken',
          is_available: true,
          tags: ['popular'],
          created_at: ''
        },
        {
          id: '3',
          name: 'Manziz Fries',
          description: 'Crispy golden fries seasoned with our special blend of spices',
          price: 12000,
          image_url: 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg?auto=compress&cs=tinysrgb&w=500',
          category: 'sides',
          is_available: true,
          tags: ['popular'],
          created_at: ''
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Welcome to <span className="text-yellow-200">Manziz</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            A fast-food brand dedicated to bringing smiles through delightful tastes and aromas.
            Experience the perfect blend of flavor, quality, and convenience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/menu"
              className="bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center space-x-2"
            >
              <span>Order Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/menu"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-orange-600 transition-colors"
            >
              View Menu
            </Link>
            <Link
              to="/reservations"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-orange-600 transition-colors"
            >
              Reserve Table
            </Link>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-red-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-orange-300 rounded-full opacity-20 animate-pulse"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Manziz?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to delivering exceptional food experiences that create lasting memories
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Menu Preview */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Star className="w-8 h-8 text-yellow-500 mr-3" />
              Popular Dishes
            </h2>
            <p className="text-xl text-gray-600">Taste the favorites that keep our customers coming back</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {popularItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative">
                    <img 
                      src={item.image_url || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=500'} 
                      alt={item.name} 
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=500'
                      }}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        Popular
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-orange-600">UGX {item.price.toLocaleString()}</span>
                      <Link
                        to="/menu"
                        className="bg-orange-600 text-white px-4 py-2 rounded-full hover:bg-orange-700 transition-colors"
                      >
                        Order Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link
              to="/menu"
              className="bg-orange-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-orange-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>View Full Menu</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Experience Manziz?</h2>
          <p className="text-xl mb-8">
            Join thousands of satisfied customers who choose Manziz for their dining needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/menu"
              className="bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Start Ordering
            </Link>
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-orange-600 transition-colors"
            >
              Chat with Us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home