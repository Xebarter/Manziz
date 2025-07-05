// Utility functions for managing meta tags

export const updateMetaTag = (property: string, content: string) => {
  if (!content) return
  
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('property', property)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

export const updateTitle = (title: string) => {
  document.title = title
}

export const updateStructuredData = (data: any) => {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]')
  if (existingScript) {
    existingScript.remove()
  }

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

export const createRestaurantStructuredData = (menuItem?: any) => {
  const baseData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Manziz Restaurant",
    "description": "A fast-food brand dedicated to bringing smiles through delightful tastes and aromas",
    "url": "https://manziz-restaurant.vercel.app",
    "logo": "https://manziz-restaurant.vercel.app/logo.png",
    "image": menuItem?.image_url || "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "telephone": "+256784811208",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Kampala Central",
      "addressLocality": "Kampala",
      "addressCountry": "Uganda"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "0.3188734640272452",
      "longitude": "32.616301837560144"
    },
    "openingHours": [
      "Mo-Th 09:00-22:00",
      "Fr-Sa 09:00-23:00", 
      "Su 10:00-21:00"
    ],
    "servesCuisine": ["Fast Food", "Ugandan", "International"],
    "priceRange": "$$",
    "acceptsReservations": true,
    "hasMenu": "https://manziz-restaurant.vercel.app/menu"
  }

  // If a specific menu item is provided, add detailed menu information
  if (menuItem) {
    return {
      ...baseData,
      "image": menuItem.image_url,
      "menu": {
        "@type": "Menu",
        "hasMenuSection": [
          {
            "@type": "MenuSection",
            "name": "Featured Item",
            "hasMenuItem": [
              {
                "@type": "MenuItem",
                "name": menuItem.name,
                "description": menuItem.description || `Delicious ${menuItem.name} from Manziz Restaurant`,
                "image": menuItem.image_url,
                "offers": {
                  "@type": "Offer",
                  "price": menuItem.price,
                  "priceCurrency": "UGX",
                  "availability": "https://schema.org/InStock"
                },
                "nutrition": {
                  "@type": "NutritionInformation",
                  "servingSize": "1 serving"
                }
              }
            ]
          }
        ]
      }
    }
  }

  return baseData
}

export const updateAllMetaTags = (options: {
  title?: string
  description?: string
  image?: string
  imageAlt?: string
  menuItem?: any
}) => {
  const { title, description, image, imageAlt, menuItem } = options

  // Update title
  if (title) {
    updateTitle(title)
  }

  // Optimize image URL for social media (1200x630 is optimal for Facebook/Twitter)
  const getOptimizedImageUrl = (imageUrl: string) => {
    if (!imageUrl) return null
    
    // If it's a Pexels URL, optimize it for social media
    if (imageUrl.includes('pexels.com')) {
      const baseUrl = imageUrl.split('?')[0]
      return `${baseUrl}?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop`
    }
    
    return imageUrl
  }

  // Update Open Graph meta tags
  if (image || menuItem?.image_url) {
    const imageUrl = getOptimizedImageUrl(image || menuItem?.image_url)
    if (imageUrl) {
      updateMetaTag('og:image', imageUrl)
      updateMetaTag('og:image:width', '1200')
      updateMetaTag('og:image:height', '630')
      updateMetaTag('og:image:alt', imageAlt || `Delicious ${menuItem?.name || 'food'} from Manziz Restaurant`)
      updateMetaTag('og:image:type', 'image/jpeg')
    }
  }

  if (title || menuItem?.name) {
    const ogTitle = title || `Manziz Restaurant - ${menuItem?.name}`
    updateMetaTag('og:title', ogTitle)
    updateMetaTag('twitter:title', ogTitle)
  }

  if (description || menuItem?.description) {
    const ogDescription = description || menuItem?.description || `Try our delicious ${menuItem?.name} at Manziz Restaurant`
    updateMetaTag('og:description', ogDescription)
    updateMetaTag('twitter:description', ogDescription)
  }

  // Update Twitter meta tags
  if (image || menuItem?.image_url) {
    const imageUrl = getOptimizedImageUrl(image || menuItem?.image_url)
    if (imageUrl) {
      updateMetaTag('twitter:image', imageUrl)
      updateMetaTag('twitter:image:alt', imageAlt || `Delicious ${menuItem?.name || 'food'} from Manziz Restaurant`)
    }
  }

  // Update structured data
  const structuredData = createRestaurantStructuredData(menuItem)
  updateStructuredData(structuredData)
} 