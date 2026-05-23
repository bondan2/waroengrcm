import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MapPin,
  User,
  Phone,
  CreditCard,
  Banknote,
  Printer,
  CheckCircle,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatCurrency, generateOrderNumber } from '../../lib/utils';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function POS() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState('dine_in');
  const [tableId, setTableId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [tables, setTables] = useState([]);

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

  const { data: menus } = useQuery({
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

      const { data } = await query.order('name');
      return data || [];
    },
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('status', 'available')
      .order('table_number');
    setTables(data || []);
  };

  const addToCart = (menu) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...menu, quantity: 1 }];
    });
    toast.success(`${menu.name} ditambahkan`);
  };

  const updateQuantity = (menuId, quantity) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== menuId));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === menuId ? { ...item, quantity } : item))
      );
    }
  };

  const removeFromCart = (menuId) => {
    setCart((prev) => prev.filter((item) => item.id !== menuId));
  };

  const getSubtotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getTax = () => getSubtotal() * 0.11;
  const getTotal = () => getSubtotal() + getTax();

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Nama customer harus diisi');
      return;
    }

    if (orderType === 'dine_in' && !tableId) {
      toast.error('Pilih nomor meja');
      return;
    }

    if (paymentMethod === 'cash' && (!cashReceived || Number(cashReceived) < getTotal())) {
      toast.error('Uang yang diterima kurang');
      return;
    }

    setProcessing(true);

    try {
      const orderNumber = generateOrderNumber();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          table_id: orderType === 'dine_in' ? tableId : null,
          order_type: orderType,
          total_amount: getTotal(),
          customer_name: customerName,
          customer_phone: customerPhone,
          notes: notes,
          status: 'processing',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        menu_id: item.id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          payment_method: paymentMethod,
          amount: getTotal(),
          cash_received: paymentMethod === 'cash' ? Number(cashReceived) : null,
          change_amount: paymentMethod === 'cash' ? Number(cashReceived) - getTotal() : null,
          status: 'completed',
        });

      if (paymentError) throw paymentError;

      // Update table status
      if (orderType === 'dine_in' && tableId) {
        await supabase
          .from('tables')
          .update({ status: 'occupied', current_order_id: order.id })
          .eq('id', tableId);
      }

      toast.success(`Pesanan #${orderNumber} berhasil dibuat!`);
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setTableId('');
      setCashReceived('');
      setShowCheckout(false);
      
      // Refresh tables
      fetchTables();
      
      // Print receipt if needed
      window.print();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Gagal membuat pesanan');
    } finally {
      setProcessing(false);
    }
  };

  const changeAmount = paymentMethod === 'cash' && cashReceived
    ? Math.max(0, Number(cashReceived) - getTotal())
    : 0;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-3xl font-bold text-warm-900 font-display">Point of Sale</h1>
        </motion.div>

        {/* Search & Categories */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={20} />
            <input
              type="text"
              placeholder="Cari menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-warm-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
              }`}
            >
              Semua
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {menus?.map((menu, index) => (
              <motion.button
                key={menu.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => addToCart(menu)}
                disabled={!menu.is_available}
                className="card-premium p-4 text-left hover:shadow-elevated transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="aspect-square bg-warm-50 rounded-xl mb-3 overflow-hidden">
                  {menu.image_url ? (
                    <img
                      src={menu.image_url}
                      alt={menu.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart size={32} className="text-warm-300" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-warm-900 text-sm mb-1 truncate">
                  {menu.name}
                </h3>
                <p className="text-primary-600 font-bold">
                  {formatCurrency(menu.price)}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 flex flex-col">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-premium flex-1 flex flex-col"
        >
          <div className="p-6 border-b border-warm-100">
            <h2 className="text-xl font-bold text-warm-900 flex items-center gap-2">
              <ShoppingCart size={24} />
              Pesanan Saat Ini
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart size={48} className="mx-auto text-warm-300 mb-4" />
                <p className="text-warm-500">Belum ada item</p>
                <p className="text-sm text-warm-400 mt-1">
                  Pilih menu untuk memulai pesanan
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-warm-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-warm-500">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-warm-100 rounded-lg"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-warm-100 rounded-lg"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="font-semibold text-sm text-warm-900 w-20 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 hover:bg-red-50 text-red-500 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-6 border-t border-warm-100">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-warm-500">Subtotal</span>
                  <span>{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-warm-500">PPN 11%</span>
                  <span>{formatCurrency(getTax())}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-warm-100">
                  <span>Total</span>
                  <span className="text-primary-600">{formatCurrency(getTotal())}</span>
                </div>
              </div>

              <button
                onClick={() => setShowCheckout(true)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Proses Pesanan
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        title="Checkout Pesanan"
        size="lg"
      >
        <div className="space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-semibold text-warm-900 mb-4">Informasi Customer</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Nama Customer
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={18} />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input-modern pl-10"
                    placeholder="Nama customer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  No. Telepon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={18} />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="input-modern pl-10"
                    placeholder="Nomor telepon"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <h3 className="text-lg font-semibold text-warm-900 mb-4">Tipe Pesanan</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  orderType === 'dine_in' ? 'border-primary-500 bg-primary-50' : 'border-warm-200'
                }`}
              >
                <MapPin size={24} className="text-primary-500 mb-2" />
                <h4 className="font-semibold">Dine In</h4>
                <p className="text-sm text-warm-500">Makan di tempat</p>
              </button>
              <button
                onClick={() => setOrderType('takeaway_pickup')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  orderType.includes('takeaway') ? 'border-primary-500 bg-primary-50' : 'border-warm-200'
                }`}
              >
                <Clock size={24} className="text-primary-500 mb-2" />
                <h4 className="font-semibold">Takeaway</h4>
                <p className="text-sm text-warm-500">Bawa pulang</p>
              </button>
            </div>

            {orderType === 'dine_in' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  Pilih Meja
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setTableId(table.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        tableId === table.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-warm-200 hover:border-warm-300'
                      }`}
                    >
                      <p className="text-lg font-bold">{table.table_number}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="text-lg font-semibold text-warm-900 mb-4">Pembayaran</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50' : 'border-warm-200'
                }`}
              >
                <Banknote size={32} className="mx-auto mb-2 text-green-600" />
                <h4 className="font-semibold">Cash</h4>
              </button>
              <button
                onClick={() => setPaymentMethod('qris')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  paymentMethod === 'qris' ? 'border-primary-500 bg-primary-50' : 'border-warm-200'
                }`}
              >
                <CreditCard size={32} className="mx-auto mb-2 text-blue-600" />
                <h4 className="font-semibold">QRIS</h4>
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Uang Diterima
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[10000, 20000, 50000, 100000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setCashReceived(amount.toString())}
                      className="py-2 bg-warm-100 hover:bg-warm-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="input-modern"
                  placeholder="Masukkan nominal"
                />
                {changeAmount > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-xl">
                    <p className="text-green-700 font-medium">
                      Kembalian: {formatCurrency(changeAmount)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Catatan
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input-modern resize-none"
              placeholder="Tambahkan catatan pesanan (opsional)"
            />
          </div>

          {/* Total Summary */}
          <div className="bg-warm-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-warm-600">Total Pembayaran</span>
              <span className="text-2xl font-bold text-primary-600">
                {formatCurrency(getTotal())}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowCheckout(false)}
              className="flex-1 px-6 py-3 border-2 border-warm-200 rounded-xl font-semibold hover:bg-warm-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmitOrder}
              disabled={processing}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Printer size={20} />
                  Proses & Cetak
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}