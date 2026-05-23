import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  Clock,
  Table2,
  ArrowUp,
  ArrowDown,
  Activity,
  Coffee,
  Package,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import { formatCurrency } from '../../lib/utils';
import { SkeletonChart, SkeletonTable } from '../../components/ui/Skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function CashierDashboard() {
  const [realtimeStats, setRealtimeStats] = useState({
    todayRevenue: 0,
    totalOrders: 0,
    activeTables: 0,
    pendingOrders: 0,
    takeawayQueue: 0,
  });

  const { data: todayStats, isLoading } = useQuery({
    queryKey: ['cashier-dashboard'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today);

      // Get active tables
      const { data: tables } = await supabase
        .from('tables')
        .select('*')
        .neq('status', 'available');

      // Get today's payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', today)
        .eq('status', 'completed');

      const revenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      
      const stats = {
        todayRevenue: revenue,
        totalOrders: orders?.length || 0,
        activeTables: tables?.length || 0,
        pendingOrders: orders?.filter((o) => o.status === 'pending').length || 0,
        takeawayQueue: orders?.filter((o) => o.order_type.includes('takeaway') && o.status === 'processing').length || 0,
      };

      setRealtimeStats(stats);
      return { orders, tables, payments, stats };
    },
    refetchInterval: 30000,
  });

  // Realtime updates
  useRealtime('orders', (payload) => {
    const { data: stats } = useQuery.getQueryData(['cashier-dashboard']);
    if (stats) {
      // Update stats in realtime
    }
  });

  useRealtime('tables', () => {
    // Refresh table stats
  });

  useRealtime('payments', () => {
    // Refresh revenue stats
  });

  const statsCards = [
    {
      title: 'Pendapatan Hari Ini',
      value: formatCurrency(realtimeStats.todayRevenue),
      icon: DollarSign,
      change: '+12.5%',
      trend: 'up',
      color: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50',
    },
    {
      title: 'Total Pesanan',
      value: realtimeStats.totalOrders,
      icon: ShoppingBag,
      change: '+8.2%',
      trend: 'up',
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
    },
    {
      title: 'Meja Aktif',
      value: realtimeStats.activeTables,
      icon: Table2,
      change: 'Real-time',
      trend: 'neutral',
      color: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50',
    },
    {
      title: 'Pesanan Pending',
      value: realtimeStats.pendingOrders,
      icon: Clock,
      change: 'Perlu diproses',
      trend: 'warning',
      color: 'from-red-500 to-pink-500',
      bg: 'bg-red-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonChart key={i} />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonTable />
        </div>
      </div>
    );
  }

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
            Dashboard Kasir
          </h1>
          <p className="text-warm-500 mt-1">
            {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700">Live</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="card-premium p-6 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
            
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${stat.bg} rounded-xl`}>
                <stat.icon size={24} className={stat.color.split(' ')[1].replace('to-', 'text-')} />
              </div>
              {stat.trend === 'up' && (
                <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <ArrowUp size={16} />
                  {stat.change}
                </div>
              )}
            </div>
            
            <h3 className="text-sm font-medium text-warm-500 mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-warm-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders & Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-premium p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-warm-900">Pesanan Terbaru</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Lihat Semua
            </button>
          </div>

          <div className="space-y-4">
            {todayStats?.orders?.slice(0, 5).map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-warm-50 rounded-xl hover:bg-warm-100 transition-colors"
              >
                <div>
                  <p className="font-semibold text-warm-900">#{order.order_number}</p>
                  <p className="text-sm text-warm-500">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-warm-900">
                    {formatCurrency(order.total_amount)}
                  </p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {order.status === 'pending' ? 'Pending' :
                     order.status === 'processing' ? 'Diproses' :
                     order.status === 'completed' ? 'Selesai' : 'Cancel'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-premium p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-warm-900">Aktivitas Terkini</h2>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-warm-900">
                    Pesanan baru dari Meja {index + 1}
                  </p>
                  <p className="text-xs text-warm-400 mt-1">
                    {format(new Date(Date.now() - index * 300000), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}