import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Menu as MenuIcon,
  Home,
  Phone,
  MapPin,
  X,
} from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import CartDrawer from '../customer/CartDrawer';

export default function CustomerLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { getTotalItems } = useCartStore();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-premium border-b border-warm-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="Waroeng RCM"
                className="w-10 h-10 rounded-xl"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-warm-900 font-display">
                  Waroeng RCM
                </h1>
                <p className="text-xs text-warm-500">Kang Abuy</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'text-primary-600'
                    : 'text-warm-600 hover:text-warm-900'
                }`}
              >
                Home
              </Link>
              <Link
                to="/menu"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/menu'
                    ? 'text-primary-600'
                    : 'text-warm-600 hover:text-warm-900'
                }`}
              >
                Menu
              </Link>
              <Link
                to="/contact"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/contact'
                    ? 'text-primary-600'
                    : 'text-warm-600 hover:text-warm-900'
                }`}
              >
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-warm-50 rounded-xl transition-colors"
              >
                <ShoppingBag size={22} className="text-warm-700" />
                {getTotalItems() > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {getTotalItems()}
                  </motion.span>
                )}
              </button>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-warm-50 rounded-xl transition-colors md:hidden"
              >
                {isMenuOpen ? <X size={22} /> : <MenuIcon size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-warm-100"
            >
              <div className="px-4 py-4 space-y-2">
                <Link
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-warm-50 text-warm-700"
                >
                  <Home size={20} />
                  Home
                </Link>
                <Link
                  to="/menu"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-warm-50 text-warm-700"
                >
                  <MenuIcon size={20} />
                  Menu
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-warm-50 text-warm-700"
                >
                  <Phone size={20} />
                  Contact
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}