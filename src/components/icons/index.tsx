import React, { lazy, Suspense } from 'react'

// Lazy load icons
const CheckCircle = lazy(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })))
const Clock = lazy(() => import('lucide-react').then(mod => ({ default: mod.Clock })))
const Truck = lazy(() => import('lucide-react').then(mod => ({ default: mod.Truck })))
const Package = lazy(() => import('lucide-react').then(mod => ({ default: mod.Package })))
const Search = lazy(() => import('lucide-react').then(mod => ({ default: mod.Search })))
const MessageCircle = lazy(() => import('lucide-react').then(mod => ({ default: mod.MessageCircle })))
const RefreshCw = lazy(() => import('lucide-react').then(mod => ({ default: mod.RefreshCw })))
const RotateCcw = lazy(() => import('lucide-react').then(mod => ({ default: mod.RotateCcw })))
const ShoppingCart = lazy(() => import('lucide-react').then(mod => ({ default: mod.ShoppingCart })))

// Icon loading fallback component
const IconFallback = () => (
  <div className="w-4 h-4 bg-gray-200 animate-pulse rounded-full" />
)

// Wrapper component for lazy-loaded icons
export const Icon = ({ name, ...props }: { name: string; [key: string]: any }) => {
  const icons: { [key: string]: React.ComponentType<any> } = {
    CheckCircle,
    Clock,
    Truck,
    Package,
    Search,
    MessageCircle,
    RefreshCw,
    RotateCcw,
    ShoppingCart,
  }

  const IconComponent = icons[name]

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <Suspense fallback={<IconFallback />}>
      <IconComponent {...props} />
    </Suspense>
  )
}

export default Icon 