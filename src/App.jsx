import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import LoadingSpinner from './components/shared/LoadingSpinner';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// ==================== AUTH PAGES ====================
const Login = lazy(() => import('./pages/auth/Login'));

// ==================== LAYOUTS ====================
const CustomerLayout = lazy(() => import('./components/layout/CustomerLayout'));
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));

// ==================== CUSTOMER PAGES ====================
const Home = lazy(() => import('./pages/customer/Home'));
const Menu = lazy(() => import('./pages/customer/Menu'));
const Cart = lazy(() => import('./pages/customer/Cart'));
const Checkout = lazy(() => import('./pages/customer/Checkout'));
const Tracking = lazy(() => import('./pages/customer/Tracking'));
const Contact = lazy(() => import('./pages/customer/Contact'));

// ==================== KASIR PAGES ====================
const CashierDashboard = lazy(() => import('./pages/cashier/Dashboard'));
const POS = lazy(() => import('./pages/cashier/POS'));
const CashierOrders = lazy(() => import('./pages/cashier/Orders'));
const Tables = lazy(() => import('./pages/cashier/Tables'));
const Payments = lazy(() => import('./pages/cashier/Payments'));
const TakeawayQueue = lazy(() => import('./pages/cashier/TakeawayQueue'));
const Closing = lazy(() => import('./pages/cashier/Closing'));
const History = lazy(() => import('./pages/cashier/History'));

// ==================== ADMIN PAGES ====================
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ManageMenu = lazy(() => import('./pages/admin/ManageMenu'));
const ManageCategories = lazy(() => import('./pages/admin/ManageCategories'));
const ManagePromos = lazy(() => import('./pages/admin/ManagePromos'));
const ManageOrders = lazy(() => import('./pages/admin/ManageOrders'));
const ManageTables = lazy(() => import('./pages/admin/ManageTables'));
const ManageCashiers = lazy(() => import('./pages/admin/ManageCashiers'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Settings = lazy(() => import('./pages/admin/Settings'));

export default function App() {
  const { user, profile, loading } = useAuthStore();
  const { lastRoute, setLastRoute } = useUIStore();
  const location = useLocation();

  // Persist last route
  useEffect(() => {
    if (location.pathname !== '/login') {
      setLastRoute(location.pathname);
    }
  }, [location.pathname, setLastRoute]);

  // Redirect after login
  const getDefaultRoute = () => {
    if (!profile) return '/';
    
    switch (profile.role) {
      case 'admin':
      case 'super_admin':
        return '/admin';
      case 'cashier':
        return '/cashier';
      default:
        return '/';
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Memuat aplikasi..." />;
  }

  return (
    <ErrorBoundary>
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1c1917',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid #e7e5e4',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingSpinner fullScreen text="Memuat halaman..." />}>
          <Routes location={location} key={location.pathname}>
            {/* ==================== PUBLIC ROUTES ==================== */}
            
            {/* Login Page */}
            <Route 
              path="/login" 
              element={
                !user ? <Login /> : <Navigate to={getDefaultRoute()} replace />
              } 
            />

            {/* Customer Routes */}
            <Route element={<CustomerLayout />}>
              <Route index element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/tracking/:orderId" element={<Tracking />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* ==================== PROTECTED ROUTES - KASIR ==================== */}
            
            <Route 
              path="/cashier" 
              element={
                <ProtectedRoute roles={['cashier', 'admin', 'super_admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CashierDashboard />} />
              <Route path="pos" element={<POS />} />
              <Route path="orders" element={<CashierOrders />} />
              <Route path="tables" element={<Tables />} />
              <Route path="payments" element={<Payments />} />
              <Route path="takeaway" element={<TakeawayQueue />} />
              <Route path="closing" element={<Closing />} />
              <Route path="history" element={<History />} />
            </Route>

            {/* ==================== PROTECTED ROUTES - ADMIN ==================== */}
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute roles={['admin', 'super_admin']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="menu" element={<ManageMenu />} />
              <Route path="categories" element={<ManageCategories />} />
              <Route path="promos" element={<ManagePromos />} />
              <Route path="orders" element={<ManageOrders />} />
              <Route path="tables" element={<ManageTables />} />
              <Route path="cashiers" element={<ManageCashiers />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* ==================== 404 & FALLBACK ==================== */}
            
            <Route path="/404" element={
              <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-warm-300 mb-4">404</h1>
                  <p className="text-xl text-warm-500 mb-8">Halaman tidak ditemukan</p>
                  <a href="/" className="btn-primary inline-flex items-center gap-2">
                    Kembali ke Home
                  </a>
                </div>
              </div>
            } />
            
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </ErrorBoundary>
  );
}