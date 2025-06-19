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
  const fetchFirstMenuItem = useCallback(async () => {
    try {
      const { data: menuItems, error } = await supabase
        .from('menu_items')
        .select('name, description, image_url')
        .eq('is_available', true)
        .order('created_at', { ascending: true })
        .limit(1)

      if (error) {
        console.error('Error fetching menu items for meta tags:', error)
        return null
      }

      return menuItems && menuItems.length > 0 ? menuItems[0] : null
    } catch (error) {
      console.error('Error fetching first menu item:', error)
      return null
    }
  }, [])

  useEffect(() => {
    const updateMetaTags = async () => {
      let menuItem = null

      // If useFirstMenuItem is true, fetch the first menu item
      if (options.useFirstMenuItem) {
        menuItem = await fetchFirstMenuItem()
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
        console.log('Meta tags updated with menu item:', menuItem.name)
      }
    }

    // Add a small delay to ensure the app is fully loaded
    const timer = setTimeout(updateMetaTags, 100)
    
    return () => clearTimeout(timer)
  }, [options, fetchFirstMenuItem])

  return {
    fetchFirstMenuItem
  }
} 