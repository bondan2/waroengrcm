import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  ChefHat,
  Package,
  Truck,
  MapPin,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import { formatCurrency } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const statusSteps = [
  { key: 'pending', label: 'Menunggu', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { key: 'processing', label: 'Diproses', icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'ready', label: 'Siap Diambil', icon: Package, color: 'text-green-500', bg: 'bg-green-50' },
  { key: 'completed', label: 'Selesai', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { key: 'cancelled', label: 'Dibatalkan', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
];

export default function Tracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            menus(name, image_url)
          ),
          payments(*),
          tables(table_number)
        `)
        .eq('id', orderId)
        .single();
      return orderData;
    },
  });

  useEffect(() => {
    if (data) setOrder(data);
  }, [data]);

  useRealtime('orders', (payload) => {
    if (payload.new.id === orderId) {
      setOrder((prev) => ({ ...prev, ...payload.new }));
    }
  });

  const getStatusIndex = (status) => {
    return statusSteps.findIndex((step) => step.key === status);
  };

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-warm-500">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto text-warm-300 mb-4" />
          <h3 className="text-xl font-bold text-warm-700 mb-2">Pesanan Tidak Ditemukan</h3>
          <Link to="/menu" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={18} />
            Kembali ke Menu
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="pt-20 min-h-screen bg-cream-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/menu" className="inline-flex items-center gap-2 text-warm-600 hover:text-warm-900 mb-8">
          <ArrowLeft size={20} />
          <span>Kembali ke Menu</span>
        </Link>

        {/* Order Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-warm-900">Pesanan #{order.order_number}</h1>
              <p className="text-warm-500 text-sm mt-1">
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: id })}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${
              statusSteps[currentStatusIndex]?.bg
            } ${statusSteps[currentStatusIndex]?.color}`}>
              {statusSteps[currentStatusIndex]?.label}
            </div>
          </div>

          {order.order_type === 'dine_in' && order.tables && (
            <div className="flex items-center gap-2 text-warm-600">
              <MapPin size={18} />
              <span>Meja {order.tables.table_number}</span>
            </div>
          )}
        </motion.div>

        {/* Progress Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-6 mb-6"
        >
          <h2 className="text-lg font-bold text-warm-900 mb-6">Status Pesanan</h2>
          
          <div className="relative">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              
              return (
                <div key={step.key} className="flex items-start mb-8 last:mb-0">
                  <div className="flex flex-col items-center mr-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.2 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? step.key === 'cancelled'
                            ? 'bg-red-100'
                            : 'bg-primary-100'
                          : 'bg-warm-100'
                      }`}
                    >
                      <step.icon
                        size={20}
                        className={
                          isCompleted
                            ? step.key === 'cancelled'
                              ? 'text-red-500'
                              : 'text-primary-600'
                            : 'text-warm-400'
                        }
                      />
                    </motion.div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`w-0.5 h-12 mt-2 ${
                          index < currentStatusIndex
                            ? 'bg-primary-300'
                            : 'bg-warm-200'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className={`font-semibold ${
                      isCompleted ? 'text-warm-900' : 'text-warm-400'
                    }`}>
                      {step.label}
                    </h3>
                    {isCurrent && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 mt-1"
                      >
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                        <span className="text-sm text-primary-600 font-medium">
                          Sedang diproses...
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-premium p-6"
        >
          <h2 className="text-lg font-bold text-warm-900 mb-4">Detail Pesanan</h2>
          
          <div className="space-y-4">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex gap-4">
                <img
                  src={item.menus?.image_url || '/placeholder-food.jpg'}
                  alt={item.menus?.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-warm-900">{item.menus?.name}</h4>
                  <p className="text-sm text-warm-500">{item.quantity}x @ {formatCurrency(item.price)}</p>
                  {item.notes && (
                    <p className="text-xs text-warm-400 mt-1">Catatan: {item.notes}</p>
                  )}
                </div>
                <p className="font-semibold text-warm-900">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-warm-100 mt-6 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-warm-500">Subtotal</span>
              <span>{formatCurrency(order.total_amount / 1.11)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-warm-500">PPN 11%</span>
              <span>{formatCurrency(order.total_amount - order.total_amount / 1.11)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-warm-100">
              <span>Total</span>
              <span className="text-primary-600">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}