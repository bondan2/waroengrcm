import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Star, Clock, Eye } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import Modal from '../ui/Modal';
import { formatCurrency } from '../../lib/utils';

export default function MenuCard({ menu }) {
  const [showDetail, setShowDetail] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addItem, items } = useCartStore();
  
  const cartItem = items.find((item) => item.id === menu.id);
  const isInCart = !!cartItem;

  const handleAddToCart = () => {
    addItem(menu, quantity);
    setQuantity(1);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -8 }}
        className="card-premium overflow-hidden group cursor-pointer"
        onClick={() => setShowDetail(true)}
      >
        <div className="relative overflow-hidden">
          <img
            src={menu.image_url || '/placeholder-food.jpg'}
            alt={menu.name}
            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {menu.is_best_seller && (
            <div className="absolute top-3 left-3 bg-yellow-400 text-warm-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Star size={12} fill="currentColor" />
              Best Seller
            </div>
          )}

          {!menu.is_available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-warm-900 px-4 py-2 rounded-xl font-bold text-sm">
                Sold Out
              </span>
            </div>
          )}

          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="p-2 bg-white rounded-xl shadow-lg hover:bg-primary-500 hover:text-white transition-colors">
              <Eye size={18} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-warm-900 group-hover:text-primary-600 transition-colors">
                {menu.name}
              </h3>
              <p className="text-xs text-warm-500 mt-1">{menu.categories?.name}</p>
            </div>
          </div>

          <p className="text-sm text-warm-500 line-clamp-2 mb-3">
            {menu.description}
          </p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-primary-600">
                {formatCurrency(menu.price)}
              </p>
              <div className="flex items-center gap-1 text-xs text-warm-400">
                <Clock size={12} />
                <span>{menu.prep_time} menit</span>
              </div>
            </div>

            {menu.is_available && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  addItem(menu);
                }}
                className={`p-2 rounded-xl transition-all ${
                  isInCart
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                <ShoppingCart size={18} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        size="lg"
      >
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-2xl overflow-hidden">
            <img
              src={menu.image_url || '/placeholder-food.jpg'}
              alt={menu.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              {menu.is_best_seller && (
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                  ⭐ Best Seller
                </span>
              )}
              <span className="bg-warm-100 text-warm-600 px-3 py-1 rounded-full text-xs font-medium">
                {menu.categories?.name}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-warm-900 mb-2">{menu.name}</h2>
            <p className="text-warm-500 mb-4">{menu.description}</p>

            <div className="flex items-center gap-4 mb-6">
              <p className="text-3xl font-bold text-primary-600">
                {formatCurrency(menu.price)}
              </p>
              <div className="flex items-center gap-1 text-sm text-warm-400">
                <Clock size={16} />
                <span>{menu.prep_time} menit</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-warm-50 rounded-xl transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="w-12 text-center font-bold text-lg">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-warm-50 rounded-xl transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}