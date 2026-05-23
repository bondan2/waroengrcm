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
  MoreVertical,
  Download,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function ManageOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, typeFilter, search],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          tables(table_number),
          payments(*)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('order_type', typeFilter);
      }

      if (search) {
        query = query.or(
          `order_number.ilike.%${search}%,customer_name.ilike.%${search}%`
        );
      }

      const { data } = await query;
      return data || [];
    },
  });

  useRealtime('orders', () => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Status order berhasil diupdate');
    },
    onError: (error) => {
      toast.error('Gagal mengupdate status order');
    },
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      ready: 'bg-green-100 text-green-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
    };

    const labels = {
      pending: 'Pending',
      processing: 'Diproses',
      ready: 'Siap',
      completed: 'Selesai',
      cancelled: 'Cancel',
    };

    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
          badges[status] || badges.pending
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'processing':
        return ChefHat;
      case 'ready':
        return Package;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const handleViewDetail = async (order) => {
    // Fetch order items
    const { data: items } = await supabase
      .from('order_items')
      .select('*, menus(name, price, image_url)')
      .eq('order_id', order.id);

    setSelectedOrder({ ...order, items });
    setShowDetail(true);
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
            Monitor dan kelola semua pesanan
          </p>
        </div>
        <Button icon={Download} variant="outline">
          Export Orders
        </Button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Cari order number atau nama customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-warm-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-warm-200 rounded-xl text-sm"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Diproses</option>
            <option value="ready">Siap</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Cancel</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-warm-200 rounded-xl text-sm"
          >
            <option value="all">Semua Tipe</option>
            <option value="dine_in">Dine In</option>
            <option value="takeaway_waiting">Takeaway Waiting</option>
            <option value="takeaway_pickup">Takeaway Pickup</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-warm-50 border-b border-warm-100">
                <th className="text-left p-4 text-sm font-medium text-warm-600">
                  Order Number
                </th>
                <th className="text-left p-4 text-sm font-medium text-warm-600">
                  Customer
                </th>
                <th className="text-left p-4 text-sm font-medium text-warm-600">
                  Tipe
                </th>
                <th className="text-left p-4 text-sm font-medium text-warm-600">
                  Meja
                </th>
                <th className="text-right p-4 text-sm font-medium text-warm-600">
                  Total
                </th>
                <th className="text-center p-4 text-sm font-medium text-warm-600">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-medium text-warm-600">
                  Waktu
                </th>
                <th className="text-center p-4 text-sm font-medium text-warm-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order, index) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-warm-50 hover:bg-warm-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-semibold text-warm-900">
                        #{order.order_number}
                      </p>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-warm-900">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-warm-500">
                          {order.customer_phone}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm capitalize">
                        {order.order_type === 'dine_in'
                          ? 'Dine In'
                          : order.order_type === 'takeaway_waiting'
                          ? 'Waiting'
                          : 'Pickup'}
                      </span>
                    </td>
                    <td className="p-4">
                      {order.tables?.table_number ? (
                        <span className="text-sm font-medium">
                          Meja {order.tables.table_number}
                        </span>
                      ) : (
                        <span className="text-sm text-warm-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-semibold text-warm-900">
                        {formatCurrency(order.total_amount)}
                      </p>
                      {order.payments?.[0] && (
                        <p className="text-xs text-warm-500">
                          {order.payments[0].payment_method.toUpperCase()}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-warm-600">
                        {format(new Date(order.created_at), 'dd MMM yyyy', {
                          locale: id,
                        })}
                      </p>
                      <p className="text-xs text-warm-400">
                        {format(new Date(order.created_at), 'HH:mm')}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Eye}
                          onClick={() => handleViewDetail(order)}
                        />
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() =>
                              updateOrderStatus.mutate({
                                id: order.id,
                                status: 'processing',
                              })
                            }
                          >
                            Proses
                          </Button>
                        )}
                        {order.status === 'processing' && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              updateOrderStatus.mutate({
                                id: order.id,
                                status: 'ready',
                              })
                            }
                          >
                            Siap
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders?.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-warm-300 mb-4" />
            <p className="text-warm-500">Belum ada pesanan</p>
          </div>
        )}
      </motion.div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={`Order #${selectedOrder?.order_number}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-sm text-warm-500">Customer</p>
                <p className="font-bold text-warm-900">
                  {selectedOrder.customer_name}
                </p>
                <p className="text-sm text-warm-600">
                  {selectedOrder.customer_phone}
                </p>
              </div>
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-sm text-warm-500">Status</p>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-sm text-warm-500">Tipe Pesanan</p>
                <p className="font-medium capitalize">
                  {selectedOrder.order_type.replace('_', ' ')}
                </p>
              </div>
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-sm text-warm-500">Meja</p>
                <p className="font-medium">
                  {selectedOrder.tables?.table_number || '-'}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold text-warm-900 mb-4">
                Item Pesanan
              </h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-warm-50 rounded-xl"
                  >
                    <img
                      src={item.menus?.image_url || '/placeholder-food.jpg'}
                      alt={item.menus?.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-warm-900">
                        {item.menus?.name}
                      </p>
                      <p className="text-sm text-warm-500">
                        {item.quantity}x @ {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-warm-900">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-warm-100 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-warm-900">
                  Total
                </span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatCurrency(selectedOrder.total_amount)}
                </span>
              </div>
            </div>

            {/* Payment Info */}
            {selectedOrder.payments?.[0] && (
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-sm font-medium text-warm-700 mb-2">
                  Informasi Pembayaran
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-warm-500">Metode</span>
                    <span className="font-medium capitalize">
                      {selectedOrder.payments[0].payment_method}
                    </span>
                  </div>
                  {selectedOrder.payments[0].cash_received && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-warm-500">Uang Diterima</span>
                        <span>
                          {formatCurrency(selectedOrder.payments[0].cash_received)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-warm-500">Kembalian</span>
                        <span>
                          {formatCurrency(selectedOrder.payments[0].change_amount)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="p-4 bg-yellow-50 rounded-xl">
                <p className="text-sm font-medium text-yellow-700 mb-1">
                  Catatan
                </p>
                <p className="text-sm text-yellow-800">
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-warm-100">
              {selectedOrder.status === 'pending' && (
                <Button
                  variant="primary"
                  icon={CheckCircle}
                  onClick={() => {
                    updateOrderStatus.mutate({
                      id: selectedOrder.id,
                      status: 'processing',
                    });
                    setShowDetail(false);
                  }}
                  className="flex-1"
                >
                  Proses Pesanan
                </Button>
              )}
              {selectedOrder.status === 'processing' && (
                <Button
                  variant="success"
                  icon={Package}
                  onClick={() => {
                    updateOrderStatus.mutate({
                      id: selectedOrder.id,
                      status: 'ready',
                    });
                    setShowDetail(false);
                  }}
                  className="flex-1"
                >
                  Tandai Siap
                </Button>
              )}
              {selectedOrder.status !== 'completed' &&
                selectedOrder.status !== 'cancelled' && (
                  <Button
                    variant="danger"
                    icon={XCircle}
                    onClick={() => {
                      if (window.confirm('Batalkan pesanan ini?')) {
                        updateOrderStatus.mutate({
                          id: selectedOrder.id,
                          status: 'cancelled',
                        });
                        setShowDetail(false);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}