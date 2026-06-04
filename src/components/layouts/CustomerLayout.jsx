import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ShoppingBag, Clock, Heart, Ticket, Award, 
  User, Menu, X, LogOut, UtensilsCrossed,
  ChevronRight, ArrowRight
} from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import useCartStore from '../../stores/cartStore'

const menuItems = [
  { path: '/customer', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/customer/menu', icon: UtensilsCrossed, label: 'Pesan Menu', highlight: true },
  { path: '/customer/history', icon: Clock, label: 'Riwayat Order' },
  { path: '/customer/favorites', icon: Heart, label: 'Favorit Saya' },
  { path: '/customer/vouchers', icon: Ticket, label: 'Voucher Saya' },
  { path: '/customer/membership', icon: Award, label: 'Membership' },
  { path: '/customer/profile', icon: User, label: 'Profile' },
]

export default function CustomerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()
  const { getItemCount } = useCartStore()
  const cartCount = getItemCount()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/customer" className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm hidden sm:block">WAROENG RCM</span>
            </Link>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Tombol Pesan Menu */}
            <Link to="/customer/menu"
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:shadow-lg transition-all">
              <UtensilsCrossed className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Pesan Menu</span>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100">
              <ShoppingBag className="w-5 h-5 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0 min-h-[calc(100vh-4rem)] bg-white border-r border-gray-200 p-4 sticky top-16">
          <div className="flex items-center space-x-3 mb-4 p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
              {profile?.full_name?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name || 'Customer'}</p>
              <p className="text-xs text-gray-500 capitalize">{profile?.membership_level?.replace('_', ' ') || 'Member Baru'}</p>
            </div>
          </div>

          {/* Tombol Pesan Menu Besar */}
          <Link to="/customer/menu"
            className="flex items-center justify-center space-x-2 w-full py-3 mb-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm">
            <UtensilsCrossed className="w-4 h-4" />
            <span>🍽️ Pesan Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <nav className="space-y-1">
            {menuItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <Link key={item.path} to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isActive ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 lg:hidden shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-bold text-sm">Dashboard Customer</span>
                <button onClick={() => setSidebarOpen(false)} className="p-2"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4">
                <Link to="/customer/menu" onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold text-sm">
                  <UtensilsCrossed className="w-4 h-4" /><span>🍽️ Pesan Menu</span>
                </Link>
              </div>
              <nav className="flex-1 overflow-y-auto px-4 space-y-1">
                {menuItems.map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm ${
                      location.pathname === item.path ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    <item.icon className="w-4 h-4" /><span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t">
                <button onClick={handleSignOut} className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100">
                  <LogOut className="w-4 h-4 inline mr-1" />Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}