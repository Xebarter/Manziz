import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ShoppingCart, Phone, User, MessageCircle, LogOut, Settings, Heart } from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [showCartAnimation, setShowCartAnimation] = useState(false)
  const { getTotalItems } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const menuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Menu', href: '/menu' },
    { name: 'Reservations', href: '/reservations' },
    { name: 'My Orders', href: '/my-orders' },
    { name: 'Contact', href: '/contact' },
  ]

  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    const updateCartCount = () => {
      const count = getTotalItems()
      setCartItemCount(count)
    }
    updateCartCount()

    const handleCartUpdate = (event: CustomEvent) => {
      const newCount = event.detail.totalItems
      const oldCount = cartItemCount
      setCartItemCount(newCount)
      if (newCount > oldCount) {
        setShowCartAnimation(true)
        setTimeout(() => setShowCartAnimation(false), 1000)
      }
    }

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener)
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === 'manziz_cart') updateCartCount()
    })

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener)
      window.removeEventListener('storage', () => { })
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false)
    }
    if (isMenuOpen || isUserMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen, isUserMenuOpen])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    setIsUserMenuOpen(false)
  }

  const getUserInitials = () => {
    if (!user) return 'U'
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
  }

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-lg sm:text-2xl font-bold text-gray-900">Manziz</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6 xl:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.href)
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <a
              href="https://wa.me/256784811208"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-700 hover:text-green-600 transition-colors"
              title="WhatsApp"
            >
              <Phone className="w-5 h-5" />
            </a>
            <Link
              to="/chat"
              className="p-2 text-gray-700 hover:text-orange-600 transition-colors"
              title="Live Chat"
            >
              <MessageCircle className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors">
              <ShoppingCart className={`w-5 h-5 ${showCartAnimation ? 'scale-110' : ''}`} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1 text-gray-700 hover:text-orange-600"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{getUserInitials()}</span>
                  </div>
                  <span className="hidden sm:block text-sm">{user.first_name}</span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <Link to="/profile" className="flex items-center px-4 py-2 hover:bg-gray-100">
                      <Settings className="w-4 h-4 mr-2" /> Profile Settings
                    </Link>
                    <Link to="/profile?tab=favorites" className="flex items-center px-4 py-2 hover:bg-gray-100">
                      <Heart className="w-4 h-4 mr-2" /> Favorites
                    </Link>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 hover:bg-gray-100">
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:block">Sign In</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-orange-600 z-50"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="lg:hidden absolute top-16 left-0 right-0 bg-white shadow-lg border-t z-40 animate-slide-down"
          >
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-3 rounded-md text-base font-medium ${isActive(item.href)
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-30 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  )
}

export default Header
