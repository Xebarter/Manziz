import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { MenuItem } from '../lib/supabase'
import { supabase } from '../lib/supabase'

interface CarouselProps {
  autoPlay?: boolean
  interval?: number
  showArrows?: boolean
  showDots?: boolean
  showOverlay?: boolean
  maxItems?: number
}

const Carousel: React.FC<CarouselProps> = ({
  autoPlay = true,
  interval = 5000,
  showArrows = true,
  showDots = true,
  showOverlay = true,
  maxItems = 8
}) => {
  const [items, setItems] = useState<MenuItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Fetch featured menu items
  const fetchFeaturedItems = useCallback(async () => {
    try {
      setLoading(true)
      
      // First try to get items with 'featured' tag
      let { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .contains('tags', ['featured'])
        .eq('is_available', true)
        .limit(maxItems)

      // If no featured items, get popular items
      if (!data || data.length === 0) {
        const { data: popularData, error: popularError } = await supabase
          .from('menu_items')
          .select('*')
          .contains('tags', ['popular'])
          .eq('is_available', true)
          .limit(maxItems)

        if (popularError) throw popularError
        data = popularData
      }

      // If still no items, get recent items
      if (!data || data.length === 0) {
        const { data: recentData, error: recentError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('created_at', { ascending: false })
          .limit(maxItems)

        if (recentError) throw recentError
        data = recentData
      }

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching carousel items:', error)
      // Fallback to static data
      setItems([
        {
          id: '1',
          name: 'Manziz Special Burger',
          description: 'Our signature burger with premium beef and fresh vegetables',
          price: 25000,
          image_url: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'burgers',
          is_available: true,
          tags: ['featured'],
          created_at: ''
        },
        {
          id: '2',
          name: 'Chicken Rolex',
          description: 'Traditional Ugandan wrap with grilled chicken and spices',
          price: 15000,
          image_url: 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'chicken',
          is_available: true,
          tags: ['featured'],
          created_at: ''
        },
        {
          id: '3',
          name: 'Crispy Fries',
          description: 'Golden fries seasoned with our special blend of spices',
          price: 12000,
          image_url: 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'sides',
          is_available: true,
          tags: ['featured'],
          created_at: ''
        },
        {
          id: '4',
          name: 'Grilled Chicken',
          description: 'Perfectly grilled chicken with herbs and spices',
          price: 20000,
          image_url: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'chicken',
          is_available: true,
          tags: ['featured'],
          created_at: ''
        },
        {
          id: '5',
          name: 'Beef Shawarma',
          description: 'Middle Eastern wrap with tender beef and fresh vegetables',
          price: 18000,
          image_url: 'https://images.pexels.com/photos/1199960/pexels-photo-1199960.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'wraps',
          is_available: true,
          tags: ['featured'],
          created_at: ''
        },
        {
          id: '6',
          name: 'Pizza Margherita',
          description: 'Classic Italian pizza with tomato sauce and mozzarella',
          price: 22000,
          image_url: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'pizza',
          is_available: true,
          tags: ['featured'],
          created_at: ''
        },
        {
          id: '7',
          name: 'Fish & Chips',
          description: 'Crispy battered fish with golden chips',
          price: 28000,
          image_url: 'https://images.pexels.com/photos/566566/pexels-photo-566566.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'seafood',
          is_available: true,
          tags: ['featured'],
          created_at: ''
        },
        {
          id: '8',
          name: 'Chicken Wings',
          description: 'Spicy buffalo wings with blue cheese dip',
          price: 16000,
          image_url: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'chicken',
          is_available: true,
          tags: ['featured'],
          created_at: ''
        },
        {
          id: '9',
          name: 'Beef Tacos',
          description: 'Mexican tacos with seasoned beef and fresh salsa',
          price: 14000,
          image_url: 'https://images.pexels.com/photos/2092507/pexels-photo-2092507.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'mexican',
          is_available: true,
          tags: ['featured'],
          created_at: ''
        },
        {
          id: '10',
          name: 'Pasta Carbonara',
          description: 'Creamy pasta with bacon and parmesan cheese',
          price: 24000,
          image_url: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'pasta',
          is_available: true,
          tags: ['featured'],
          created_at: ''
        },
        {
          id: '11',
          name: 'BBQ Ribs',
          description: 'Slow-cooked ribs with tangy barbecue sauce',
          price: 32000,
          image_url: 'https://images.pexels.com/photos/618775/pexels-photo-618775.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'bbq',
          is_available: true,
          tags: ['featured'],
          created_at: ''
        },
        {
          id: '12',
          name: 'Ice Cream Sundae',
          description: 'Delicious sundae with chocolate sauce and nuts',
          price: 8000,
          image_url: 'https://images.pexels.com/photos/1352281/pexels-photo-1352281.jpeg?auto=compress&cs=tinysrgb&w=800',
          category: 'desserts',
          is_available: true,
          tags: ['featured'],
          created_at: ''
        }
      ])
    } finally {
      setLoading(false)
    }
  }, [maxItems])

  useEffect(() => {
    fetchFeaturedItems()
  }, [fetchFeaturedItems])

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, items.length])

  // Navigation functions
  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      goToNext()
    }
    if (isRightSwipe) {
      goToPrevious()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  if (loading) {
    return (
      <div className="relative w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="relative w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No featured items available</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] overflow-hidden rounded-lg shadow-xl">
      {/* Carousel container */}
      <div
        className="relative w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background image */}
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
              loading={index === currentIndex ? 'eager' : 'lazy'}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800'
              }}
            />
            
            {/* Overlay */}
            {showOverlay && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                  <div className="max-w-2xl">
                    <div className="flex items-center mb-2">
                      <Star className="w-5 h-5 text-yellow-400 mr-2" />
                      <span className="text-sm font-medium bg-yellow-500 text-black px-2 py-1 rounded-full">
                        Featured
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                      {item.name}
                    </h3>
                    <p className="text-sm md:text-base text-gray-200 mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl md:text-2xl font-bold text-yellow-400">
                        UGX {item.price.toLocaleString()}
                      </span>
                      <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full font-medium transition-colors">
                        Order Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {showArrows && items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-white'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide counter */}
      <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
        {currentIndex + 1} / {items.length}
      </div>
    </div>
  )
}

export default Carousel 