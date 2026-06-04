import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, ShoppingBag, UtensilsCrossed, Star, Heart, Percent
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useCartStore from '../../stores/cartStore'
import useAuthStore from '../../stores/authStore'
import { formatCurrency } from '../../utils/format'
import { toast } from 'sonner'

export default function CustomerMenu() {
  const { user } = useAuthStore()
  const { addItem } = useCartStore()
  const [menus, setMenus] = useState([])
  const [categories, setCategories] = useState([])
  const [promotions, setPromotions] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState([])

  useEffect(() => { loadData(); loadFavorites() }, [selectedCategory])

  const loadData = async () => {
    setLoading(true)
    try {
      let menuQuery = supabase.from('menus').select('*, categories(name)').eq('is_available', true)
      if (selectedCategory !== 'all') menuQuery = menuQuery.eq('category_id', selectedCategory)

      const [menuResult, catResult, promoResult] = await Promise.all([
        menuQuery.order('name'),
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('promotions').select('*').eq('is_active', true).order('created_at', { ascending: false })
      ])

      setMenus(menuResult.data || [])
      setCategories(catResult.data || [])

      const now = new Date()
      setPromotions((promoResult.data || []).filter(p => {
        if (!p.is_active) return false
        if (p.start_date && new Date(p.start_date) > now) return false
        if (p.end_date && new Date(p.end_date) < now) return false
        return true
      }))
    } catch (error) { console.error('Error:', error) } finally { setLoading(false) }
  }

  const loadFavorites = () => {
    if (user) {
      const stored = localStorage.getItem(`favorites_${user.id}`)
      if (stored) setFavorites(JSON.parse(stored))
    }
  }

  const toggleFavorite = (menuId) => {
    const newFavs = favorites.includes(menuId) ? favorites.filter(id => id !== menuId) : [...favorites, menuId]
    setFavorites(newFavs)
    localStorage.setItem(`favorites_${user.id}`, JSON.stringify(newFavs))
    toast.success(newFavs.includes(menuId) ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit')
  }

  const handleAddToCart = (menu) => {
    addItem({ id: menu.id, name: menu.name, price: menu.price, image_url: menu.image_url, description: menu.description })
    toast.success(`${menu.name} ditambahkan`, { action: { label: 'Keranjang', onClick: () => window.location.href = '/cart' } })
  }

  const getDiscountedPrice = (price) => {
    if (promotions.length === 0) return null
    let bestDiscount = 0
    let discountType = 'percentage'
    promotions.forEach(p => {
      let d = p.discount_type === 'percentage' ? (price * p.discount_value) / 100 : p.discount_value
      if (d > bestDiscount) { bestDiscount = d; discountType = p.discount_type }
    })
    if (bestDiscount > 0) {
      return {
        discountedPrice: Math.max(0, price - bestDiscount),
        discountLabel: discountType === 'percentage' ? `${Math.round((bestDiscount / price) * 100)}% OFF` : `-${formatCurrency(bestDiscount)}`,
        savedAmount: bestDiscount
      }
    }
    return null
  }

  const filteredMenus = menus.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">🍽️ Pesan Menu</h1>
      <p className="text-sm text-gray-500 mb-4">Pilih menu favoritmu</p>

      {/* PROMO BANNER */}
      {promotions.length > 0 && (
        <div className="mb-4 space-y-2">
          {promotions.map(promo => (
            <motion.div key={promo.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"><Percent className="w-4 h-4 text-red-600" /></div>
                <div>
                  <p className="font-semibold text-red-700 text-sm">{promo.title}</p>
                  <p className="text-xs text-red-500">{promo.description}</p>
                </div>
              </div>
              <span className="text-lg font-bold text-red-600 whitespace-nowrap">
                {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : formatCurrency(promo.discount_value)}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Cari menu..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-orange-500" />
      </div>

      {/* Categories */}
      <div className="flex space-x-1 overflow-x-auto pb-3 mb-4 hide-scrollbar">
        <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 ${selectedCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}>Semua</button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 ${selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}>{cat.name}</button>
        ))}
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{[...Array(8)].map((_,i)=><div key={i} className="h-48 bg-white rounded-xl animate-pulse"></div>)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredMenus.map(menu => {
            const discount = getDiscountedPrice(menu.price)
            return (
              <motion.div key={menu.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all group">
                <div className="relative h-32 sm:h-36 bg-gradient-to-br from-orange-100 to-red-100">
                  {menu.image_url ? <img src={menu.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" /> :
                    <div className="flex items-center justify-center h-full"><UtensilsCrossed className="w-8 h-8 text-orange-300" /></div>}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {menu.is_best_seller && <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] rounded-full font-semibold flex items-center"><Star className="w-2 h-2 mr-0.5 fill-current" />Best</span>}
                    {discount && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-semibold">{discount.discountLabel}</span>}
                  </div>
                  <button onClick={(e)=>{e.stopPropagation();toggleFavorite(menu.id)}} className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow">
                    <Heart className={`w-3.5 h-3.5 ${favorites.includes(menu.id)?'fill-red-500 text-red-500':'text-gray-400'}`} />
                  </button>
                </div>
                <div className="p-2.5 sm:p-3">
                  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-1">{menu.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      {discount ? (
                        <>
                          <span className="text-sm sm:text-base font-bold text-red-600">{formatCurrency(discount.discountedPrice)}</span>
                          <span className="text-[10px] text-gray-400 line-through ml-1">{formatCurrency(menu.price)}</span>
                        </>
                      ) : (
                        <span className="text-sm sm:text-base font-bold text-orange-600">{formatCurrency(menu.price)}</span>
                      )}
                    </div>
                    <button onClick={() => handleAddToCart(menu)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white flex items-center justify-center hover:shadow-lg active:scale-95">
                      <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  {discount && <p className="text-[10px] text-green-600 mt-1">Hemat {formatCurrency(discount.savedAmount)}</p>}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}