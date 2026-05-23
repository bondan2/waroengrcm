import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import LoadingSpinner from '../shared/LoadingSpinner';

export default function DashboardLayout() {
  const { user, profile, loading, isAdmin, isCashier } = useAuthStore();
  const { isSidebarOpen } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { state: { from: location.pathname } });
    }
    
    if (profile) {
      if (location.pathname.startsWith('/admin') && !isAdmin()) {
        navigate('/cashier');
      }
      if (location.pathname.startsWith('/cashier') && !isCashier() && !isAdmin()) {
        navigate('/');
      }
    }
  }, [user, profile, loading, location.pathname]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar />
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : ''}`}>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}CustomerLayout.jsx