import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if admin is already logged in
    const adminSession = localStorage.getItem('manziz_admin_session')
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession)
        if (session.expires > Date.now()) {
          navigate('/admin')
        } else {
          localStorage.removeItem('manziz_admin_session')
        }
      } catch (error) {
        localStorage.removeItem('manziz_admin_session')
      }
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Attempting login with username:', formData.username)

      // First, try demo credentials
      if (formData.username === 'Admin' && formData.password === 'Manziz123') {
        console.log('Demo credentials matched')
        
        // Create admin session
        const session = {
          adminId: 'demo-admin-id',
          email: formData.username,
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }

        localStorage.setItem('manziz_admin_session', JSON.stringify(session))
        toast.success('Login successful!')
        navigate('/admin')
        return
      }

      // Try database authentication
      console.log('Checking database for admin user...')
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', formData.username)
        .single()

      if (error || !admin) {
        console.log('Admin not found in database')
        toast.error('Invalid username or password')
        setIsLoading(false)
        return
      }

      console.log('Admin found in database, verifying password...')

      // For now, we'll use a simple password check
      // In production, you should use proper password hashing
      if (formData.password === 'Manziz123') {
        console.log('Password verified successfully')
        
        // Create admin session
        const session = {
          adminId: admin.id,
          email: admin.email,
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }

        localStorage.setItem('manziz_admin_session', JSON.stringify(session))
        toast.success('Login successful!')
        navigate('/admin')
        return
      }

      // If we get here, password is incorrect
      toast.error('Invalid username or password')

    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-yellow-100">
            Access the Manziz Restaurant admin dashboard
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              <strong>Available Credentials:</strong><br />
              <br />
              <strong>Demo Admin:</strong><br />
              Username: Admin<br />
              Password: Manziz123<br />
              <br />
              <strong>Database Admin:</strong><br />
              Username: admin@manziz.com<br />
              Password: Manziz123
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-yellow-100 hover:text-white transition-colors"
          >
            ← Back to Website
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin