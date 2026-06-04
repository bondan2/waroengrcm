import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft,
  UserPlus, UtensilsCrossed, AlertCircle
} from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import { toast } from 'sonner'

export default function Register() {
  const navigate = useNavigate()
  const { signUp } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: ''
  })

  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    if (!form.fullName || form.fullName.trim().length < 2) newErrors.fullName = 'Nama minimal 2 karakter'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email || !emailRegex.test(form.email.trim())) newErrors.email = 'Format email tidak valid'
    if (!form.password || form.password.length < 6) newErrors.password = 'Password minimal 6 karakter'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Password tidak cocok'
    if (!agreedToTerms) newErrors.terms = 'Anda harus menyetujui syarat & ketentuan'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) { toast.error('Mohon periksa kembali data Anda'); return }

    setLoading(true)

    const cleanEmail = form.email.trim().toLowerCase()
    const cleanName = form.fullName.trim()
    const cleanPhone = form.phone.trim() || null

    const result = await signUp(cleanEmail, form.password, cleanName, cleanPhone)

    if (result.success) {
      if (result.autoLogin) {
        // Auto login berhasil -> langsung ke Customer Dashboard
        toast.success('Selamat datang di Waroeng RCM! 🎉')
        setTimeout(() => {
          navigate('/customer', { replace: true })
        }, 500)
      } else {
        // Register berhasil, perlu login manual
        toast.success('Pendaftaran berhasil! Silakan login.')
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 1000)
      }
    } else {
      const errorMsg = result.error?.message || 'Gagal mendaftar'
      toast.error(errorMsg)
      if (errorMsg.includes('sudah terdaftar')) {
        setErrors({ email: 'Email sudah terdaftar. Silakan login.' })
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-orange-500 to-red-600 rounded-b-3xl opacity-10"></div>
        
        <div className="relative">
          <div className="text-center mb-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UtensilsCrossed className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Daftar Akun Baru</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Waroeng RCM Kang Abuy</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Nama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={form.fullName}
                  onChange={(e) => { setForm({ ...form, fullName: e.target.value }); setErrors({ ...errors, fullName: '' }) }}
                  placeholder="Nama lengkap Anda"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm ${errors.fullName ? 'border-red-300' : 'border-gray-200'} focus:ring-2 focus:ring-orange-500`} />
                {errors.fullName && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />}
              </div>
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }) }}
                  placeholder="contoh@email.com"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm ${errors.email ? 'border-red-300' : 'border-gray-200'} focus:ring-2 focus:ring-orange-500`} />
                {errors.email && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />}
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon (Opsional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0812-3456-7890" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }) }}
                  placeholder="Minimal 6 karakter"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm ${errors.password ? 'border-red-300' : 'border-gray-200'} focus:ring-2 focus:ring-orange-500`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" value={form.confirmPassword}
                  onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setErrors({ ...errors, confirmPassword: '' }) }}
                  placeholder="Ulangi password"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'} focus:ring-2 focus:ring-orange-500`} />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <label className="flex items-start space-x-2 cursor-pointer">
              <input type="checkbox" checked={agreedToTerms}
                onChange={(e) => { setAgreedToTerms(e.target.checked); setErrors({ ...errors, terms: '' }) }}
                className="w-4 h-4 text-orange-500 rounded mt-1" />
              <span className="text-xs text-gray-600">Saya menyetujui <a href="#" className="text-orange-600 hover:underline">Syarat & Ketentuan</a></span>
            </label>
            {errors.terms && <p className="text-xs text-red-500">{errors.terms}</p>}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2 text-sm">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Mendaftar...</span></>
              ) : (
                <><UserPlus className="w-5 h-5" /><span>Daftar & Masuk</span></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Sudah punya akun? <Link to="/login" className="text-orange-600 font-medium hover:underline">Login</Link>
            </p>
          </div>
          <div className="mt-3 text-center">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4 inline mr-1" />Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}