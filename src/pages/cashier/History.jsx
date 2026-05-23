import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Calendar,
  Download,
  Filter,
  Eye,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatCurrency } from '../../lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

export default function History() {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const pageSize = 20;

  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date() };
      case 'yesterday':
        const yesterday = subDays(new Date(), 1);
        return { start: new Date(yesterday.setHours(0, 0, 0, 0)), end: new Date(yesterday.setHours(23, 59, 59)) };
      case 'week':
        return { start: subDays(new Date(), 7), end: new Date() };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date() };
    }
  };

  const { start, end } = getDateRange();

  const { data, isLoading } = useQuery({
    queryKey: ['transaction-history', dateFilter, search, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          tables(table_number),
          payments(payment_method, amount, cash_received, change_amount, status),
          order_items(count)
        `, { count: 'exact' })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%`);
      }

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data: orders, count } = await query.range(from, to);
      return { orders: orders || [], total: count || 0 };
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  // Calculate summary
  const totalRevenue = data?.orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
  const completedOrders = data?.orders?.filter(o => o.status === 'completed').length || 0;
  const cancelledOrders = data?.orders?.filter(o => o.status === 'cancelled').length || 0;

  const handleExport = () => {
    if (!data?.orders) return;
    
    const headers = ['Order Number', 'Customer', 'Tipe', 'Total', 'Status', 'Pembayaran', 'Tanggal'];
    const rows = data.orders.map(order => [
      order.order_number,
      order.customer_name,
      order.order_type,
      order.total_amount,
      order.status,
      order.payments?.[0]?.payment_method || '-',
      format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            Riwayat Transaksi
          </h1>
          <p className="text-warm-500 mt-1">
            Lihat dan export riwayat semua transaksi
          </p>
        </div>
        <Button icon={Download} variant="outline" onClick={handleExport}>
          Export CSV
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 rounded-xl">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
          <p className="text-sm text-warm-500">Total Revenue</p>
          <p className="text-2xl font-bold text-warm-900 mt-1">
            {formatCurrency(totalRevenue)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <ShoppingBag size={24} className="text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-warm-500">Transaksi Selesai</p>
          <p className="text-2xl font-bold text-warm-900 mt-1">{completedOrders}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-premium p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-50 rounded-xl">
              <TrendingUp size={24} className="text-red-600" />
            </div>
          </div>
          <p className="text-sm text-warm-500">Dibatalkan</p>
          <p className="text-2xl font-bold text-warm-900 mt-1">{cancelledOrders}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={20} />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-warm-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          />
        </div>
        <select
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-3 bg-white border border-warm-200 rounded-xl text-sm"
        >
          <option value="today">Hari Ini</option>
          <option value="yesterday">Kemarin</option>
          <option value="week">7 Hari Terakhir</option>
          <option value="month">Bulan Ini</option>
        </select>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-warm-50 border-b border-warm-100">
                <th className="text-left p-4 text-sm font-medium text-warm-600">Order</th>
                <th className="text-left p-4 text-sm font-medium text-warm-600">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-warm-600">Tipe</th>
                <th className="text-right p-4 text-sm font-medium text-warm-600">Total</th>
                <th className="text-center p-4 text-sm font-medium text-warm-600">Status</th>
                <th className="text-left p-4 text-sm font-medium text-warm-600">Pembayaran</th>
                <th className="text-left p-4 text-sm font-medium text-warm-600">Tanggal</th>
                <th className="text-center p-4 text-sm font-medium text-warm-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data?.orders?.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-warm-50 hover:bg-warm-50/50"
                >
                  <td className="p-4 font-semibold text-warm-900">
                    #{order.order_number}
                  </td>
                  <td className="p-4">
                    <p className="font-medium">{order.customer_name}</p>
                    {order.tables?.table_number && (
                      <p className="text-xs text-warm-500">Meja {order.tables.table_number}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm capitalize">
                      {order.order_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right font-semibold">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status === 'completed' ? 'Selesai' :
                       order.status === 'cancelled' ? 'Cancel' : order.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm capitalize">
                      {order.payments?.[0]?.payment_method || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-warm-600">
                      {format(new Date(order.created_at), 'dd MMM yyyy', { locale: id })}
                    </p>
                    <p className="text-xs text-warm-400">
                      {format(new Date(order.created_at), 'HH:mm')}
                    </p>
                  </td>
                  <td className="p-4 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Eye}
                      onClick={() => {
                        setSelectedTransaction(order);
                        setShowDetail(true);
                      }}
                    />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-warm-100">
            <p className="text-sm text-warm-500">
              Menampilkan {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, data?.total || 0)} dari {data?.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-warm-50 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-warm-50 rounded-lg disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={`Transaksi #${selectedTransaction?.order_number}`}
        size="md"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-xs text-warm-500">Customer</p>
                <p className="font-bold">{selectedTransaction.customer_name}</p>
              </div>
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-xs text-warm-500">Tanggal</p>
                <p className="font-bold">
                  {format(new Date(selectedTransaction.created_at), 'dd MMM yyyy', { locale: id })}
                </p>
                <p className="text-sm text-warm-500">
                  {format(new Date(selectedTransaction.created_at), 'HH:mm')}
                </p>
              </div>
            </div>

            <div className="p-4 bg-warm-50 rounded-xl">
              <div className="flex justify-between mb-2">
                <span className="text-warm-500">Total</span>
                <span className="font-bold text-primary-600">
                  {formatCurrency(selectedTransaction.total_amount)}
                </span>
              </div>
              {selectedTransaction.payments?.[0] && (
                <>
                  <div className="flex justify-between mb-2">
                    <span className="text-warm-500">Metode</span>
                    <span className="capitalize">
                      {selectedTransaction.payments[0].payment_method}
                    </span>
                  </div>
                  {selectedTransaction.payments[0].cash_received > 0 && (
                    <>
                      <div className="flex justify-between mb-2">
                        <span className="text-warm-500">Dibayar</span>
                        <span>{formatCurrency(selectedTransaction.payments[0].cash_received)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-warm-500">Kembali</span>
                        <span className="text-green-600">
                          {formatCurrency(selectedTransaction.payments[0].change_amount)}
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}