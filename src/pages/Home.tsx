import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Clock, Utensils, Star, ArrowRight, MapPin, Users, MessageCircle, Info, Sparkles, List } from 'lucide-react'
import { MenuItem } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { useMetaTags } from '../hooks/useMetaTags'
import Carousel from '../components/Carousel'

const Home: React.FC = () => {
  const [popularItems, setPopularItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(true)

  // Toggle menu on small screens when clicking outside
  const handleHeroClick = (e: React.MouseEvent) => {
    if (window.innerWidth < 1024) { // lg breakpoint
      const nav = document.querySelector('nav')
      if (nav && !nav.contains(e.target as Node)) {
        setIsMenuOpen(prev => !prev)
      }
    }
  }

  // Close menu on route change (when clicking a link)
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.innerWidth < 1024) {
        setIsMenuOpen(false)
      }
    }
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  // Show menu on page load
  useEffect(() => {
    setIsMenuOpen(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY
      setIsScrolled(offset > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Set meta tags for the home page with featured menu item
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
        .contains('tags', ['AYaaZ BBQ'])
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

  const navigation = [
    { name: 'MENU', href: '/menu', icon: Utensils },
    { name: 'RESERVE', href: '/reservations', icon: Clock },
    { name: 'MY ORDERS', href: '/my-orders', icon: List },
    { name: 'ABOUT US', href: '/about', icon: Info },
    { name: 'CONTACT', href: '/contact', icon: MessageCircle },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section 
        className="relative h-screen flex items-center justify-center overflow-hidden"
        onClick={handleHeroClick}
      >
        {/* Right Side Navigation - Hidden when scrolled or toggled off on mobile */}
        <nav className={`fixed right-0 top-0 h-full z-30 transition-transform duration-500 ease-in-out ${
          isScrolled || (window.innerWidth < 1024 && !isMenuOpen) ? 'translate-x-full' : 'translate-x-0'
        }`}>
          <div className="h-full w-72 flex flex-col relative">
            {/* Convex lens effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/10 to-black/20 rounded-l-3xl backdrop-blur-[3px]" 
                 style={{
                   maskImage: 'radial-gradient(ellipse at 30% 50%, white, transparent 70%)',
                   WebkitMaskImage: 'radial-gradient(ellipse at 30% 50%, white, transparent 70%)',
                   width: '110%',
                   right: '-10%'
                 }}>
            </div>
            {/* Brand Logo */}
            <div className="p-8 pt-12 text-center relative z-10">
              <h1 className="text-5xl font-bold text-white mb-2 tracking-tight" style={{ 
                fontFamily: "'Playfair Display', serif",
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
              }}>
                Manziz
              </h1>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 flex flex-col justify-center relative z-10">
              <div className="space-y-0">
                {navigation.map((item, index) => (
                  <div key={item.name} className="relative group">
                    <div className="h-[1px] bg-white/40 w-4/5 mx-auto"></div>
                    <Link
                      to={item.href}
                      className="flex items-center justify-start py-4 px-8 transition-all duration-300 hover:bg-white/10 gap-4"
                    >
                      {item.icon && (
                        <item.icon 
                          className="w-5 h-5 text-white/80 group-hover:text-white transition-colors flex-shrink-0" 
                          style={{ filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.8))', opacity: 0.8 }} 
                        />
                      )}
                      <span 
                        className="text-white text-xl font-semibold tracking-wider uppercase" 
                        style={{ 
                          fontFamily: "'Montserrat', sans-serif",
                          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                          letterSpacing: '0.15em',
                          padding: '0.1rem 0'
                        }}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </div>
                ))}
                <div className="h-[1px] bg-white/40 w-4/5 mx-auto"></div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="px-8 pb-8 pt-3 relative z-10">
              <a
                href="#ayaaz-bbq-pit"
                className="w-full flex items-center justify-center px-10 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 group relative overflow-hidden cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('ayaaz-bbq-pit');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                <div className="flex flex-col items-center justify-center relative z-10">
                  <span className="text-xl font-semibold tracking-wide whitespace-nowrap drop-shadow-sm">AYaaZ BBQ Pit</span>
                  <span className="text-xs font-medium tracking-wider text-white/90 group-hover:text-white transition-colors duration-300 mt-0.5">By Manziz</span>
                </div>
                
                <ArrowRight className="w-5 h-5 ml-4 -mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                
                {/* Subtle border highlight */}
                <div className="absolute inset-0 rounded-xl border-2 border-white/10 group-hover:border-white/20 transition-colors duration-300" />
              </a>
            </div>
          </div>
        </nav>

        {/* Carousel */}
        <div className="absolute inset-0 z-0">
          <Carousel autoPlay={true} interval={5000} showArrows={false} showDots={false} showOverlay={false} />
        </div>

        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        
        {/* Center Start Order Button */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <Link
            to="/menu"
            className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white text-xl font-semibold tracking-wider rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            START ORDER
          </Link>
        </div>
      </section>

      {/* Features Section - Luxury Design */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Why Choose
              <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent"> Manziz?</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
              We're committed to delivering exceptional food experiences that create lasting memories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="text-center p-6 group hover:bg-white hover:shadow-xl rounded-xl transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed font-light">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Menu Preview - Premium */}
      <section id="ayaaz-bbq-pit" className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, orange 2px, transparent 2px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight flex items-center justify-center">
              <Star className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500 mr-3" />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-300 bg-clip-text text-transparent">
                AYaaZ BBQ PIT (By Manziz)
              </span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
              Mouthwatering barbecue, grilled to perfection and packed with flavor. Our AYaaZ BBQ PIT selection features the finest grilled meats and sides.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-400"></div>
                <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-r-2 border-l-2 border-orange-600 animate-reverse-spin"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {popularItems.map((item, index) => (
                <div key={item.id} className="group bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 transform hover:-translate-y-2 border border-gray-700/50">
                  <div className="relative overflow-hidden">
                    <img
                      src={item.image_url || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=500'}
                      alt={item.name}
                      className="w-full h-56 sm:h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=500'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 left-4">
                      <span className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-lg">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Sparkles className="w-6 h-6 text-yellow-400" />
                    </div>
                  </div>
                  <div className="p-6 sm:p-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-yellow-300 transition-colors duration-300">
                      {item.name}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-300 mb-6 leading-relaxed line-clamp-2 font-light">
                      {item.description}
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                      <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent">
                        UGX {item.price.toLocaleString()}
                      </span>
                      <Link
                        to="/menu"
                        className="group/btn relative overflow-hidden w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-6 py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg text-center min-h-[44px] flex items-center justify-center"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                        <span className="relative">Order Now</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12 sm:mt-16">
            <Link
              to="/menu"
              className="group relative overflow-hidden bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-10 sm:px-12 py-4 sm:py-5 rounded-full font-semibold text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-orange-500/25 inline-flex items-center space-x-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="relative">View Full Menu</span>
              <ArrowRight className="relative w-5 h-5 sm:w-6 sm:h-6 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Luxury */}
      <section className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-600 via-orange-500 to-red-600 text-white relative overflow-hidden">
        {/* Luxury Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-400/20 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-red-500/20 to-transparent rounded-full transform translate-x-48 translate-y-48"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-white/10 to-transparent rounded-full transform -translate-y-1/2"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Ready to Experience Manziz?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-10 sm:mb-12 leading-relaxed font-light max-w-4xl mx-auto">
              Join thousands of satisfied customers who choose Manziz for their dining needs.
            </p>
          </div>

          <div className="flex flex-col gap-4 justify-center items-center max-w-md mx-auto sm:max-w-none sm:flex-row sm:gap-6">
            <Link
              to="/menu"
              className="group relative overflow-hidden w-full sm:w-auto bg-white text-orange-600 px-10 py-5 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl min-h-[56px] flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-50 via-white to-orange-50 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="relative">Start Ordering</span>
            </Link>

            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto border-2 border-white/80 backdrop-blur-sm text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white/10 hover:border-white transition-all duration-300 transform hover:scale-105 min-h-[56px] flex items-center justify-center"
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