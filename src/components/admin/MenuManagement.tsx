import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, Upload, X, Save, Star, Zap, Share2, ExternalLink, Copy } from 'lucide-react'
import { MenuItem } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const MenuManagement: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [sharingItem, setSharingItem] = useState<MenuItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    is_available: true,
    tags: [] as string[],
    image_url: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Updated categories as requested
  const categories = ['rolex', 'chicken', 'pork', 'beef', 'drinks', 'desserts', 'salad', 'goat', 'sausage']
  const availableTags = ['AYaaZ BBQ', 'Pre-Order', 'spicy', 'vegetarian', 'vegan', 'gluten-free', 'popular', 'new', 'signature', 'local', 'grilled', 'fresh', 'healthy', 'crispy', 'smoked']

  // Quick add presets for common items
  const quickPresets = [
    {
      name: 'Chicken Rolex',
      category: 'rolex',
      description: 'Traditional Ugandan wrap with grilled chicken, vegetables, and spices',
      price: '15000',
      tags: ['popular', 'local'],
      image_url: 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=500'
    },
    {
      name: 'Beef Rolex',
      category: 'rolex',
      description: 'Delicious beef wrap with fresh vegetables and special sauce',
      price: '18000',
      tags: ['signature'],
      image_url: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=500'
    },
    {
      name: 'Grilled Chicken',
      category: 'chicken',
      description: 'Tender grilled chicken seasoned with our special spices',
      price: '20000',
      tags: ['grilled', 'healthy'],
      image_url: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=500'
    },
    {
      name: 'Fresh Juice',
      category: 'drinks',
      description: 'Refreshing blend of seasonal fruits, freshly squeezed',
      price: '8000',
      tags: ['fresh', 'healthy'],
      image_url: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=500'
    }
  ]

  // Social media platforms
  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: '📘',
      shareUrl: (url: string, text: string) => 
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Twitter/X',
      icon: '🐦',
      shareUrl: (url: string, text: string) => 
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      color: 'bg-black hover:bg-gray-800'
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      shareUrl: (url: string, text: string) => 
        `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'Instagram',
      icon: '📷',
      shareUrl: (url: string, text: string) => 
        `https://www.instagram.com/`, // Instagram doesn't support direct sharing, will copy to clipboard
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      shareUrl: (url: string, text: string) => 
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: 'bg-blue-700 hover:bg-blue-800'
    },
    {
      name: 'TikTok',
      icon: '🎵',
      shareUrl: (url: string, text: string) => 
        `https://www.tiktok.com/`, // TikTok doesn't support direct sharing, will copy to clipboard
      color: 'bg-black hover:bg-gray-800'
    }
  ]

  useEffect(() => {
    fetchMenuItems()

    // Set up real-time subscription for menu items
    const subscription = supabase
      .channel('admin_menu_management')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
          console.log('Menu item change in real-time:', payload)
          
          if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as MenuItem
            setMenuItems(prevItems => 
              prevItems.map(item => 
                item.id === updatedItem.id ? updatedItem : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedItem = payload.old as MenuItem
            setMenuItems(prevItems => 
              prevItems.filter(item => item.id !== deletedItem.id)
            )
          } else if (payload.eventType === 'INSERT') {
            const newItem = payload.new as MenuItem
            setMenuItems(prevItems => [newItem, ...prevItems])
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Real-time subscription established for menu management')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription failed:', status)
          toast.error('Failed to establish real-time connection. Changes may not update automatically.')
          
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            console.log('Attempting to reconnect real-time subscription...')
            subscription.unsubscribe()
            fetchMenuItems()
          }, 5000)
        }
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
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

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `menu/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Storage bucket not configured. Please run the database migration to set up storage.')
        }
        if (uploadError.message.includes('row-level security policy')) {
          throw new Error('Storage permissions not configured. Please check your RLS policies.')
        }
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      if (!data.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image')
      }

      return data.publicUrl
    } catch (error: any) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let imageUrl = formData.image_url

      if (selectedFile) {
        try {
          imageUrl = await uploadImage(selectedFile)
          toast.success('Image uploaded successfully!')
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError)
          toast.error(uploadError.message || 'Image upload failed. Saving item without uploaded image.')
          imageUrl = formData.image_url || ''
        }
      }

      const itemData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        is_available: formData.is_available,
        tags: formData.tags,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      }

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id)
          .select()

        if (error) throw error
        toast.success('Menu item updated successfully')
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([{ ...itemData, created_at: new Date().toISOString() }])
          .select()

        if (error) throw error
        toast.success('Menu item added successfully')
      }

      // Refresh the menu items list
      await fetchMenuItems()
      closeModal()
    } catch (error: any) {
      console.error('Error saving menu item:', error)
      toast.error(error.message || 'Failed to save menu item')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return

    try {
      // First check if the item is referenced in any orders
      const { data: orderItems, error: checkError } = await supabase
        .from('order_items')
        .select('id')
        .eq('menu_item_id', id)
        .limit(1)

      if (checkError) throw checkError

      if (orderItems && orderItems.length > 0) {
        toast.error('Cannot delete menu item as it is referenced in existing orders')
        return
      }

      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
        .select()

      if (error) throw error

      // Remove the item from the local state
      setMenuItems(prevItems => prevItems.filter(item => item.id !== id))
      toast.success('Menu item deleted successfully')
    } catch (error: any) {
      console.error('Error deleting menu item:', error)
      toast.error(error.message || 'Failed to delete menu item')
    }
  }

  const openModal = (item?: MenuItem) => {
    setEditingItem(item || null)
    setFormData({
      name: item?.name || '',
      description: item?.description || '',
      category: item?.category || '',
      price: item?.price.toString() || '',
      is_available: item?.is_available ?? true,
      tags: item?.tags || [],
      image_url: item?.image_url || ''
    })
    setSelectedFile(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setSelectedFile(null)
  }

  const openShareModal = (item: MenuItem) => {
    setSharingItem(item)
    setShowShareModal(true)
  }

  const closeShareModal = () => {
    setShowShareModal(false)
    setSharingItem(null)
  }

  const generateShareContent = (item: MenuItem) => {
    const shareUrl = `${window.location.origin}/menu?item=${item.id}`
    const shareText = `🍽️ Check out this delicious ${item.name} from Manziz Restaurant!\n\n${item.description}\n\nOnly UGX ${item.price.toLocaleString()} - Order now!`
    
    return { shareUrl, shareText }
  }

  const handleSocialShare = (platform: typeof socialPlatforms[0], item: MenuItem) => {
    const { shareUrl, shareText } = generateShareContent(item)
    
    if (platform.name === 'Instagram' || platform.name === 'TikTok') {
      // These platforms don't support direct sharing, copy to clipboard instead
      const fullText = `${shareText}\n\n${shareUrl}`
      navigator.clipboard.writeText(fullText).then(() => {
        toast.success(`Content copied to clipboard! Open ${platform.name} and paste to share.`)
      }).catch(() => {
        toast.error('Failed to copy to clipboard')
      })
    } else {
      // Open sharing URL in new window
      const url = platform.shareUrl(shareUrl, shareText)
      window.open(url, '_blank', 'width=600,height=400')
      toast.success(`Sharing on ${platform.name}!`)
    }
  }

  const copyShareLink = (item: MenuItem) => {
    const { shareUrl, shareText } = generateShareContent(item)
    const fullContent = `${shareText}\n\n${shareUrl}`
    
    navigator.clipboard.writeText(fullContent).then(() => {
      toast.success('Share content copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy to clipboard')
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed')
        return
      }
      setSelectedFile(file)
    }
  }

  const applyQuickPreset = (preset: typeof quickPresets[0]) => {
    setFormData({
      name: preset.name,
      description: preset.description,
      category: preset.category,
      price: preset.price,
      is_available: true,
      tags: preset.tags,
      image_url: preset.image_url
    })
    toast.success('Preset applied! You can modify any details before saving.')
  }

  const togglePopular = async (item: MenuItem) => {
    try {
      const isCurrentlyPopular = item.tags.includes('popular')
      const newTags = isCurrentlyPopular 
        ? item.tags.filter(tag => tag !== 'popular')
        : [...item.tags, 'popular']

      const { error } = await supabase
        .from('menu_items')
        .update({ tags: newTags })
        .eq('id', item.id)

      if (error) throw error
      
      toast.success(isCurrentlyPopular ? 'Removed from popular items' : 'Added to popular items')
      fetchMenuItems()
    } catch (error) {
      console.error('Error updating popular status:', error)
      toast.error('Failed to update popular status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-lg text-gray-600 mt-2">Manage your restaurant menu items and share them on social media</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-3 w-full lg:w-auto justify-center text-lg"
        >
          <Plus className="w-6 h-6" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Quick Add Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
        <div className="flex items-center mb-6">
          <Zap className="w-6 h-6 text-orange-600 mr-3" />
          <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Quick Add</h2>
          <span className="ml-3 text-base text-gray-500 hidden lg:inline">Click to use preset and customize</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {quickPresets.map((preset, index) => (
            <button
              key={index}
              onClick={() => {
                applyQuickPreset(preset)
                openModal()
              }}
              className="p-4 lg:p-6 text-left bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 rounded-xl border border-orange-200 transition-colors"
            >
              <div className="font-medium text-gray-900 text-base lg:text-lg">{preset.name}</div>
              <div className="text-sm text-gray-600 capitalize mt-1">{preset.category}</div>
              <div className="text-sm font-medium text-orange-600 mt-2">UGX {parseInt(preset.price).toLocaleString()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="relative">
              <img
                src={item.image_url || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={item.name}
                className="w-full h-48 lg:h-56 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400'
                }}
              />
              {!item.is_available && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">Unavailable</span>
                </div>
              )}
              <div className="absolute top-3 right-3 flex flex-col space-y-2">
                <button
                  onClick={() => openShareModal(item)}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                  title="Share on social media"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => togglePopular(item)}
                  className={`p-2 rounded-full shadow-lg transition-colors ${
                    item.tags.includes('popular')
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-white text-gray-600 hover:bg-yellow-50'
                  }`}
                  title={item.tags.includes('popular') ? 'Remove from popular' : 'Mark as popular'}
                >
                  <Star className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openModal(item)}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <Edit className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>

            <div className="p-5 lg:p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 truncate flex-1 mr-3">{item.name}</h3>
                <span className="text-lg lg:text-xl font-bold text-orange-600 whitespace-nowrap">
                  UGX {item.price.toLocaleString()}
                </span>
              </div>
              <p className="text-gray-600 text-sm lg:text-base mb-4 line-clamp-2">{item.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {item.tags.slice(0, 3).map((tag) => (
                  <span 
                    key={tag} 
                    className={`px-3 py-1 text-xs lg:text-sm rounded-full ${
                      tag === 'popular' 
                        ? 'bg-yellow-100 text-yellow-800 font-medium' 
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {tag === 'popular' && <Star className="w-3 h-3 inline mr-1" />}
                    {tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="px-3 py-1 text-xs lg:text-sm rounded-full bg-gray-100 text-gray-600">
                    +{item.tags.length - 3}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center text-sm lg:text-base">
                <span className="text-gray-500 capitalize font-medium">{item.category}</span>
                <span className={`px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${
                  item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-xl">No menu items yet.</p>
          <p className="text-gray-400 text-lg mt-2">Add your first menu item to get started.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 lg:p-8 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                    placeholder="e.g., Chicken Rolex"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                  placeholder="Brief description of the item"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Price (UGX) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="500"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                  placeholder="e.g., 15000"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-3 text-base"
                />
                <div className="text-sm text-gray-500 mb-3">
                  Or upload a file:
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-base"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Upload Image</span>
                  </button>
                  {selectedFile && (
                    <span className="text-base text-gray-600 truncate">{selectedFile.name}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Tags
                </label>
                <div className="flex flex-wrap gap-3">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-4 py-2 rounded-full text-base font-medium transition-colors ${
                        formData.tags.includes(tag)
                          ? tag === 'popular'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-orange-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {tag === 'popular' && <Star className="w-4 h-4 inline mr-1" />}
                      {tag}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Click "popular" to feature this item on the homepage
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleInputChange}
                  className="mr-3 w-5 h-5"
                />
                <label className="text-base font-medium text-gray-700">
                  Available for order
                </label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base"
                >
                  <Save className="w-5 h-5" />
                  <span>{uploading ? 'Saving...' : 'Save Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && sharingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Share Menu Item</h2>
                <button
                  onClick={closeShareModal}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Item Preview */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={sharingItem.image_url || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=100'}
                    alt={sharingItem.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{sharingItem.name}</h3>
                    <p className="text-gray-600 text-sm">{sharingItem.description}</p>
                    <p className="text-orange-600 font-bold">UGX {sharingItem.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Share Preview */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Share Preview</h3>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {generateShareContent(sharingItem).shareText}
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600 text-sm">{generateShareContent(sharingItem).shareUrl}</span>
                  </div>
                </div>
              </div>

              {/* Social Media Platforms */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Share on Social Media</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {socialPlatforms.map((platform) => (
                    <button
                      key={platform.name}
                      onClick={() => handleSocialShare(platform, sharingItem)}
                      className={`${platform.color} text-white p-4 rounded-lg transition-colors flex items-center space-x-3 hover:scale-105 transform transition-transform`}
                    >
                      <span className="text-2xl">{platform.icon}</span>
                      <span className="font-medium">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Copy Link */}
              <div className="border-t pt-6">
                <button
                  onClick={() => copyShareLink(sharingItem)}
                  className="w-full bg-gray-600 text-white p-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy Share Content</span>
                </button>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Copy the complete share content to paste anywhere
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MenuManagement