import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { addToFavorites, removeFromFavorites, getUserPreferences } from '../lib/auth'
import { MenuItem } from '../lib/supabase'
import toast from 'react-hot-toast'

interface FavoriteButtonProps {
  item: MenuItem
  className?: string
  showLoginPrompt?: boolean
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  item, 
  className = '', 
  showLoginPrompt = true 
}) => {
  const { user, isAuthenticated } = useAuth()
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkFavoriteStatus()
  }, [user, item.id])

  const checkFavoriteStatus = async () => {
    if (!isAuthenticated || !user) {
      setIsFavorite(false)
      return
    }

    try {
      const preferences = await getUserPreferences(user.id)
      setIsFavorite(preferences?.favorite_items.includes(item.id) || false)
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated || !user) {
      if (showLoginPrompt) {
        toast.error('Please sign in to save favorites')
        // Optionally redirect to login
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      }
      return
    }

    setIsLoading(true)

    try {
      if (isFavorite) {
        await removeFromFavorites(user.id, item.id)
        setIsFavorite(false)
        toast.success('Removed from favorites')
      } else {
        await addToFavorites(user.id, item.id)
        setIsFavorite(true)
        toast.success('Added to favorites')
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error)
      toast.error(error.message || 'Failed to update favorites')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`p-2 rounded-full transition-all duration-200 ${
        isFavorite 
          ? 'bg-red-500 text-white hover:bg-red-600' 
          : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={
        !isAuthenticated 
          ? 'Sign in to save favorites' 
          : isFavorite 
            ? 'Remove from favorites' 
            : 'Add to favorites'
      }
    >
      <Heart 
        className={`w-5 h-5 transition-transform duration-200 ${
          isLoading ? 'animate-pulse' : ''
        } ${isFavorite ? 'fill-current' : ''}`} 
      />
    </button>
  )
}

export default FavoriteButton