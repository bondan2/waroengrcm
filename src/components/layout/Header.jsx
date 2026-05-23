import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, Search, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import NotificationCenter from '../ui/NotificationCenter';

export default function Header() {
  const { user, profile, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-warm-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-warm-50 rounded-xl transition-colors lg:hidden"
            >
              <Menu size={20} className="text-warm-600" />
            </button>

            <div className="hidden sm:flex items-center gap-2 bg-warm-50 rounded-xl px-4 py-2 flex-1 max-w-md">
              <Search size={18} className="text-warm-400" />
              <input
                type="text"
                placeholder="Cari pesanan, menu, atau meja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-warm-800 placeholder-warm-400 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationCenter />

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 hover:bg-warm-50 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-warm-900">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-warm-500 capitalize">
                    {profile?.role || 'customer'}
                  </p>
                </div>
                <ChevronDown size={16} className="text-warm-400 hidden md:block" />
              </button>

              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-elevated border border-warm-200 overflow-hidden"
                >
                  <div className="p-4 border-b border-warm-100">
                    <p className="font-semibold text-warm-900">{profile?.full_name}</p>
                    <p className="text-sm text-warm-500">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-warm-700 hover:bg-warm-50 rounded-xl transition-colors">
                      <User size={18} />
                      Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-warm-700 hover:bg-warm-50 rounded-xl transition-colors">
                      <Settings size={18} />
                      Pengaturan
                    </button>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut size={18} />
                      Keluar
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}DashboardLayout.jsx