import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, profile } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await login(email, password);
      
      // Redirect based on role
      const userProfile = useAuthStore.getState().profile;
      
      if (userProfile?.role === 'admin' || userProfile?.role === 'super_admin') {
        navigate('/admin', { replace: true });
      } else if (userProfile?.role === 'cashier') {
        navigate('/cashier', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
      
      toast.success('Login berhasil! Selamat datang.');
    } catch (error) {
      console.error('Login error:', error);
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email atau password salah'
          : 'Gagal login. Silakan coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/20" />
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, 0],
            }}
            transition={{ repeat: Infinity, duration: 20 }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-primary-400/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [0, -5, 0],
            }}
            transition={{ repeat: Infinity, duration: 15 }}
            className="absolute -bottom-20 -left-20 w-96 h-96 bg-cream-400/20 rounded-full blur-3xl"
          />
        </div>
        
        <div className="relative flex flex-col justify-center px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Coffee size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white font-display">
                  Waroeng RCM
                </h1>
                <p className="text-white/70 text-lg">Kang Abuy</p>
              </div>
            </div>
            
            <h2 className="text-5xl font-bold text-white font-display leading-tight mb-6">
              Restaurant Management System
            </h2>
            
            <p className="text-xl text-white/70 leading-relaxed mb-8">
              Kelola pesanan, pantau meja, dan optimalkan operasional restoran Anda dalam satu dashboard.
            </p>
            
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>System Online & Realtime</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-cream-50">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Coffee size={32} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-warm-900 font-display">
              Waroeng RCM Kang Abuy
            </h1>
            <p className="text-warm-500 text-sm mt-1">Restaurant Management System</p>
          </div>

          <div className="bg-white rounded-2xl shadow-elevated p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-warm-900 font-display">
                Welcome Back
              </h2>
              <p className="text-warm-500 mt-1">
                Silakan login untuk melanjutkan
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6"
              >
                <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-warm-50 border border-warm-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    placeholder="admin@waroengrcm.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-warm-50 border border-warm-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-warm-100 rounded-lg transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={18} className="text-warm-400" />
                    ) : (
                      <Eye size={18} className="text-warm-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Login
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-warm-100">
              <div className="text-center">
                <p className="text-sm text-warm-400">
                  © 2024 Waroeng RCM Kang Abuy
                </p>
                <p className="text-xs text-warm-300 mt-1">
                  Restaurant Management System v1.0
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}