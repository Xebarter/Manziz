import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Clock, Utensils, Star, ArrowRight } from 'lucide-react'
import { MenuItem } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { useMetaTags } from '../hooks/useMetaTags'
import Carousel from '../components/Carousel'

const Home: React.FC = () => {
  const [popularItems, setPopularItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  // Set meta tags for the home page
  useMetaTags({
    title: 'Manziz Restaurant - Delicious Food & Fast Service',
    description: 'Experience the perfect blend of flavor, quality, and convenience at Manziz Restaurant. Order online for delivery or pickup. Fresh ingredients, fast service, variety menu.',
    useFirstMenuItem: true
  })

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
        .limit(6)

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
        },
        {
          id: '4',
          name: 'Grilled Chicken',
          description: 'Perfectly grilled chicken with herbs and spices',
          price: 20000,
          image_url: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=500',
          category: 'chicken',
          is_available: true,
          tags: ['popular'],
          created_at: ''
        },
        {
          id: '5',
          name: 'Beef Shawarma',
          description: 'Middle Eastern wrap with tender beef and fresh vegetables',
          price: 18000,
          image_url: 'https://images.pexels.com/photos/1199960/pexels-photo-1199960.jpeg?auto=compress&cs=tinysrgb&w=500',
          category: 'wraps',
          is_available: true,
          tags: ['popular'],
          created_at: ''
        },
        {
          id: '6',
          name: 'Pizza Margherita',
          description: 'Classic Italian pizza with tomato sauce and mozzarella',
          price: 22000,
          image_url: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=500',
          category: 'pizza',
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
      {/* Hero Section with Carousel */}
      <section className="relative">
        {/* Carousel */}
        <div className="w-full">
          <Carousel 
            autoPlay={true}
            interval={4000}
            showArrows={true}
            showDots={true}
            showOverlay={true}
            maxItems={12}
          />
        </div>
        
        {/* Hero Content Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
          <div className="text-center text-white px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
              Welcome to <span className="text-yellow-200">Manziz</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed">
              A fast-food brand dedicated to bringing smiles through delightful tastes and aromas.
              Experience the perfect blend of flavor, quality, and convenience.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link
                to="/menu"
                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-colors inline-flex items-center justify-center space-x-2"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                to="/menu"
                className="w-full sm:w-auto bg-white/90 hover:bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-colors"
              >
                View Menu
              </Link>
              <Link
                to="/reservations"
                className="w-full sm:w-auto border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-white hover:text-gray-900 transition-colors"
              >
                Reserve Table
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Why Choose Manziz?</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              We're committed to delivering exceptional food experiences that create lasting memories
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4 sm:p-6 rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Menu Preview */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center justify-center">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mr-2 sm:mr-3" />
              Popular Dishes
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">Taste the favorites that keep our customers coming back</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {popularItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative">
                    <img 
                      src={item.image_url || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=500'} 
                      alt={item.name} 
                      className="w-full h-40 sm:h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=500'
                      }}
                    />
                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                      <span className="bg-yellow-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Popular
                      </span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <span className="text-xl sm:text-2xl font-bold text-orange-600">UGX {item.price.toLocaleString()}</span>
                      <Link
                        to="/menu"
                        className="w-full sm:w-auto bg-orange-600 text-white px-4 py-2 rounded-full hover:bg-orange-700 transition-colors text-center text-sm sm:text-base font-medium"
                      >
                        Order Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-10 sm:mt-12">
            <Link
              to="/menu"
              className="bg-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-orange-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>View Full Menu</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Ready to Experience Manziz?</h2>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 leading-relaxed">
            Join thousands of satisfied customers who choose Manziz for their dining needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link
              to="/menu"
              className="w-full sm:w-auto bg-white text-orange-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-gray-100 transition-colors"
            >
              Start Ordering
            </Link>
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-white hover:text-orange-600 transition-colors"
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