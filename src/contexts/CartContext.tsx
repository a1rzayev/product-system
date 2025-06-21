'use client'

/**
 * CartContext - User-specific shopping cart management
 * 
 * This context provides a shopping cart that is specific to each user:
 * - Authenticated users: Cart is stored with key 'cart_{userId}'
 * - Guest users: Cart is stored with key 'cart_guest'
 * - When a guest user logs in, their cart items are merged with their existing user cart
 * - Cart is automatically cleared when switching between users
 * - Cart persists across browser sessions via localStorage
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  sku: string
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.productId === action.payload.productId)
      
      if (existingItem) {
        // Update quantity if item already exists
        const updatedItems = state.items.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
        
        const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        
        return { ...state, items: updatedItems, total, itemCount }
      } else {
        // Add new item
        const newItems = [...state.items, action.payload]
        const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)
        
        return { ...state, items: newItems, total, itemCount }
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload)
      const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return { ...state, items: updatedItems, total, itemCount }
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(1, action.payload.quantity) }
          : item
      )
      const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return { ...state, items: updatedItems, total, itemCount }
    }
    
    case 'CLEAR_CART':
      return { ...state, items: [], total: 0, itemCount: 0 }
    
    case 'LOAD_CART': {
      const total = action.payload.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const itemCount = action.payload.reduce((sum, item) => sum + item.quantity, 0)
      
      return { ...state, items: action.payload, total, itemCount }
    }
    
    default:
      return state
  }
}

interface CartContextType {
  state: CartState
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const { data: session, status } = useSession()

  // Get cart key based on user session
  const getCartKey = () => {
    if (session?.user?.id) {
      return `cart_${session.user.id}`
    }
    return 'cart_guest' // For non-authenticated users
  }

  // Load cart from localStorage on mount or when session changes
  useEffect(() => {
    if (status === 'loading') return // Wait for session to load
    
    const cartKey = getCartKey()
    const savedCart = localStorage.getItem(cartKey)
    
    if (session?.user?.id) {
      // User is logged in - check for guest cart to merge
      const guestCart = localStorage.getItem('cart_guest')
      let itemsToLoad: CartItem[] = []
      
      if (savedCart) {
        try {
          itemsToLoad = JSON.parse(savedCart)
        } catch (error) {
          console.error('Error loading user cart from localStorage:', error)
        }
      }
      
      // If there's a guest cart, merge it with user cart
      if (guestCart) {
        try {
          const guestItems = JSON.parse(guestCart)
          // Merge guest items with user items, combining quantities for same products
          const mergedItems = [...itemsToLoad]
          
          guestItems.forEach((guestItem: CartItem) => {
            const existingItem = mergedItems.find(item => item.productId === guestItem.productId)
            if (existingItem) {
              existingItem.quantity += guestItem.quantity
            } else {
              mergedItems.push(guestItem)
            }
          })
          
          itemsToLoad = mergedItems
          // Clear guest cart after merging
          localStorage.removeItem('cart_guest')
        } catch (error) {
          console.error('Error merging guest cart:', error)
        }
      }
      
      if (itemsToLoad.length > 0) {
        dispatch({ type: 'LOAD_CART', payload: itemsToLoad })
      } else {
        dispatch({ type: 'CLEAR_CART' })
      }
    } else {
      // Guest user or not authenticated
      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart)
          dispatch({ type: 'LOAD_CART', payload: cartItems })
        } catch (error) {
          console.error('Error loading guest cart from localStorage:', error)
        }
      } else {
        dispatch({ type: 'CLEAR_CART' })
      }
    }
  }, [session?.user?.id, status])

  // Clear cart when user logs out
  useEffect(() => {
    if (status === 'unauthenticated') {
      dispatch({ type: 'CLEAR_CART' })
    }
  }, [status])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (status === 'loading') return // Wait for session to load
    
    const cartKey = getCartKey()
    localStorage.setItem(cartKey, JSON.stringify(state.items))
  }, [state.items, session?.user?.id, status])

  const addItem = (item: Omit<CartItem, 'id'>) => {
    const cartItem: CartItem = {
      ...item,
      id: `${item.productId}-${Date.now()}` // Generate unique ID
    }
    dispatch({ type: 'ADD_ITEM', payload: cartItem })
  }

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
  }

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
} 