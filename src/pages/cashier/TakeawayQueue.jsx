import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Package,
  CheckCircle,
  User,
  Phone,
  MapPin,
  AlertCircle,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import { useAudio } from '../../hooks/useAudio';
import { formatCurrency } from '../../lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function TakeawayQueue() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const queryClient = useQueryClient();
  const { play } = useAudio();

  const { data: queueOrders, isLoading } = useQuery({
    queryKey: ['takeaway-queue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            quantity,
            menus(name, price)
          ),
          payments(*)
        `)
        .or('order_type.eq.takeaway_waiting,order_type.eq.takeaway_pickup')
        .in('status', ['pending', 'processing', 'ready'])
        .order('created_at', { ascending: true });

      return data || [];
    },
    refetchInterval: 5000,
  });

  useRealtime('orders', (payload) => {
    queryClient.invalidateQueries({ queryKey: ['takeaway-queue'] });
    
    if (payload.eventType === 'UPDATE' && payload.new.status === 'ready') {
      play('orderReady');
      toast.success(`Pesanan #${payload.new.order_number} siap diambil!`, {
        icon: '📦',
        duration: 5000,
      });
    }
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
      queryClient.invalidateQueries({ queryKey: ['takeaway-queue'] });
    },
  });

  const getQueueColor = (status) => {
    switch (status) {
      case 'pending': return 'border-l-yellow-500';
      case 'processing': return 'border-l-blue-500';
      case 'ready': return 'border-l-green-500';
      default: return 'border-l-warm-300';
    }
  };

  const getTimeElapsed = (date) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    return `${hours} jam ${minutes % 60} menit`;
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
            Takeaway Queue
          </h1>
          <p className="text-warm-500 mt-1">
            Antrian pesanan takeaway - realtime monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700">Live Queue</span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { 
            label: 'Menunggu', 
            value: queueOrders?.filter(o => o.status === 'pending').length || 0,
            color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
            icon: Clock,
          },
          { 
            label: 'Diproses', 
            value: queueOrders?.filter(o => o.status === 'processing').length || 0,
            color: 'bg-blue-50 border-blue-200 text-blue-700',
            icon: Package,
          },
          { 
            label: 'Siap Diambil', 
            value: queueOrders?.filter(o => o.status === 'ready').length || 0,
            color: 'bg-green-50 border-green-200 text-green-700',
            icon: CheckCircle,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-xl border-2 p-4 ${stat.color}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={20} />
              <span className="text-sm font-medium">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        <AnimatePresence>
          {queueOrders?.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ delay: index * 0.05 }}
              layout
              className={`card-premium border-l-4 ${getQueueColor(order.status)} p-4 hover:shadow-elevated transition-all cursor-pointer`}
              onClick={() => {
                setSelectedOrder(order);
                setShowDetail(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Queue Number */}
                  <div className="text-center min-w-[60px]">
                    <p className="text-xs text-warm-500">Antrian</p>
                    <p className="text-3xl font-bold text-primary-600">
                      #{index + 1}
                    </p>
                  </div>

                  {/* Order Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-warm-900">
                        {order.customer_name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 bg-warm-100 rounded-full capitalize">
                        {order.order_type === 'takeaway_waiting' ? 'Waiting' : 'Pickup'}
                      </span>
                    </div>
                    <p className="text-sm text-warm-500">
                      #{order.order_number} • {order.order_items?.length || 0} item
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Timer */}
                  <div className="text-right">
                    <p className="text-xs text-warm-400">Waktu tunggu</p>
                    <p className={`font-bold ${
                      order.status === 'ready' ? 'text-green-600' : 'text-warm-700'
                    }`}>
                      {getTimeElapsed(order.created_at)}
                    </p>
                  </div>

                  {/* Total */}
                  <div className="text-right min-w-[100px]">
                    <p className="font-bold text-warm-900">
                      {formatCurrency(order.total_amount)}
                    </p>
                    <p className="text-xs text-warm-400">
                      {order.payments?.[0]?.payment_method?.toUpperCase() || 'Belum bayar'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => updateStatus.mutate({ id: order.id, status: 'processing' })}
                      >
                        Proses
                      </Button>
                    )}
                    {order.status === 'processing' && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => updateStatus.mutate({ id: order.id, status: 'ready' })}
                      >
                        Siap
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button
                        size="sm"
                        variant="success"
                        icon={CheckCircle}
                        onClick={() => {
                          if (window.confirm('Selesaikan pesanan ini?')) {
                            updateStatus.mutate({ id: order.id, status: 'completed' });
                          }
                        }}
                      >
                        Selesai
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 bg-warm-100 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: 
                      order.status === 'pending' ? '25%' :
                      order.status === 'processing' ? '60%' :
                      order.status === 'ready' ? '90%' : '100%'
                  }}
                  className={`h-full rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-500' :
                    order.status === 'processing' ? 'bg-blue-500' :
                    order.status === 'ready' ? 'bg-green-500' : 'bg-emerald-500'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {queueOrders?.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Package size={48} className="mx-auto text-warm-300 mb-4" />
            <h3 className="text-lg font-bold text-warm-700">Queue Kosong</h3>
            <p className="text-warm-500">Tidak ada pesanan takeaway saat ini</p>
          </motion.div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={`Takeaway #${selectedOrder?.order_number}`}
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-warm-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-warm-500 mb-1">
                  <User size={16} />
                  Customer
                </div>
                <p className="font-bold text-warm-900">{selectedOrder.customer_name}</p>
                <p className="text-sm text-warm-600">{selectedOrder.customer_phone}</p>
              </div>
              <div className="p-4 bg-warm-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-warm-500 mb-1">
                  <Clock size={16} />
                  Waktu Tunggu
                </div>
                <p className="font-bold text-warm-900">{getTimeElapsed(selectedOrder.created_at)}</p>
                <p className="text-sm text-warm-600">
                  {format(new Date(selectedOrder.created_at), 'HH:mm', { locale: id })}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-warm-900 mb-2">Item Pesanan</h4>
              <div className="space-y-2">
                {selectedOrder.order_items?.map((item, i) => (
                  <div key={i} className="flex justify-between p-3 bg-warm-50 rounded-xl">
                    <div>
                      <p className="font-medium text-warm-900">{item.menus?.name}</p>
                      <p className="text-sm text-warm-500">{item.quantity}x @ {formatCurrency(item.price)}</p>
                    </div>
                    <p className="font-bold text-warm-900">{formatCurrency(item.quantity * item.price)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-warm-100 pt-4">
              <span className="font-bold text-warm-900">Total</span>
              <span className="text-xl font-bold text-primary-600">
                {formatCurrency(selectedOrder.total_amount)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}