import { useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { updateAllMetaTags } from '../utils/metaTags'

interface MetaTagOptions {
  title?: string
  description?: string
  image?: string
  imageAlt?: string
  useFirstMenuItem?: boolean
}

export const useMetaTags = (options: MetaTagOptions = {}) => {
  const fetchFeaturedMenuItem = useCallback(async () => {
    try {
      // First try to get a popular/featured menu item
      let { data: menuItems, error } = await supabase
        .from('menu_items')
        .select('name, description, image_url, price')
        .contains('tags', ['popular'])
        .eq('is_available', true)
        .order('created_at', { ascending: true })
        .limit(1)

      if (error) {
        console.error('Error fetching featured menu items:', error)
        // Fallback to any available menu item
        const fallbackResult = await supabase
          .from('menu_items')
          .select('name, description, image_url, price')
          .eq('is_available', true)
          .order('created_at', { ascending: true })
          .limit(1)
        
        if (fallbackResult.error) {
          console.error('Error fetching fallback menu items:', fallbackResult.error)
          return null
        }
        
        menuItems = fallbackResult.data
      }

      return menuItems && menuItems.length > 0 ? menuItems[0] : null
    } catch (error) {
      console.error('Error fetching featured menu item:', error)
      return null
    }
  }, [])

  useEffect(() => {
    const updateMetaTags = async () => {
      let menuItem = null

      // If useFirstMenuItem is true, fetch the featured menu item
      if (options.useFirstMenuItem) {
        menuItem = await fetchFeaturedMenuItem()
      }

      // Update all meta tags using the utility function
      updateAllMetaTags({
        title: options.title,
        description: options.description,
        image: options.image,
        imageAlt: options.imageAlt,
        menuItem
      })

      if (menuItem) {
        console.log('Meta tags updated with featured menu item:', menuItem.name)
      }
    }

    // Add a small delay to ensure the app is fully loaded
    const timer = setTimeout(updateMetaTags, 100)
    
    return () => clearTimeout(timer)
  }, [options, fetchFeaturedMenuItem])

  return {
    fetchFeaturedMenuItem
  }
} 