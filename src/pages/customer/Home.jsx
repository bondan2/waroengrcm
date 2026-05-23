import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Star,
  MapPin,
  Phone,
  Clock,
  ShoppingBag,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import MenuCard from '../../components/customer/MenuCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function Home() {
  const [bestSellers, setBestSellers] = useState([]);
  const [tables, setTables] = useState([]);

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus', 'best-sellers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('menus')
        .select('*, categories(name)')
        .eq('is_best_seller', true)
        .eq('is_available', true)
        .limit(8);
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    },
  });

  useRealtime('menus', (payload) => {
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      // Refresh menu data
    }
  });

  useRealtime('tables', (payload) => {
    // Update table status in realtime
  });

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-warm-900">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 to-warm-900/95" />
        
        {/* Floating elements */}
        <motion.div
          animate={{ y: [-20, 20], x: [-10, 10] }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 6 }}
          className="absolute top-20 right-10 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [20, -20], x: [10, -10] }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 8 }}
          className="absolute bottom-20 left-10 w-48 h-48 bg-cream-400/10 rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/90 text-sm font-medium mb-6"
            >
              🍜 Makanan Enak, Harga Ekonomis
            </motion.span>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl md:text-7xl font-bold text-white font-display leading-tight mb-6"
            >
              Waroeng RCM{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cream-400">
                Kang Abuy
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl text-white/70 font-body mb-8 leading-relaxed"
            >
              Solusi terbaik ketika lapar, mager, bosan dengan masakan rumah, dan bingung mau makan apa.
              Hadir menyajikan berbagai macam makanan enak dengan harga ekonomis.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/menu"
                className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
              >
                <ShoppingBag size={24} />
                Order Sekarang
                <ArrowRight size={24} />
              </Link>
              <a
                href="https://gofood.co.id/jakarta/restaurant/waroeng-rcm-kang-abuy-b9ada0f0-93a9-448a-997d-14a56bc904db"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glass text-white border-white/30 hover:bg-white/10 text-lg px-8 py-4"
              >
                GoFood
              </a>
              <a
                href="https://wa.me/6282110011010"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glass text-white border-white/30 hover:bg-white/10 text-lg px-8 py-4 inline-flex items-center gap-2"
              >
                <MessageCircle size={24} />
                WhatsApp
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Best Seller Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-warm-900 font-display mb-4">
            Best Seller Menu
          </h2>
          <p className="text-lg text-warm-500 max-w-2xl mx-auto">
            Menu andalan favorit pelanggan kami yang selalu diburu setiap hari
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {menus?.map((menu, index) => (
            <motion.div
              key={menu.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <MenuCard menu={menu} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-warm-900 font-display mb-4">
              Kategori Menu
            </h2>
            <p className="text-lg text-warm-500 max-w-2xl mx-auto">
              Jelajahi berbagai kategori makanan dan minuman yang kami sediakan
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories?.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="card-premium p-8 text-center cursor-pointer group"
              >
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-100 transition-colors">
                  <span className="text-3xl">{category.icon || '🍽️'}</span>
                </div>
                <h3 className="text-lg font-semibold text-warm-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-warm-500">{category.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-warm-900 font-display mb-6">
              Tentang Waroeng RCM Kang Abuy
            </h2>
            <div className="space-y-4 text-warm-600 leading-relaxed">
              <p>
                Waroeng RCM Kang Abuy hadir menyajikan berbagai macam makanan enak dengan
                harga ekonomis untuk memberikan solusi terbaik ketika lapar, mager, bosan
                dengan masakan rumah, dan bingung mau makan apa.
              </p>
              <p>
                Customer dapat datang langsung ke Waroeng RCM Kang Abuy yang berlokasi di
                Bunderan Avani Cisauk Sampora atau melakukan pemesanan melalui GoFood,
                GrabFood, dan ShopeeFood.
              </p>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-warm-700">
                <MapPin className="text-primary-500" size={20} />
                <span>Jl. Raya Cisauk Lapan Bunderan Avani No.21, Sampora, Kec. Cisauk, Kabupaten Tangerang, Banten 15345</span>
              </div>
              <div className="flex items-center gap-3 text-warm-700">
                <Phone className="text-primary-500" size={20} />
                <span>0821-1001-1010</span>
              </div>
              <div className="flex items-center gap-3 text-warm-700">
                <Clock className="text-primary-500" size={20} />
                <span>Buka setiap hari</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square bg-gradient-to-br from-primary-100 to-cream-100 rounded-3xl p-8">
              <div className="w-full h-full bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-9xl">🍜</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-warm-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/images/logo.png" alt="Logo" className="w-12 h-12 rounded-xl" />
                <div>
                  <h3 className="text-xl font-bold">Waroeng RCM</h3>
                  <p className="text-white/60 text-sm">Kang Abuy</p>
                </div>
              </div>
              <p className="text-white/60">
                Makanan Enak, Harga Ekonomis, Solusi Ketika Laper & Mageer
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Kontak Kami</h4>
              <div className="space-y-3 text-white/60">
                <p>📍 Jl. Raya Cisauk Lapan Bunderan Avani No.21</p>
                <p>📞 0821-1001-1010</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Order Online</h4>
              <div className="space-y-2">
                <a href="#" className="block text-white/60 hover:text-white transition">GoFood</a>
                <a href="#" className="block text-white/60 hover:text-white transition">GrabFood</a>
                <a href="#" className="block text-white/60 hover:text-white transition">ShopeeFood</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/40 text-sm">
            © 2024 Waroeng RCM Kang Abuy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}