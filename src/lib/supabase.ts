import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface MenuItem {
  id: string
  name: string
  description: string
  image_url: string
  category: string
  price: number
  is_available: boolean
  tags: string[]
  created_at: string
}

export interface Order {
  id: string
  customer_name: string
  phone_number: string
  delivery_type: 'delivery' | 'pickup'
  delivery_address?: string
  order_status: 'received' | 'preparing' | 'out_for_delivery' | 'ready_for_pickup' | 'completed' | 'cancelled'
  total_amount: number
  payment_status: 'pending' | 'completed' | 'failed'
  user_id?: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  notes?: string
  price_at_time: number
  created_at: string
  menu_item?: MenuItem
}

export interface Reservation {
  id: string
  name: string
  phone_number: string
  reservation_time: string
  guests: number
  special_request?: string
  status: 'pending' | 'confirmed' | 'cancelled'
  user_id?: string
  created_at: string
}

export interface Message {
  id: string
  sender: 'admin' | 'customer'
  message: string
  file_url?: string
  created_at: string
  conversation_id?: string
}

export interface Conversation {
  id: string
  customer_identifier: string
  status: 'new' | 'pending' | 'resolved'
  last_message_at: string
  assigned_admin?: string
  user_id?: string
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  email: string
  password_hash: string
  created_at: string
}

// Cart item interface
export interface CartItem {
  menu_item: MenuItem
  quantity: number
  notes?: string
}

// User-related interfaces
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  date_of_birth?: string
  address?: string
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  expires_at: string
  created_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  favorite_items: string[]
  dietary_restrictions: string[]
  default_delivery_address?: string
  marketing_emails: boolean
  order_notifications: boolean
  created_at: string
  updated_at: string
}