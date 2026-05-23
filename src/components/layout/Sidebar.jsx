import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Table2,
  CreditCard,
  Clock,
  FileText,
  History,
  Menu,
  Grid3X3,
  Tag,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import logo from '/images/logo.png';

const cashierLinks = [
  { to: '/cashier', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cashier/pos', icon: ShoppingCart, label: 'POS / Buat Pesanan' },
  { to: '/cashier/orders', icon: ClipboardList, label: 'Kelola Order' },
  { to: '/cashier/tables', icon: Table2, label: 'Monitoring Meja' },
  { to: '/cashier/payments', icon: CreditCard, label: 'Pembayaran' },
  { to: '/cashier/takeaway', icon: Clock, label: 'Takeaway Queue' },
  { to: '/cashier/closing', icon: FileText, label: 'Closing Kasir' },
  { to: '/cashier/history', icon: History, label: 'Riwayat Transaksi' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/menu', icon: Menu, label: 'Kelola Menu' },
  { to: '/admin/categories', icon: Grid3X3, label: 'Kelola Kategori' },
  { to: '/admin/promos', icon: Tag, label: 'Kelola Promo' },
  { to: '/admin/orders', icon: ClipboardList, label: 'Kelola Order' },
  { to: '/admin/tables', icon: Table2, label: 'Kelola Meja' },
  { to: '/admin/cashiers', icon: Users, label: 'Kelola Kasir' },
  { to: '/admin/reports', icon: BarChart3, label: 'Laporan & Analytics' },
  { to: '/admin/settings', icon: Settings, label: 'Pengaturan Website' },
];

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { isAdmin } = useAuthStore();
  const location = useLocation();
  const links = location.pathname.startsWith('/admin') ? adminLinks : cashierLinks;

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleSidebar}
          />
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-72 bg-white border-r border-warm-200 z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Waroeng RCM" className="w-10 h-10 rounded-xl" />
                  <div>
                    <h1 className="text-sm font-bold text-warm-900">Waroeng RCM</h1>
                    <p className="text-xs text-warm-500">Kang Abuy</p>
                  </div>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-warm-50 rounded-lg transition-colors lg:hidden"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-1">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/cashier' || link.to === '/admin'}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-warm-600 hover:bg-warm-50 hover:text-warm-900'
                      }`
                    }
                  >
                    <link.icon size={20} />
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}