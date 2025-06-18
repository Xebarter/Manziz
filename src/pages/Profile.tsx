import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Calendar, Lock, Heart, Settings, Save, Edit, ShoppingCart, RotateCcw } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { updateUserProfile, changePassword, getUserPreferences, updateUserPreferences, UserPreferences } from '../lib/auth'
import { MenuItem } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { useCart } from '../hooks/useCart'
import toast from 'react-hot-toast'

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth()
  const { addToCart } = useCart()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [favoriteItems, setFavoriteItems] = useState<MenuItem[]>([])

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    address: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [preferencesData, setPreferencesData] = useState({
    dietary_restrictions: [] as string[],
    default_delivery_address: '',
    marketing_emails: true,
    order_notifications: true
  })

  useEffect(() => {
    // Check URL for tab parameter
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab && ['profile', 'preferences', 'favorites', 'security'].includes(tab)) {
      setActiveTab(tab)
    }

    if (user) {
      setProfileData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        address: user.address || ''
      })
      loadUserPreferences()
    }
  }, [user])

  const loadUserPreferences = async () => {
    if (!user) return

    try {
      const userPrefs = await getUserPreferences(user.id)
      if (userPrefs) {
        setPreferences(userPrefs)
        setPreferencesData({
          dietary_restrictions: userPrefs.dietary_restrictions,
          default_delivery_address: userPrefs.default_delivery_address || '',
          marketing_emails: userPrefs.marketing_emails,
          order_notifications: userPrefs.order_notifications
        })

        // Load favorite items
        if (userPrefs.favorite_items.length > 0) {
          const { data: items } = await supabase
            .from('menu_items')
            .select('*')
            .in('id', userPrefs.favorite_items)

          setFavoriteItems(items || [])
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      await updateUserProfile(user.id, profileData)
      await refreshUser()
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)
    try {
      await changePassword(user.id, passwordData.currentPassword, passwordData.newPassword)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password changed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferencesUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      await updateUserPreferences(user.id, preferencesData)
      await loadUserPreferences()
      toast.success('Preferences updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDietaryRestriction = (restriction: string) => {
    setPreferencesData(prev => ({
      ...prev,
      dietary_restrictions: prev.dietary_restrictions.includes(restriction)
        ? prev.dietary_restrictions.filter(r => r !== restriction)
        : [...prev.dietary_restrictions, restriction]
    }))
  }

  const addFavoriteToCart = (item: MenuItem) => {
    addToCart({
      menu_item: item,
      quantity: 1,
      notes: ''
    })
    toast.success(`${item.name} added to cart!`)
  }

  const removeFavorite = async (itemId: string) => {
    if (!user || !preferences) return

    try {
      const updatedFavorites = preferences.favorite_items.filter(id => id !== itemId)
      await updateUserPreferences(user.id, { favorite_items: updatedFavorites })
      await loadUserPreferences()
      toast.success('Removed from favorites')
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove from favorites')
    }
  }

  const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher']

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'security', label: 'Security', icon: Lock }
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h2>
          <a href="/login" className="text-orange-600 hover:text-orange-700">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-3" />
                    {tab.label}
                    {tab.id === 'favorites' && favoriteItems.length > 0 && (
                      <span className="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                        {favoriteItems.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center space-x-2 px-4 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                    </button>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileData.first_name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileData.last_name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone_number}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={profileData.date_of_birth}
                          onChange={(e) => setProfileData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>

                    {isEditing && (
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex items-center space-x-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Preferences</h2>

                  <form onSubmit={handlePreferencesUpdate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Dietary Restrictions
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {dietaryOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleDietaryRestriction(option)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              preferencesData.dietary_restrictions.includes(option)
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Delivery Address
                      </label>
                      <textarea
                        value={preferencesData.default_delivery_address}
                        onChange={(e) => setPreferencesData(prev => ({ ...prev, default_delivery_address: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter your default delivery address"
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="marketing_emails"
                          checked={preferencesData.marketing_emails}
                          onChange={(e) => setPreferencesData(prev => ({ ...prev, marketing_emails: e.target.checked }))}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor="marketing_emails" className="ml-2 block text-sm text-gray-900">
                          Receive marketing emails and promotions
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="order_notifications"
                          checked={preferencesData.order_notifications}
                          onChange={(e) => setPreferencesData(prev => ({ ...prev, order_notifications: e.target.checked }))}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor="order_notifications" className="ml-2 block text-sm text-gray-900">
                          Receive order status notifications
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? 'Saving...' : 'Save Preferences'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Favorites Tab */}
              {activeTab === 'favorites' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Favorite Items</h2>

                  {favoriteItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                      <p className="text-gray-600 mb-4">
                        Start adding items to your favorites from the menu
                      </p>
                      <a
                        href="/menu"
                        className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Browse Menu
                      </a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {favoriteItems.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-4">
                            <img
                              src={item.image_url || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=100'}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                              <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                              <p className="text-orange-600 font-bold mt-1">UGX {item.price.toLocaleString()}</p>
                              
                              <div className="flex items-center space-x-2 mt-3">
                                <button
                                  onClick={() => addFavoriteToCart(item)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                  <span>Add to Cart</span>
                                </button>
                                <button
                                  onClick={() => removeFavorite(item.id)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                                >
                                  <Heart className="w-3 h-3" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                      >
                        <Lock className="w-4 h-4" />
                        <span>{isLoading ? 'Changing...' : 'Change Password'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile