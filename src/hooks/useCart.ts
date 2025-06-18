import { useState, useEffect } from 'react'
import { CartItem } from '../lib/supabase'

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    const savedCart = localStorage.getItem('manziz_cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        setCart(parsedCart)
        // Trigger initial cart update event
        dispatchCartUpdate(parsedCart)
      } catch (error) {
        console.error('Error parsing saved cart:', error)
        localStorage.removeItem('manziz_cart')
      }
    }
  }, [])

  const dispatchCartUpdate = (newCart: CartItem[]) => {
    const totalItems = newCart.reduce((total, item) => total + item.quantity, 0)
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('cartUpdated', { 
      detail: { 
        totalItems,
        cart: newCart,
        timestamp: Date.now()
      } 
    }))
  }

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem('manziz_cart', JSON.stringify(newCart))
    
    // Trigger cart update event for real-time badge updates
    dispatchCartUpdate(newCart)
  }

  const addToCart = (item: CartItem) => {
    const existingIndex = cart.findIndex(
      cartItem => cartItem.menu_item.id === item.menu_item.id
    )

    if (existingIndex >= 0) {
      const newCart = [...cart]
      newCart[existingIndex].quantity += item.quantity
      saveCart(newCart)
    } else {
      saveCart([...cart, item])
    }
  }

  const removeFromCart = (menuItemId: string) => {
    const newCart = cart.filter(item => item.menu_item.id !== menuItemId)
    saveCart(newCart)
  }

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId)
      return
    }

    const newCart = cart.map(item =>
      item.menu_item.id === menuItemId
        ? { ...item, quantity }
        : item
    )
    saveCart(newCart)
  }

  const clearCart = () => {
    saveCart([])
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.menu_item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalAmount,
    getTotalItems
  }
}