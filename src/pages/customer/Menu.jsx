import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, ShoppingBag, UtensilsCrossed, Star, Heart, Percent, Package
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../utils/format'
import useCartStore from '../../stores/cartStore'
import useAuthStore from '../../stores/authStore'
import { toast } from 'sonner'

export default function Menu() {
  const [searchParams] = useSearchParams()
  const [menus, setMenus] = useState([])
  const [categories, setCategories] = useState([])
  const [promotions, setPromotions] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState([])
  const { addItem } = useCartStore()
  const { user } = useAuthStore()

  useEffect(() => {
    loadData()
    loadFavorites()
    
    const itemId = searchParams.get('item')
    if (itemId) {
      setTimeout(() => {
        const element = document.getElementById(`menu-${itemId}`)
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [selectedCategory])

  const loadData = async () => {
    setLoading(true)
    try {
      let menuQuery = supabase
        .from('menus')
        .select('*, categories(name, slug)')
        .eq('is_available', true)
      
      if (selectedCategory !== 'all') {
        menuQuery = menuQuery.eq('category_id', selectedCategory)
      }

      const [menuResult, categoryResult, promoResult] = await Promise.all([
        menuQuery.order('name'),
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('promotions').select('*').eq('is_active', true).order('created_at', { ascending: false })
      ])

      setMenus(menuResult.data || [])
      setCategories(categoryResult.data || [])

      // Filter promo yang masih aktif
      const now = new Date()
      const activePromos = (promoResult.data || []).filter(p => {
        if (!p.is_active) return false
        if (p.start_date && new Date(p.start_date) > now) return false
        if (p.end_date && new Date(p.end_date) < now) return false
        return true
      })
      setPromotions(activePromos)
    } catch (error) {
      console.error('Error loading menu:', error)
      toast.error('Gagal memuat menu')
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = () => {
    if (user) {
      const stored = localStorage.getItem(`favorites_${user.id}`)
      if (stored) setFavorites(JSON.parse(stored))
    }
  }

  const toggleFavorite = (menuId) => {
    if (!user) {
      toast.error('Login terlebih dahulu untuk menyimpan favorit')
      return
    }
    const newFavs = favorites.includes(menuId)
      ? favorites.filter(id => id !== menuId)
      : [...favorites, menuId]
    setFavorites(newFavs)
    localStorage.setItem(`favorites_${user.id}`, JSON.stringify(newFavs))
    toast.success(newFavs.includes(menuId) ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit')
  }

  const filteredMenus = menus.filter(menu =>
    menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    menu.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    menu.categories?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddToCart = (menu) => {
    addItem({
      id: menu.id, name: menu.name, price: menu.price,
      image_url: menu.image_url, description: menu.description
    })
    toast.success(`${menu.name} ditambahkan`, {
      action: { label: 'Lihat Keranjang', onClick: () => window.location.href = '/cart' }
    })
  }

  // ============================================
  // FUNGSI HITUNG DISKON
  // ============================================
  const getDiscountedPrice = (price) => {
    if (!promotions || promotions.length === 0) return null

    let bestDiscount = 0
    let discountType = 'percentage'
    let promoName = ''

    promotions.forEach(promo => {
      let discountAmount = 0
      if (promo.discount_type === 'percentage') {
        discountAmount = (price * promo.discount_value) / 100
      } else {
        discountAmount = promo.discount_value
      }
      if (discountAmount > bestDiscount) {
        bestDiscount = discountAmount
        discountType = promo.discount_type
        promoName = promo.title
      }
    })

    if (bestDiscount > 0 && bestDiscount < price) {
      return {
        discountedPrice: price - bestDiscount,
        discountLabel: discountType === 'percentage'
          ? `${Math.round((bestDiscount / price) * 100)}% OFF`
          : `-${formatCurrency(bestDiscount)}`,
        savedAmount: bestDiscount,
        originalPrice: price,
        promoName: promoName
      }
    }
    return null
  }

  // Group menus by category
  const groupedMenus = selectedCategory === 'all'
    ? categories.reduce((acc, cat) => {
        const catMenus = filteredMenus.filter(m => m.category_id === cat.id)
        if (catMenus.length > 0) acc[cat.name] = catMenus
        return acc
      }, {})
    : { '': filteredMenus }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Menu Kami</h1>
            <p className="text-orange-100 text-sm sm:text-base">Pilih menu favorit Anda</p>
          </div>
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text" placeholder="Cari menu favoritmu..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-orange-300 focus:outline-none shadow-lg text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ============================================ */}
        {/* PROMO BANNER */}
        {/* ============================================ */}
        {promotions.length > 0 && (
          <div className="mb-6 space-y-2">
            {promotions.map(promo => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-3 sm:p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Percent className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-red-700 text-sm sm:text-base">{promo.title}</p>
                    <p className="text-xs text-red-500 truncate">{promo.description}</p>
                  </div>
                </div>
                <span className="text-base sm:text-lg font-bold text-red-600 whitespace-nowrap ml-3">
                  {promo.discount_type === 'percentage'
                    ? `${promo.discount_value}% OFF`
                    : formatCurrency(promo.discount_value)}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* ============================================ */}
        {/* CATEGORIES */}
        {/* ============================================ */}
        <div className="flex space-x-2 overflow-x-auto pb-4 mb-6 sticky top-0 z-10 bg-gray-50 py-3 hide-scrollbar">
          <button onClick={() => setSelectedCategory('all')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all shadow-sm flex-shrink-0 ${
              selectedCategory === 'all' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-orange-500/25' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}>
            <Package className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />Semua
          </button>
          {categories.map(category => (
            <button key={category.id} onClick={() => setSelectedCategory(category.id)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all shadow-sm flex-shrink-0 ${
                selectedCategory === category.id ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-orange-500/25' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}>
              {category.image_url ? <img src={category.image_url} alt="" className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 rounded" /> :
                <UtensilsCrossed className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />}
              {category.name}
            </button>
          ))}
        </div>

        {/* ============================================ */}
        {/* MENU GRID */}
        {/* ============================================ */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl sm:rounded-2xl overflow-hidden animate-pulse">
                <div className="h-32 sm:h-40 lg:h-48 bg-gray-200"></div>
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : selectedCategory === 'all' ? (
          <div className="space-y-10">
            {Object.entries(groupedMenus).map(([categoryName, categoryMenus]) => (
              <div key={categoryName}>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-500" />
                  {categoryName}
                  <span className="ml-3 text-sm font-normal text-gray-400">({categoryMenus.length} menu)</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {categoryMenus.map((menu, index) => (
                    <MenuCard
                      key={menu.id} menu={menu} index={index}
                      isFavorite={favorites.includes(menu.id)}
                      onToggleFavorite={() => toggleFavorite(menu.id)}
                      onAddToCart={() => handleAddToCart(menu)}
                      discount={getDiscountedPrice(menu.price)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredMenus.map((menu, index) => (
              <MenuCard
                key={menu.id} menu={menu} index={index}
                isFavorite={favorites.includes(menu.id)}
                onToggleFavorite={() => toggleFavorite(menu.id)}
                onAddToCart={() => handleAddToCart(menu)}
                discount={getDiscountedPrice(menu.price)}
              />
            ))}
          </div>
        )}

        {!loading && filteredMenus.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Menu Tidak Ditemukan</h2>
            <p className="text-sm text-gray-500">Coba kata kunci lain atau pilih kategori berbeda</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// MENU CARD COMPONENT (DENGAN DISKON)
// ============================================
function MenuCard({ menu, index, isFavorite, onToggleFavorite, onAddToCart, discount }) {
  return (
    <motion.div
      id={`menu-${menu.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      {/* Image */}
      <div className="relative h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-orange-100 to-red-100 overflow-hidden">
        {menu.image_url ? (
          <img src={menu.image_url} alt={menu.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <UtensilsCrossed className="w-8 h-8 sm:w-12 sm:h-12 text-orange-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {menu.is_best_seller && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-orange-500 text-white text-[10px] sm:text-xs rounded-full font-semibold flex items-center shadow-lg">
              <Star className="w-2 h-2 sm:w-3 sm:h-3 mr-1 fill-current" />Best Seller
            </span>
          )}
          {discount && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-red-500 text-white text-[10px] sm:text-xs rounded-full font-semibold shadow-lg">
              {discount.discountLabel}
            </span>
          )}
        </div>

        {/* Favorite */}
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
          className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>

        {/* Category Badge */}
        {menu.categories && (
          <div className="absolute bottom-2 left-2">
            <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-gray-600 text-[10px] sm:text-xs rounded-lg">
              {menu.categories.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-3 lg:p-4">
        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1 line-clamp-1">{menu.name}</h3>
        <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
          {menu.description || 'Menu spesial dari Waroeng RCM'}
        </p>

        {/* Price with Discount */}
        <div className="flex items-center justify-between">
          <div>
            {discount ? (
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-sm sm:text-lg font-bold text-red-600">
                    {formatCurrency(discount.discountedPrice)}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                    {formatCurrency(discount.originalPrice)}
                  </span>
                </div>
                <p className="text-[10px] text-green-600 font-medium mt-0.5">
                  💰 Hemat {formatCurrency(discount.savedAmount)}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-sm sm:text-lg font-bold text-orange-600">
                  {formatCurrency(menu.price)}
                </span>
                {menu.total_sold > 0 && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Terjual {menu.total_sold}x</p>
                )}
              </div>
            )}
          </div>

          <button onClick={(e) => { e.stopPropagation(); onAddToCart() }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 transition-all">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}