import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Calculator,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  FileText,
  Download,
  Printer,
  Clock,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function Closing() {
  const { user, profile } = useAuthStore();
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [closingData, setClosingData] = useState(null);

  const { data: shiftData, isLoading } = useQuery({
    queryKey: ['cashier-closing'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Get today's completed cash payments
      const { data: cashPayments } = await supabase
        .from('payments')
        .select('amount, cash_received, change_amount')
        .eq('payment_method', 'cash')
        .eq('status', 'completed')
        .gte('created_at', today);

      // Get today's QRIS payments
      const { data: qrisPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_method', 'qris')
        .eq('status', 'completed')
        .gte('created_at', today);

      // Get total orders
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const totalCash = cashPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalQRIS = qrisPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      return {
        totalCash,
        totalQRIS,
        totalRevenue: totalCash + totalQRIS,
        totalTransactions: totalOrders || 0,
        cashTransactions: cashPayments?.length || 0,
        qrisTransactions: qrisPayments?.length || 0,
      };
    },
  });

  const difference = actualCash
    ? Number(actualCash) - (shiftData?.totalCash || 0)
    : 0;

  const handleClosing = async () => {
    try {
      const { data, error } = await supabase
        .from('cashier_closings')
        .insert({
          cashier_id: user.id,
          shift_start: new Date().setHours(0, 0, 0, 0),
          shift_end: new Date().toISOString(),
          initial_cash: 0,
          expected_cash: shiftData.totalCash,
          actual_cash: Number(actualCash),
          difference: difference,
          total_transactions: shiftData.totalTransactions,
          total_cash_payments: shiftData.totalCash,
          total_qris_payments: shiftData.totalQRIS,
          status: 'closed',
          notes: notes,
        })
        .select()
        .single();

      if (error) throw error;

      setClosingData(data);
      toast.success('Closing kasir berhasil!');
      setShowConfirm(false);
    } catch (error) {
      console.error('Error closing cashier:', error);
      toast.error('Gagal melakukan closing kasir');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-warm-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (closingData) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-premium p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-warm-900 mb-2">
            Closing Kasir Berhasil
          </h2>
          <p className="text-warm-500 mb-6">
            Shift kasir telah ditutup pada{' '}
            {format(new Date(), 'HH:mm, dd MMMM yyyy', { locale: id })}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-warm-50 rounded-xl">
              <p className="text-sm text-warm-500">Total Transaksi</p>
              <p className="text-2xl font-bold text-warm-900">
                {shiftData.totalTransactions}
              </p>
            </div>
            <div className="p-4 bg-warm-50 rounded-xl">
              <p className="text-sm text-warm-500">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(shiftData.totalRevenue)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button icon={Printer} variant="outline" onClick={() => window.print()}>
              Cetak Laporan
            </Button>
            <Button icon={Download} variant="primary">
              Download PDF
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-warm-900 font-display">
          Closing Kasir
        </h1>
        <p className="text-warm-500 mt-1">
          Tutup shift kasir dan hitung selisih kas
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-warm-500">Total Cash</p>
              <p className="text-2xl font-bold text-warm-900">
                {formatCurrency(shiftData?.totalCash || 0)}
              </p>
            </div>
          </div>
          <p className="text-sm text-warm-400">
            {shiftData?.cashTransactions || 0} transaksi
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-premium p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <CreditCard size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-warm-500">Total QRIS</p>
              <p className="text-2xl font-bold text-warm-900">
                {formatCurrency(shiftData?.totalQRIS || 0)}
              </p>
            </div>
          </div>
          <p className="text-sm text-warm-400">
            {shiftData?.qrisTransactions || 0} transaksi
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-premium p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-50 rounded-xl">
              <FileText size={24} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-warm-500">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(shiftData?.totalRevenue || 0)}
              </p>
            </div>
          </div>
          <p className="text-sm text-warm-400">
            {shiftData?.totalTransactions || 0} total transaksi
          </p>
        </motion.div>
      </div>

      {/* Cash Verification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-premium p-6"
      >
        <h2 className="text-xl font-bold text-warm-900 mb-6">
          Verifikasi Kas Fisik
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Jumlah Kas di Sistem
            </label>
            <div className="p-4 bg-warm-50 rounded-xl">
              <p className="text-3xl font-bold text-warm-900">
                {formatCurrency(shiftData?.totalCash || 0)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Jumlah Kas Fisik
            </label>
            <input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              className="input-modern text-3xl font-bold"
              placeholder="Masukkan jumlah kas fisik"
            />
          </div>
        </div>

        {actualCash && (
          <div className={`mt-6 p-4 rounded-xl ${
            difference === 0
              ? 'bg-green-50'
              : difference > 0
              ? 'bg-green-50'
              : 'bg-red-50'
          }`}>
            <div className="flex items-center gap-3">
              {difference === 0 ? (
                <CheckCircle size={24} className="text-green-600" />
              ) : (
                <AlertCircle size={24} className={difference > 0 ? 'text-green-600' : 'text-red-600'} />
              )}
              <div>
                <p className="font-semibold">
                  {difference === 0
                    ? 'Kas sesuai!'
                    : difference > 0
                    ? `Kelebihan: ${formatCurrency(difference)}`
                    : `Kekurangan: ${formatCurrency(Math.abs(difference))}`}
                </p>
                <p className="text-sm opacity-75">
                  Selisih antara kas fisik dan sistem
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <label className="block text-sm font-medium text-warm-700 mb-2">
            Catatan Closing
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="input-modern resize-none"
            placeholder="Tambahkan catatan untuk closing hari ini (opsional)"
          />
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            variant="outline"
            icon={Printer}
            onClick={() => window.print()}
          >
            Cetak Draft
          </Button>
          <Button
            variant="primary"
            icon={CheckCircle}
            onClick={() => setShowConfirm(true)}
            disabled={!actualCash}
          >
            Tutup Shift
          </Button>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Konfirmasi Closing"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">
                  Pastikan data sudah benar
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Setelah closing, data tidak dapat diubah kembali. Pastikan semua
                  transaksi sudah tercatat dengan benar.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-warm-500">Total Transaksi</span>
              <span className="font-medium">{shiftData?.totalTransactions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-500">Kas Sistem</span>
              <span className="font-medium">{formatCurrency(shiftData?.totalCash || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-500">Kas Fisik</span>
              <span className="font-medium">{formatCurrency(Number(actualCash))}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-warm-100">
              <span className="font-semibold">Selisih</span>
              <span className={`font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(difference))}
                {difference > 0 ? ' (lebih)' : difference < 0 ? ' (kurang)' : ''}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 px-4 py-3 border-2 border-warm-200 rounded-xl font-semibold hover:bg-warm-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleClosing}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-xl transition-colors"
            >
              Ya, Tutup Shift
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}