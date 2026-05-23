import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  MapPin,
  User,
  Phone,
  QrCode,
  Copy,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabaseClient';
import { formatCurrency, generateOrderNumber } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    items,
    getSubtotal,
    getTotal,
    getTax,
    orderType,
    setOrderType,
    tableId,
    setTableId,
    customerName,
    customerPhone,
    setCustomerInfo,
    notes,
    setNotes,
    clearCart,
  } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showTakeawayModal, setShowTakeawayModal] = useState(false);
  const [showQRIS, setShowQRIS] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);
  const [tables, setTables] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (items.length === 0) {
      navigate('/menu');
    }
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

  const handleOrderTypeSelect = (type) => {
    if (type === 'takeaway_waiting' || type === 'takeaway_pickup') {
      setShowTakeawayModal(true);
    } else {
      setOrderType(type);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!orderType) {
      newErrors.orderType = 'Pilih tipe pesanan';
    }

    if (orderType === 'dine_in' && !tableId) {
      newErrors.tableId = 'Pilih nomor meja';
    }

    if (!customerName.trim()) {
      newErrors.customerName = 'Nama harus diisi';
    }

    if (!customerPhone.trim()) {
      newErrors.customerPhone = 'Nomor telepon harus diisi';
    }

    if (paymentMethod === 'cash' && (!cashReceived || Number(cashReceived) < getTotal())) {
      newErrors.cashReceived = 'Uang yang diterima kurang';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) return;

    setProcessing(true);

    try {
      const orderNumber = generateOrderNumber();
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user?.id || null,
          table_id: orderType === 'dine_in' ? tableId : null,
          order_type: orderType,
          total_amount: getTotal(),
          customer_name: customerName,
          customer_phone: customerPhone,
          notes: notes,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        menu_id: item.id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        notes: item.notes,
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
          status: 'pending',
        });

      if (paymentError) throw paymentError;

      // Update table status if dine-in
      if (orderType === 'dine_in' && tableId) {
        await supabase
          .from('tables')
          .update({ status: 'occupied', current_order_id: order.id })
          .eq('id', tableId);
      }

      // Create notification for cashier
      await supabase.from('notifications').insert({
        user_id: null, // Will be sent to all cashiers
        title: 'Pesanan Baru',
        message: `Order #${orderNumber} dari ${customerName}`,
        type: 'order',
        data: { order_id: order.id },
      });

      toast.success('Pesanan berhasil dibuat!');
      clearCart();
      navigate(`/tracking/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setProcessing(false);
    }
  };

  const changeAmount = paymentMethod === 'cash' && cashReceived
    ? Math.max(0, Number(cashReceived) - getTotal())
    : 0;

  if (items.length === 0) return null;

  return (
    <div className="pt-20 min-h-screen bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/cart" className="inline-flex items-center gap-2 text-warm-600 hover:text-warm-900 mb-8">
          <ArrowLeft size={20} />
          <span>Kembali ke Keranjang</span>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium p-6"
            >
              <h2 className="text-xl font-bold text-warm-900 mb-4">Tipe Pesanan</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleOrderTypeSelect('dine_in')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    orderType === 'dine_in'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-warm-200 hover:border-warm-300'
                  }`}
                >
                  <MapPin size={24} className="text-primary-500 mb-2" />
                  <h3 className="font-semibold text-warm-900">Dine In</h3>
                  <p className="text-sm text-warm-500">Makan di tempat</p>
                </button>
                <button
                  onClick={() => handleOrderTypeSelect('takeaway_waiting')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    orderType === 'takeaway_waiting' || orderType === 'takeaway_pickup'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-warm-200 hover:border-warm-300'
                  }`}
                >
                  <Clock size={24} className="text-primary-500 mb-2" />
                  <h3 className="font-semibold text-warm-900">Takeaway</h3>
                  <p className="text-sm text-warm-500">Bawa pulang</p>
                </button>
              </div>
              {errors.orderType && (
                <p className="text-red-500 text-sm mt-2">{errors.orderType}</p>
              )}
            </motion.div>

            {/* Table Selection (Dine In) */}
            {orderType === 'dine_in' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-premium p-6"
              >
                <h2 className="text-xl font-bold text-warm-900 mb-4">Pilih Meja</h2>
                <div className="grid grid-cols-4 gap-3">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setTableId(table.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        tableId === table.id
                          ? 'border-primary-500 bg-primary-50 text-primary-600'
                          : 'border-warm-200 hover:border-warm-300'
                      }`}
                    >
                      <p className="text-2xl font-bold">{table.table_number}</p>
                      <p className="text-xs text-warm-500 mt-1">
                        Kapasitas {table.capacity}
                      </p>
                    </button>
                  ))}
                </div>
                {errors.tableId && (
                  <p className="text-red-500 text-sm mt-2">{errors.tableId}</p>
                )}
              </motion.div>
            )}

            {/* Customer Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium p-6"
            >
              <h2 className="text-xl font-bold text-warm-900 mb-4">Informasi Pemesan</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    Nama
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={18} />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerInfo(e.target.value, customerPhone);
                        setErrors({ ...errors, customerName: '' });
                      }}
                      placeholder="Masukkan nama Anda"
                      className="input-modern pl-10"
                    />
                  </div>
                  {errors.customerName && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    Nomor Telepon
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={18} />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerInfo(customerName, e.target.value);
                        setErrors({ ...errors, customerPhone: '' });
                      }}
                      placeholder="Masukkan nomor telepon"
                      className="input-modern pl-10"
                    />
                  </div>
                  {errors.customerPhone && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    Catatan Pesanan
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tambahkan catatan untuk pesanan Anda (opsional)"
                    rows={3}
                    className="input-modern resize-none"
                  />
                </div>
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium p-6"
            >
              <h2 className="text-xl font-bold text-warm-900 mb-4">Metode Pembayaran</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-warm-200 hover:border-warm-300'
                  }`}
                >
                  <Banknote size={32} className="mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold">Cash</h3>
                </button>
                <button
                  onClick={() => {
                    setPaymentMethod('qris');
                    setShowQRIS(true);
                  }}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    paymentMethod === 'qris'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-warm-200 hover:border-warm-300'
                  }`}
                >
                  <QrCode size={32} className="mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">QRIS</h3>
                </button>
              </div>

              {paymentMethod === 'cash' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    Uang yang Diterima
                  </label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => {
                      setCashReceived(e.target.value);
                      setErrors({ ...errors, cashReceived: '' });
                    }}
                    placeholder="Masukkan jumlah uang"
                    className="input-modern"
                  />
                  {errors.cashReceived && (
                    <p className="text-red-500 text-sm mt-1">{errors.cashReceived}</p>
                  )}
                  {cashReceived && Number(cashReceived) >= getTotal() && (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl">
                      <p className="text-sm text-green-700 font-medium">
                        Kembalian: {formatCurrency(changeAmount)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium p-6 sticky top-24"
            >
              <h2 className="text-xl font-bold text-warm-900 mb-4">Ringkasan Pesanan</h2>

              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-warm-600">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium text-warm-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-warm-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-warm-500">Subtotal</span>
                  <span className="text-warm-900">{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-warm-500">PPN 11%</span>
                  <span className="text-warm-900">{formatCurrency(getTax())}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-warm-100">
                  <span>Total</span>
                  <span className="text-primary-600">{formatCurrency(getTotal())}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={processing}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Buat Pesanan
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Takeaway Modal */}
      <Modal
        isOpen={showTakeawayModal}
        onClose={() => setShowTakeawayModal(false)}
        title="Pilih Opsi Takeaway"
        size="md"
      >
        <div className="space-y-3">
          <button
            onClick={() => {
              setOrderType('takeaway_pickup');
              setShowTakeawayModal(false);
            }}
            className="w-full p-4 rounded-xl border-2 border-warm-200 hover:border-primary-500 text-left transition-all"
          >
            <h3 className="font-semibold text-warm-900 mb-1">Pesan Langsung</h3>
            <p className="text-sm text-warm-500">Pesan dan ambil sendiri di waroeng</p>
          </button>
          <a
            href="https://gofood.co.id/jakarta/restaurant/waroeng-rcm-kang-abuy-b9ada0f0-93a9-448a-997d-14a56bc904db"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-4 rounded-xl border-2 border-warm-200 hover:border-red-500 text-left transition-all block"
          >
            <h3 className="font-semibold text-warm-900 mb-1">GoFood</h3>
            <p className="text-sm text-warm-500">Pesan melalui aplikasi GoFood</p>
          </a>
          <button
            onClick={() => setShowTakeawayModal(false)}
            className="w-full p-4 rounded-xl border-2 border-warm-200 hover:border-green-500 text-left transition-all"
          >
            <h3 className="font-semibold text-warm-900 mb-1">GrabFood</h3>
            <p className="text-sm text-warm-500">Pesan melalui aplikasi GrabFood</p>
          </button>
          <button
            onClick={() => setShowTakeawayModal(false)}
            className="w-full p-4 rounded-xl border-2 border-warm-200 hover:border-orange-500 text-left transition-all"
          >
            <h3 className="font-semibold text-warm-900 mb-1">ShopeeFood</h3>
            <p className="text-sm text-warm-500">Pesan melalui aplikasi ShopeeFood</p>
          </button>
        </div>
      </Modal>

      {/* QRIS Modal */}
      <Modal
        isOpen={showQRIS}
        onClose={() => setShowQRIS(false)}
        title="Pembayaran QRIS"
        size="md"
      >
        <div className="text-center">
          <img
            src="/images/qris.png"
            alt="QRIS Payment"
            className="w-64 h-64 mx-auto mb-4 rounded-xl"
          />
          <p className="text-warm-600 mb-4">
            Scan QR code di atas menggunakan aplikasi pembayaran favorit Anda
          </p>
          <div className="p-4 bg-warm-50 rounded-xl mb-4">
            <p className="font-bold text-warm-900">{formatCurrency(getTotal())}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-warm-500">
            <Copy size={16} />
            <span>Salin kode pembayaran</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}