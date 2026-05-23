import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency } from '../../lib/utils';

export default function CartDrawer({ isOpen, onClose }) {
  const { items, removeItem, updateQuantity, getSubtotal, getTotal, getTotalItems, clearCart } =
    useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-warm-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-xl">
                  <ShoppingBag size={20} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-warm-900">Keranjang</h3>
                  <p className="text-sm text-warm-500">{getTotalItems()} item</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-warm-50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag size={64} className="mx-auto text-warm-300 mb-4" />
                  <p className="text-warm-500 font-medium">Keranjang kosong</p>
                  <p className="text-sm text-warm-400 mt-1">
                    Yuk, tambahkan menu favoritmu!
                  </p>
                  <Link
                    to="/menu"
                    onClick={onClose}
                    className="btn-primary mt-6 inline-flex items-center gap-2"
                  >
                    Lihat Menu
                    <ArrowRight size={18} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4 p-4 bg-warm-50 rounded-2xl"
                    >
                      <img
                        src={item.image_url || '/placeholder-food.jpg'}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-warm-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-primary-600 font-bold mt-1">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-warm-100 rounded-lg transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-semibold text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-warm-100 rounded-lg transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors ml-auto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <button
                    onClick={clearCart}
                    className="w-full text-sm text-red-500 hover:text-red-600 font-medium"
                  >
                    Hapus semua
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-warm-100 p-6">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-warm-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm text-warm-500">
                    <span>PPN 11%</span>
                    <span>{formatCurrency(getSubtotal() * 0.11)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-warm-900 pt-2 border-t border-warm-100">
                    <span>Total</span>
                    <span className="text-primary-600">{formatCurrency(getTotal())}</span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
                >
                  Checkout
                  <ArrowRight size={20} />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}