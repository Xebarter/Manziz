import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { authService } from '../lib/auth';
import { useAdminAuthStore } from '../lib/store';
import toast from 'react-hot-toast';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { adminLogin } = useAdminAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const admin = await authService.signInAdmin(email, password);
      adminLogin(admin.email);
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Admin login error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Invalid admin credentials';
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email or password is incorrect';
        } else if (error.message.includes('not authorized as admin')) {
          errorMessage = 'This account is not authorized as an admin';
        } else if (error.message.includes('ID mismatch')) {
          errorMessage = 'Account verification failed';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-orange via-brand-red to-red-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-orange to-brand-red p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-brand-orange" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-orange-100">Secure access to restaurant management</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-all"
                  placeholder="admin@manziz.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-orange to-brand-red text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Access Admin Panel'
              )}
            </button>
          </form>

          {/* Back to main site */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link
              to="/"
              className="flex items-center justify-center space-x-2 text-gray-600 hover:text-brand-orange transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Main Site</span>
            </Link>
          </div>

          {/* Setup instructions */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Setup Instructions:</h4>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Create user in Supabase Auth (Authentication → Users)</li>
              <li>Copy the user's UUID from the auth.users table</li>
              <li>Add record to admins table with same ID and email</li>
              <li>Use those credentials to login here</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;