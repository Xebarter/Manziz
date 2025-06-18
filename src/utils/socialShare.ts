// Social media sharing utilities with optimized thumbnails

export interface ShareableItem {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  category: string
}

export interface ShareContent {
  title: string
  description: string
  url: string
  imageUrl: string
  hashtags: string[]
}

// Generate optimized image URL for social sharing
export const getOptimizedShareImage = (imageUrl: string, platform: 'facebook' | 'twitter' | 'whatsapp' | 'general' = 'general'): string => {
  if (!imageUrl) {
    return 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop'
  }

  // Platform-specific image optimization
  const platformSizes = {
    facebook: 'w=1200&h=630', // 1.91:1 ratio
    twitter: 'w=1200&h=675',  // 16:9 ratio  
    whatsapp: 'w=400&h=400',  // Square for WhatsApp
    general: 'w=1200&h=630'   // Default Open Graph size
  }

  // If it's a Pexels URL, optimize it
  if (imageUrl.includes('pexels.com')) {
    const baseUrl = imageUrl.split('?')[0]
    return `${baseUrl}?auto=compress&cs=tinysrgb&${platformSizes[platform]}&fit=crop`
  }

  return imageUrl
}

// Generate share content for a menu item
export const generateShareContent = (item: ShareableItem, platform?: string): ShareContent => {
  const baseUrl = window.location.origin
  const shareUrl = `${baseUrl}/menu?item=${item.id}`
  
  // Generate relevant hashtags
  const hashtags = [
    'ManzizRestaurant',
    'FoodDelivery',
    'KampalaFood',
    'UgandanFood',
    'FreshFood',
    item.category.charAt(0).toUpperCase() + item.category.slice(1),
    'OrderNow'
  ]

  const title = `${item.name} - Manziz Restaurant`
  const description = `🍽️ ${item.description}\n\nOnly UGX ${item.price.toLocaleString()} - Order now for delivery or pickup!\n\n#${hashtags.join(' #')}`

  return {
    title,
    description,
    url: shareUrl,
    imageUrl: getOptimizedShareImage(item.image_url || '', platform as any),
    hashtags
  }
}

// Update page meta tags dynamically for shared items
export const updatePageMetaTags = (item: ShareableItem) => {
  const shareContent = generateShareContent(item)
  
  // Update title
  document.title = shareContent.title
  
  // Update meta tags
  const metaTags = [
    { property: 'og:title', content: shareContent.title },
    { property: 'og:description', content: item.description },
    { property: 'og:image', content: shareContent.imageUrl },
    { property: 'og:url', content: shareContent.url },
    { name: 'twitter:title', content: shareContent.title },
    { name: 'twitter:description', content: item.description },
    { name: 'twitter:image', content: shareContent.imageUrl },
    { name: 'description', content: item.description }
  ]

  metaTags.forEach(({ property, name, content }) => {
    const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`
    let meta = document.querySelector(selector) as HTMLMetaElement
    
    if (!meta) {
      meta = document.createElement('meta')
      if (property) meta.setAttribute('property', property)
      if (name) meta.setAttribute('name', name)
      document.head.appendChild(meta)
    }
    
    meta.setAttribute('content', content)
  })

  // Add structured data for the specific item
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    "name": item.name,
    "description": item.description,
    "image": shareContent.imageUrl,
    "offers": {
      "@type": "Offer",
      "price": item.price,
      "priceCurrency": "UGX"
    },
    "menuAddOn": {
      "@type": "MenuSection",
      "name": item.category
    }
  }

  // Remove existing structured data for menu items
  const existingScript = document.querySelector('script[data-menu-item]')
  if (existingScript) {
    existingScript.remove()
  }

  // Add new structured data
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.setAttribute('data-menu-item', 'true')
  script.textContent = JSON.stringify(structuredData)
  document.head.appendChild(script)
}

// Social media platform configurations
export const socialPlatforms = [
  {
    name: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600 hover:bg-blue-700',
    shareUrl: (content: ShareContent) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}&quote=${encodeURIComponent(content.description)}`,
    supportsDirectShare: true
  },
  {
    name: 'Twitter/X',
    icon: '🐦', 
    color: 'bg-black hover:bg-gray-800',
    shareUrl: (content: ShareContent) => 
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(content.description)}&url=${encodeURIComponent(content.url)}&hashtags=${content.hashtags.join(',')}`,
    supportsDirectShare: true
  },
  {
    name: 'WhatsApp',
    icon: '💬',
    color: 'bg-green-600 hover:bg-green-700', 
    shareUrl: (content: ShareContent) => 
      `https://wa.me/?text=${encodeURIComponent(`${content.description}\n\n${content.url}`)}`,
    supportsDirectShare: true
  },
  {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700 hover:bg-blue-800',
    shareUrl: (content: ShareContent) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(content.url)}&title=${encodeURIComponent(content.title)}&summary=${encodeURIComponent(content.description)}`,
    supportsDirectShare: true
  },
  {
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    shareUrl: () => '',
    supportsDirectShare: false,
    instructions: 'Copy the content and image, then paste in Instagram'
  },
  {
    name: 'TikTok', 
    icon: '🎵',
    color: 'bg-black hover:bg-gray-800',
    shareUrl: () => '',
    supportsDirectShare: false,
    instructions: 'Copy the content and create a video on TikTok'
  }
]

// Handle social media sharing
export const handleSocialShare = async (platform: typeof socialPlatforms[0], item: ShareableItem): Promise<void> => {
  const content = generateShareContent(item, platform.name.toLowerCase())
  
  if (platform.supportsDirectShare) {
    const url = platform.shareUrl(content)
    window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
    return Promise.resolve()
  } else {
    // For platforms that don't support direct sharing, copy to clipboard
    const fullContent = `${content.description}\n\n${content.url}\n\nImage: ${content.imageUrl}`
    
    try {
      await navigator.clipboard.writeText(fullContent)
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(new Error('Failed to copy to clipboard'))
    }
  }
}

// Copy share link with full content
export const copyShareContent = async (item: ShareableItem): Promise<void> => {
  const content = generateShareContent(item)
  const fullContent = `${content.description}\n\n${content.url}\n\nImage: ${content.imageUrl}`
  
  try {
    await navigator.clipboard.writeText(fullContent)
    return Promise.resolve()
  } catch (error) {
    return Promise.reject(new Error('Failed to copy to clipboard'))
  }
}

// Web Share API fallback
export const nativeShare = async (item: ShareableItem): Promise<void> => {
  if (!navigator.share) {
    throw new Error('Web Share API not supported')
  }

  const content = generateShareContent(item)
  
  try {
    await navigator.share({
      title: content.title,
      text: content.description,
      url: content.url
    })
    return Promise.resolve()
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled the share
      return Promise.resolve()
    }
    return Promise.reject(error)
  }
}