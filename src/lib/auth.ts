import { supabase } from './supabase'

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

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone_number?: string
  date_of_birth?: string
  address?: string
}

export interface LoginData {
  email: string
  password: string
}

// Generate session token
const generateSessionToken = (): string => {
  return crypto.randomUUID() + '-' + Date.now().toString(36)
}

// Simple password hashing using Web Crypto API (browser-compatible)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Verify password using Web Crypto API
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// Register new user
export const registerUser = async (userData: RegisterData): Promise<{ user: User; session: UserSession }> => {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email.toLowerCase())
      .maybeSingle()

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password)

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: userData.email.toLowerCase(),
        password_hash: passwordHash,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        date_of_birth: userData.date_of_birth,
        address: userData.address
      })
      .select()
      .single()

    if (userError) throw userError

    // Create session
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Store session in localStorage
    localStorage.setItem('manziz_session_token', sessionToken)
    localStorage.setItem('manziz_user', JSON.stringify(user))

    return { user, session }
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

// Login user
export const loginUser = async (loginData: LoginData): Promise<{ user: User; session: UserSession }> => {
  try {
    // Get user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', loginData.email.toLowerCase())
      .maybeSingle()

    if (userError || !user) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await verifyPassword(loginData.password, user.password_hash)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    // Clean up expired sessions
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', user.id)
      .lt('expires_at', new Date().toISOString())

    // Create new session
    const sessionToken = generateSessionToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Store session in localStorage
    localStorage.setItem('manziz_session_token', sessionToken)
    localStorage.setItem('manziz_user', JSON.stringify(user))

    return { user, session }
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

// Get current user from session
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const sessionToken = localStorage.getItem('manziz_session_token')
    if (!sessionToken) return null

    // Verify session
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*, users(*)')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (sessionError || !session) {
      // Invalid or expired session
      localStorage.removeItem('manziz_session_token')
      localStorage.removeItem('manziz_user')
      return null
    }

    const user = session.users as User
    localStorage.setItem('manziz_user', JSON.stringify(user))
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// Logout user
export const logoutUser = async (): Promise<void> => {
  try {
    const sessionToken = localStorage.getItem('manziz_session_token')
    if (sessionToken) {
      // Delete session from database
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken)
    }

    // Clear localStorage
    localStorage.removeItem('manziz_session_token')
    localStorage.removeItem('manziz_user')
  } catch (error) {
    console.error('Logout error:', error)
    // Clear localStorage even if database operation fails
    localStorage.removeItem('manziz_session_token')
    localStorage.removeItem('manziz_user')
  }
}

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    // Update localStorage
    localStorage.setItem('manziz_user', JSON.stringify(user))
    return user
  } catch (error) {
    console.error('Update profile error:', error)
    throw error
  }
}

// Change password
export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
  try {
    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash)
    if (!isValidPassword) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', userId)

    if (updateError) throw updateError

    // Invalidate all sessions except current one
    const currentSessionToken = localStorage.getItem('manziz_session_token')
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .neq('session_token', currentSessionToken || '')
  } catch (error) {
    console.error('Change password error:', error)
    throw error
  }
}

// Get user preferences
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Get preferences error:', error)
      return null
    }

    return preferences
  } catch (error) {
    console.error('Get preferences error:', error)
    return null
  }
}

// Update user preferences
export const updateUserPreferences = async (userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> => {
  try {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return preferences
  } catch (error) {
    console.error('Update preferences error:', error)
    throw error
  }
}

// Add item to favorites
export const addToFavorites = async (userId: string, itemId: string): Promise<void> => {
  try {
    const preferences = await getUserPreferences(userId)
    if (!preferences) throw new Error('User preferences not found')

    const favoriteItems = [...preferences.favorite_items]
    if (!favoriteItems.includes(itemId)) {
      favoriteItems.push(itemId)
      await updateUserPreferences(userId, { favorite_items: favoriteItems })
    }
  } catch (error) {
    console.error('Add to favorites error:', error)
    throw error
  }
}

// Remove item from favorites
export const removeFromFavorites = async (userId: string, itemId: string): Promise<void> => {
  try {
    const preferences = await getUserPreferences(userId)
    if (!preferences) throw new Error('User preferences not found')

    const favoriteItems = preferences.favorite_items.filter(id => id !== itemId)
    await updateUserPreferences(userId, { favorite_items: favoriteItems })
  } catch (error) {
    console.error('Remove from favorites error:', error)
    throw error
  }
}

// Check if user is logged in
export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem('manziz_session_token')
}

// Get stored user data
export const getStoredUser = (): User | null => {
  try {
    const userData = localStorage.getItem('manziz_user')
    return userData ? JSON.parse(userData) : null
  } catch (error) {
    console.error('Get stored user error:', error)
    return null
  }
}