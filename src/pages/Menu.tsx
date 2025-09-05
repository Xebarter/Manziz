import React, { useState, useEffect } from 'react'
import { Search, Filter, Plus, Minus, ShoppingCart, X, ZoomIn, Share2 } from 'lucide-react'
import { MenuItem } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { useMetaTags } from '../hooks/useMetaTags'
import FavoriteButton from '../components/FavoriteButton'
import toast from 'react-hot-toast'

const Menu: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})
  const [notes, setNotes] = useState<{ [key: string]: string }>({})
  const [zoomedImage, setZoomedImage] = useState<{ url: string; name: string } | null>(null)
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null)
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)
  
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()

  // Set meta tags for the menu page with dynamic item support
  useMetaTags({
    title: selectedMenuItem ? `${selectedMenuItem.name} - Manziz Restaurant` : 'Menu - Manziz Restaurant',
    description: selectedMenuItem 
      ? `${selectedMenuItem.description || `Try our delicious ${selectedMenuItem.name}`} - Only UGX ${selectedMenuItem.price.toLocaleString()} at Manziz Restaurant`
      : 'Explore our delicious menu featuring burgers, chicken, rolex, and more. Fresh ingredients, fast service, variety menu.',
    image: selectedMenuItem?.image_url,
    imageAlt: selectedMenuItem ? `${selectedMenuItem.name} from Manziz Restaurant` : undefined,
    useFirstMenuItem: !selectedMenuItem
  })

  // Updated categories to match the new structure
  const categories = ['all', 'rolex', 'chicken', 'pork', 'beef', 'drinks', 'desserts', 'salad']
  const tags = ['AYaaZ BBQ', 'popular', 'new']

  useEffect(() => {
    fetchMenuItems()
    
    // Check for highlighted item from URL
    const urlParams = new URLSearchParams(window.location.search)
    const itemId = urlParams.get('item')
    if (itemId) {
      setHighlightedItem(itemId)
      // Remove the parameter from URL after highlighting
      window.history.replaceState({}, '', window.location.pathname)
      
      // Auto-scroll to highlighted item after items load
      setTimeout(() => {
        const element = document.getElementById(`menu-item-${itemId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
    }
  }, [])

  useEffect(() => {
    filterItems()
  }, [menuItems, searchTerm, selectedCategory, selectedTags])

  // Close zoom on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomedImage(null)
      }
    }

    if (zoomedImage) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [zoomedImage])

  // Clear highlight after 3 seconds
  useEffect(() => {
    if (highlightedItem) {
      const timer = setTimeout(() => {
        setHighlightedItem(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightedItem])

  // Handle menu item selection from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const itemId = urlParams.get('item')
    
    if (itemId && menuItems.length > 0) {
      const item = menuItems.find(menuItem => menuItem.id === itemId)
      if (item) {
        setSelectedMenuItem(item)
        setHighlightedItem(itemId)
        
        // Auto-scroll to highlighted item
        setTimeout(() => {
          const element = document.getElementById(`menu-item-${itemId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 500)
        
        // Clear highlight after 3 seconds
        setTimeout(() => {
          setHighlightedItem(null)
        }, 3000)
      }
    }
  }, [menuItems])

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true })

      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error('Error fetching menu items:', error)
      toast.error('Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = menuItems

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        selectedTags.every(tag => item.tags.includes(tag))
      )
    }

    setFilteredItems(filtered)
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, quantity)
    }))
  }

  const handleAddToCart = (item: MenuItem) => {
    const quantity = quantities[item.id] || 1
    const itemNotes = notes[item.id]

    addToCart({
      menu_item: item,
      quantity,
      notes: itemNotes
    })

    toast.success(`${item.name} added to cart!`)
    
    // Reset quantity and notes
    setQuantities(prev => ({ ...prev, [item.id]: 1 }))
    setNotes(prev => ({ ...prev, [item.id]: '' }))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const getCategoryDisplayName = (category: string) => {
    if (category === 'all') return 'All Categories'
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  const handleImageClick = (imageUrl: string, itemName: string) => {
    setZoomedImage({ url: imageUrl, name: itemName })
  }

  const closeZoom = () => {
    setZoomedImage(null)
  }

  const getOptimizedImageUrl = (url: string, size: 'thumbnail' | 'medium' | 'large' = 'medium') => {
    if (!url) return 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400'
    
    // If it's a Pexels URL, optimize it
    if (url.includes('pexels.com')) {
      const sizeMap = {
        thumbnail: 'w=300&h=200',
        medium: 'w=600&h=400', 
        large: 'w=1200&h=800'
      }
      
      // Remove existing size parameters and add new ones
      const baseUrl = url.split('?')[0]
      return `${baseUrl}?auto=compress&cs=tinysrgb&${sizeMap[size]}&fit=crop`
    }
    
    return url
  }

  const shareMenuItem = (item: MenuItem) => {
    // Generate a proper URL for sharing with menu item ID
    const shareUrl = `${window.location.origin}/menu?item=${item.id}`
    const shareText = `Check out this delicious ${item.name} from Manziz Restaurant! ${item.description || `Try our amazing ${item.name}`} - Only UGX ${item.price.toLocaleString()}`
    
    // Update meta tags for this specific item when sharing
    setSelectedMenuItem(item)
    
    // Check if Web Share API is supported
    if (navigator.share) {
      navigator.share({
        title: `${item.name} - Manziz Restaurant`,
        text: shareText,
        url: shareUrl,
      }).catch(err => console.log('Error sharing:', err))
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
        toast.success('Share link copied to clipboard!')
      }).catch(() => {
        toast.error('Failed to copy share link')
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Menu</h1>
          <p className="text-xl text-gray-600">Discover our delicious selection of fresh, flavorful meals</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {getCategoryDisplayName(category)}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferences</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              id={`menu-item-${item.id}`}
              className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 ${
                highlightedItem === item.id 
                  ? 'ring-4 ring-orange-400 ring-opacity-75 shadow-xl transform scale-105' 
                  : ''
              }`}
            >
              <div className="relative group">
                <img
                  src={getOptimizedImageUrl(item.image_url, 'medium')}
                  alt={item.name}
                  className="w-full h-48 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  onClick={() => handleImageClick(getOptimizedImageUrl(item.image_url, 'large'), item.name)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getOptimizedImageUrl('', 'medium')
                  }}
                  loading="lazy"
                />
                
                {/* Zoom indicator */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-3">
                    <ZoomIn className="w-6 h-6 text-gray-800" />
                  </div>
                </div>
                
                {/* Tags */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                  {item.tags.map(tag => (
                    <span key={tag} className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tag === 'popular' 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-orange-600 text-white'
                    }`}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="absolute top-4 right-4 flex flex-col space-y-2">
                  <FavoriteButton 
                    item={item} 
                    className="shadow-lg"
                    showLoginPrompt={!isAuthenticated}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      shareMenuItem(item)
                    }}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200 shadow-md hover:shadow-lg"
                    title="Share this item"
                  >
                    <Share2 className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900 truncate flex-1 mr-3">{item.name}</h3>
                  <span className="text-lg lg:text-xl font-bold text-orange-600 whitespace-nowrap">
                    UGX {item.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm lg:text-base mb-4 line-clamp-2">{item.description}</p>
                
                <div className="flex justify-between items-center text-sm lg:text-base mb-4">
                  <span className="text-gray-500 capitalize font-medium">{item.category}</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs lg:text-sm font-medium rounded-full">
                    Available
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Quantity:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) - 1)}
                        className="p-1 rounded-full border border-gray-300 hover:bg-gray-100"
                        disabled={!quantities[item.id] || quantities[item.id] <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{quantities[item.id] || 1}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || 1) + 1)}
                        className="p-1 rounded-full border border-gray-300 hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <input
                      type="text"
                      placeholder="Special instructions (optional)"
                      value={notes[item.id] || ''}
                      onChange={(e) => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No items match your current filters.</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setSelectedTags([])
              }}
              className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={closeZoom}
        >
          <div className="relative max-w-full max-h-full flex flex-col items-center">
            {/* Close button */}
            <button
              onClick={closeZoom}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-3 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Image */}
            <img
              src={zoomedImage.url}
              alt={zoomedImage.name}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Image title */}
            <div className="mt-4 text-center">
              <h3 className="text-white text-xl font-semibold">{zoomedImage.name}</h3>
              <p className="text-gray-300 text-sm mt-2">Click outside to close • Press ESC to close</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Menu