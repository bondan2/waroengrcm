import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Banknote,
  Eye,
  Download,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function Payments() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['payments', filter],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          orders(
            order_number,
            customer_name,
            order_type,
            table_id,
            tables(table_number)
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      return data || [];
    },
  });

  useRealtime('payments', () => {
    refetch();
  });

  const handleVerifyPayment = async (paymentId) => {
    try {
      await supabase
        .from('payments')
        .update({
          status: 'verified',
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      toast.success('Pembayaran berhasil diverifikasi');
      refetch();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Gagal verifikasi pembayaran');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
      verified: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Verified' },
      completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
      failed: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
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
            Manajemen Pembayaran
          </h1>
          <p className="text-warm-500 mt-1">
            Kelola dan verifikasi pembayaran pelanggan
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={20} />
          <input
            type="text"
            placeholder="Cari pembayaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-warm-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'verified', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                filter === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'
              }`}
            >
              {status === 'all' ? 'Semua' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
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
                  Order
                </th>
                <th className="text-left p-4 text-sm font-medium text-warm-600">
                  Customer
                </th>
                <th className="text-left p-4 text-sm font-medium text-warm-600">
                  Metode
                </th>
                <th className="text-right p-4 text-sm font-medium text-warm-600">
                  Jumlah
                </th>
                <th className="text-center p-4 text-sm font-medium text-warm-600">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-medium text-warm-600">
                  Tanggal
                </th>
                <th className="text-center p-4 text-sm font-medium text-warm-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-warm-50 hover:bg-warm-50/50 transition-colors"
                >
                  <td className="p-4">
                    <p className="font-semibold text-warm-900">
                      #{payment.orders?.order_number}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-warm-900">
                      {payment.orders?.customer_name}
                    </p>
                    {payment.orders?.tables && (
                      <p className="text-xs text-warm-500">
                        Meja {payment.orders.tables.table_number}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {payment.payment_method === 'cash' ? (
                        <Banknote size={16} className="text-green-600" />
                      ) : (
                        <CreditCard size={16} className="text-blue-600" />
                      )}
                      <span className="text-sm capitalize">
                        {payment.payment_method}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <p className="font-semibold text-warm-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    {payment.cash_received && (
                      <p className="text-xs text-warm-500">
                        Cash: {formatCurrency(payment.cash_received)}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-warm-600">
                      {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: id })}
                    </p>
                    <p className="text-xs text-warm-400">
                      {format(new Date(payment.created_at), 'HH:mm')}
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="success"
                          icon={CheckCircle}
                          onClick={() => handleVerifyPayment(payment.id)}
                        >
                          Verifikasi
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Eye}
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDetail(true);
                        }}
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {payments?.length === 0 && (
          <div className="text-center py-12">
            <CreditCard size={48} className="mx-auto text-warm-300 mb-4" />
            <p className="text-warm-500">Belum ada pembayaran</p>
          </div>
        )}
      </motion.div>

      {/* Payment Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Detail Pembayaran"
        size="md"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-sm text-warm-500">Order Number</p>
                <p className="font-bold text-warm-900">
                  #{selectedPayment.orders?.order_number}
                </p>
              </div>
              <div className="p-4 bg-warm-50 rounded-xl">
                <p className="text-sm text-warm-500">Status</p>
                {getStatusBadge(selectedPayment.status)}
              </div>
            </div>

            <div className="p-4 bg-warm-50 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-warm-500">Metode</span>
                <span className="font-medium capitalize">{selectedPayment.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-500">Jumlah</span>
                <span className="font-bold text-primary-600">
                  {formatCurrency(selectedPayment.amount)}
                </span>
              </div>
              {selectedPayment.cash_received && (
                <>
                  <div className="flex justify-between">
                    <span className="text-warm-500">Uang Diterima</span>
                    <span>{formatCurrency(selectedPayment.cash_received)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">Kembalian</span>
                    <span>{formatCurrency(selectedPayment.change_amount)}</span>
                  </div>
                </>
              )}
            </div>

            {selectedPayment.qris_proof_url && (
              <div>
                <p className="text-sm font-medium text-warm-700 mb-2">
                  Bukti Pembayaran QRIS
                </p>
                <img
                  src={selectedPayment.qris_proof_url}
                  alt="QRIS Proof"
                  className="w-full rounded-xl"
                />
              </div>
            )}

            {selectedPayment.status === 'pending' && (
              <Button
                variant="success"
                icon={CheckCircle}
                onClick={() => {
                  handleVerifyPayment(selectedPayment.id);
                  setShowDetail(false);
                }}
                className="w-full"
              >
                Verifikasi Pembayaran
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}