import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import MenuCard from '../../components/customer/MenuCard';
import { SkeletonCard } from '../../components/ui/Skeleton';

export default function Menu() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');

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

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus', selectedCategory, search],
    queryFn: async () => {
      let query = supabase
        .from('menus')
        .select('*, categories(name)')
        .eq('is_available', true);

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data } = await query;
      return data || [];
    },
  });

  useRealtime('menus', () => {
    // Auto refresh when menu changes
  });

  const filteredMenus = useMemo(() => {
    if (!menus) return [];
    
    let sorted = [...menus];
    
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted = sorted.sort((a, b) => (b.is_best_seller ? 1 : 0) - (a.is_best_seller ? 1 : 0));
    }
    
    return sorted;
  }, [menus, sortBy]);

  return (
    <div className="pt-20 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-warm-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-warm-900 font-display mb-2">
              Menu Kami
            </h1>
            <p className="text-warm-500">
              Jelajahi berbagai pilihan makanan dan minuman terbaik kami
            </p>
          </motion.div>

          {/* Search & Filter */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={20} />
              <input
                type="text"
                placeholder="Cari menu favoritmu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-warm-50 border border-warm-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-warm-100 rounded-lg"
                >
                  <X size={16} className="text-warm-400" />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-white border border-warm-200 rounded-xl text-sm focus:border-primary-500 outline-none"
            >
              <option value="default">Default</option>
              <option value="price-low">Harga Terendah</option>
              <option value="price-high">Harga Tertinggi</option>
              <option value="name">Nama (A-Z)</option>
            </select>
          </div>

          {/* Categories */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-warm-50 text-warm-600 hover:bg-warm-100'
              }`}
            >
              Semua Menu
            </button>
            {categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-warm-50 text-warm-600 hover:bg-warm-100'
                }`}
              >
                {category.icon && <span className="mr-2">{category.icon}</span>}
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="text-center py-20">
            <Filter size={64} className="mx-auto text-warm-300 mb-4" />
            <h3 className="text-xl font-bold text-warm-700 mb-2">
              Menu tidak ditemukan
            </h3>
            <p className="text-warm-500">
              Coba cari dengan kata kunci yang berbeda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMenus.map((menu, index) => (
              <motion.div
                key={menu.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MenuCard menu={menu} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}