import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChefHat,
  Package,
  Printer,
  MoreVertical,
  ArrowUpDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import { formatCurrency } from '../../lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function CashierOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['cashier-orders', statusFilter, typeFilter, search, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          tables(table_number),
          order_items(count),
          payments(status, payment_method)
        `);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        if (typeFilter === 'dine_in') {
          query = query.eq('order_type', 'dine_in');
        } else if (typeFilter === 'takeaway') {
          query = query.or('order_type.eq.takeaway_waiting,order_type.eq.takeaway_pickup');
        }
      }

      if (search) {
        query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%`);
      }

      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'highest':
          query = query.order('total_amount', { ascending: false });
          break;
        case 'lowest':
          query = query.order('total_amount', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data } = await query.limit(50);
      return data || [];
    },
    refetchInterval: 10000,
  });

  useRealtime('orders', () => {
    queryClient.invalidateQueries({ queryKey: ['cashier-orders'] });
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-orders'] });
      toast.success('Status pesanan diupdate');
    },
    onError: () => {
      toast.error('Gagal mengupdate status');
    },
  });

  const handleViewDetail = async (order) => {
    const { data: items } = await supabase
      .from('order_items')
      .select('*, menus(name, price, image_url)')
      .eq('order_id', order.id);

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', order.id)
      .single();

    setSelectedOrder({ ...order, items, payment });
    setShowDetail(true);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Pending' },
      processing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Diproses' },
      ready: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Siap Diambil' },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Selesai' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Dibatalkan' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${badge.text.replace('text-', 'bg-')}`} />
        {badge.label}
      </span>
    );
  };

  const getStatusActions = (order) => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              icon={ChefHat}
              onClick={() => updateStatus.mutate({ id: order.id, status: 'processing' })}
            >
              Proses
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={XCircle}
              onClick={() => {
                if (window.confirm('Batalkan pesanan ini?')) {
                  updateStatus.mutate({ id: order.id, status: 'cancelled' });
                }
              }}
            >
              Cancel
            </Button>
          </div>
        );
      case 'processing':
        return (
          <Button
            size="sm"
            variant="success"
            icon={Package}
            onClick={() => updateStatus.mutate({ id: order.id, status: 'ready' })}
          >
            Siap
          </Button>
        );
      case 'ready':
        return (
          <Button
            size="sm"
            variant="success"
            icon={CheckCircle}
            onClick={() => updateStatus.mutate({ id: order.id, status: 'completed' })}
          >
            Selesaikan
          </Button>
        );
      default:
        return null;
    }
  };

  // Stats
  const stats = {
    all: orders?.length || 0,
    pending: orders?.filter((o) => o.status === 'pending').length || 0,
    processing: orders?.filter((o) => o.status === 'processing').length || 0,
    ready: orders?.filter((o) => o.status === 'ready').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-warm-900 font-display">
            Kelola Order
          </h1>
          <p className="text-warm-500 mt-1">
            Monitor dan update status pesanan secara realtime
          </p>
        </div>
      </motion.div>

      {/* Stats Mini */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Semua', value: stats.all, color: 'text-warm-900', bg: 'bg-warm-50' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Diproses', value: stats.processing, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Siap', value: stats.ready, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((stat, i) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setStatusFilter(stat.label === 'Semua' ? 'all' : stat.label.toLowerCase())}
            className={`${stat.bg} rounded-xl p-4 text-left hover:shadow-md transition-all ${
              (statusFilter === 'all' && stat.label === 'Semua') ||
              statusFilter === stat.label.toLowerCase()
                ? 'ring-2 ring-primary-500'
                : ''
            }`}
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-warm-500 mt-1">{stat.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={20} />
          <input
            type="text"
            placeholder="Cari nomor order atau nama customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-warm-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-warm-200 rounded-xl text-sm"
          >
            <option value="all">Semua Tipe</option>
            <option value="dine_in">Dine In</option>
            <option value="takeaway">Takeaway</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-white border border-warm-200 rounded-xl text-sm"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="highest">Harga Tertinggi</option>
            <option value="lowest">Harga Terendah</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {orders?.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="card-premium p-4 hover:shadow-elevated transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-bold text-warm-900">#{order.order_number}</p>
                  <p className="text-sm text-warm-500">{order.customer_name}</p>
                </div>
                <div className="hidden md:block">
                  <span className="text-xs px-2 py-1 bg-warm-100 rounded-full capitalize">
                    {order.order_type === 'dine_in' ? 'Dine In' : 'Takeaway'}
                  </span>
                </div>
                {order.tables?.table_number && (
                  <div className="hidden md:flex items-center gap-1 text-sm text-warm-500">
                    <span>🪑</span>
                    <span>Meja {order.tables.table_number}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="font-bold text-warm-900">
                    {formatCurrency(order.total_amount)}
                  </p>
                  <p className="text-xs text-warm-400">
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: id })}
                  </p>
                </div>
                {getStatusBadge(order.status)}
                <div className="flex gap-2">
                  {getStatusActions(order)}
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Eye}
                    onClick={() => handleViewDetail(order)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {orders?.length === 0 && (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-warm-300 mb-4" />
            <h3 className="text-lg font-bold text-warm-700 mb-1">Tidak ada pesanan</h3>
            <p className="text-warm-500">Belum ada pesanan yang masuk</p>
          </div>
        )}
      </motion.div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={`Order #${selectedOrder?.order_number}`}
        size="xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-xs text-warm-500">Customer</p>
                <p className="font-bold text-warm-900">{selectedOrder.customer_name}</p>
                <p className="text-sm text-warm-600">{selectedOrder.customer_phone}</p>
              </div>
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-xs text-warm-500">Status</p>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-xs text-warm-500">Tipe</p>
                <p className="font-medium capitalize">{selectedOrder.order_type.replace('_', ' ')}</p>
              </div>
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-xs text-warm-500">Meja</p>
                <p className="font-medium">{selectedOrder.tables?.table_number || '-'}</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-bold text-warm-900 mb-4">Item Pesanan</h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-warm-50 rounded-xl">
                    <img
                      src={item.menus?.image_url || '/placeholder-food.jpg'}
                      alt={item.menus?.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-warm-900">{item.menus?.name}</p>
                      <p className="text-sm text-warm-500">
                        {item.quantity}x @ {formatCurrency(item.price)}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-warm-400 mt-1">Note: {item.notes}</p>
                      )}
                    </div>
                    <p className="font-bold text-warm-900">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total & Payment */}
            <div className="flex justify-between items-center border-t border-warm-100 pt-4">
              <div>
                <p className="text-sm text-warm-500">Total Pembayaran</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(selectedOrder.total_amount)}
                </p>
              </div>
              {selectedOrder.payment && (
                <div className="text-right">
                  <p className="text-sm text-warm-500 capitalize">
                    {selectedOrder.payment.payment_method}
                  </p>
                  {selectedOrder.payment.cash_received && (
                    <p className="text-sm text-warm-600">
                      Bayar: {formatCurrency(selectedOrder.payment.cash_received)}
                    </p>
                  )}
                  {selectedOrder.payment.change_amount > 0 && (
                    <p className="text-sm text-green-600">
                      Kembali: {formatCurrency(selectedOrder.payment.change_amount)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="p-4 bg-yellow-50 rounded-xl">
                <p className="text-sm font-medium text-yellow-700">Catatan:</p>
                <p className="text-sm text-yellow-800">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-warm-100">
              {getStatusActions(selectedOrder)}
              <Button
                variant="outline"
                icon={Printer}
                onClick={handlePrintInvoice}
              >
                Cetak Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}