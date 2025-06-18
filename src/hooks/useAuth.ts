import { useState, useEffect } from 'react'
import { User, getCurrentUser, loginUser, registerUser, logoutUser, LoginData, RegisterData } from '../lib/auth'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setIsAuthenticated(!!currentUser)
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (loginData: LoginData): Promise<boolean> => {
    try {
      const { user: loggedInUser } = await loginUser(loginData)
      setUser(loggedInUser)
      setIsAuthenticated(true)
      toast.success('Logged in successfully!')
      return true
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed')
      return false
    }
  }

  const register = async (registerData: RegisterData): Promise<boolean> => {
    try {
      const { user: newUser } = await registerUser(registerData)
      setUser(newUser)
      setIsAuthenticated(true)
      toast.success('Account created successfully!')
      return true
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed')
      return false
    }
  }

  const logout = async () => {
    try {
      await logoutUser()
      setUser(null)
      setIsAuthenticated(false)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setIsAuthenticated(!!currentUser)
    } catch (error) {
      console.error('Refresh user error:', error)
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    checkAuthStatus
  }
}