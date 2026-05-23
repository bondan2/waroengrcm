import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  DollarSign,
  Coffee,
  Package,
  Table2,
  Activity,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Star,
  Clock,
  Target,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import { formatCurrency } from '../../lib/utils';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import Button from '../../components/ui/Button';
import { SkeletonChart } from '../../components/ui/Skeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function AdminDashboard() {
  const [period, setPeriod] = useState('today');
  const [realtimeStats, setRealtimeStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    activeTables: 0,
    totalMenus: 0,
  });

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard', period],
    queryFn: async () => {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = startOfMonth(now);
          break;
        default:
          startDate = new Date(now.setHours(0, 0, 0, 0));
      }

      // Get orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString());

      // Get payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());

      // Get tables
      const { data: tables } = await supabase
        .from('tables')
        .select('*');

      // Get menus
      const { count: totalMenus } = await supabase
        .from('menus')
        .select('*', { count: 'exact', head: true });

      // Get unique customers
      const uniqueCustomers = new Set(orders?.map((o) => o.customer_phone).filter(Boolean)).size;

      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Revenue by hour
      const revenueByHour = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        revenue: payments
          ?.filter((p) => new Date(p.created_at).getHours() === i)
          .reduce((sum, p) => sum + p.amount, 0) || 0,
        orders: orders?.filter((o) => new Date(o.created_at).getHours() === i).length || 0,
      }));

      // Order types distribution
      const orderTypes = [
        {
          name: 'Dine In',
          value: orders?.filter((o) => o.order_type === 'dine_in').length || 0,
        },
        {
          name: 'Takeaway',
          value: orders?.filter((o) => o.order_type.includes('takeaway')).length || 0,
        },
      ];

      // Top selling menus
      const { data: topMenus } = await supabase
        .from('order_items')
        .select(`
          quantity,
          menus(name, price)
        `)
        .gte('created_at', startDate.toISOString());

      const menuSales = topMenus?.reduce((acc, item) => {
        const menuName = item.menus?.name;
        if (menuName) {
          acc[menuName] = (acc[menuName] || 0) + item.quantity;
        }
        return acc;
      }, {});

      const topSellingMenus = Object.entries(menuSales || {})
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Payment methods
      const paymentMethods = [
        {
          name: 'Cash',
          value: payments?.filter((p) => p.payment_method === 'cash').length || 0,
        },
        {
          name: 'QRIS',
          value: payments?.filter((p) => p.payment_method === 'qris').length || 0,
        },
      ];

      setRealtimeStats({
        totalRevenue,
        totalOrders,
        totalCustomers: uniqueCustomers,
        averageOrderValue: avgOrderValue,
        activeTables: tables?.filter((t) => t.status === 'occupied').length || 0,
        totalMenus: totalMenus || 0,
      });

      return {
        revenueByHour,
        orderTypes,
        topSellingMenus,
        paymentMethods,
        recentOrders: orders?.slice(0, 10) || [],
      };
    },
    refetchInterval: 30000,
  });

  // Realtime updates
  useRealtime('orders', () => {
    // Refresh dashboard data
  });

  useRealtime('payments', () => {
    // Refresh revenue data
  });

  const statsCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(realtimeStats.totalRevenue),
      icon: DollarSign,
      change: '+15.3%',
      trend: 'up',
      color: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50',
    },
    {
      title: 'Total Orders',
      value: realtimeStats.totalOrders,
      icon: ShoppingBag,
      change: '+12.5%',
      trend: 'up',
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
    },
    {
      title: 'Pelanggan Unik',
      value: realtimeStats.totalCustomers,
      icon: Users,
      change: '+8.2%',
      trend: 'up',
      color: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-50',
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(realtimeStats.averageOrderValue),
      icon: Target,
      change: '+5.7%',
      trend: 'up',
      color: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50',
    },
    {
      title: 'Meja Aktif',
      value: realtimeStats.activeTables,
      icon: Table2,
      change: 'Real-time',
      trend: 'neutral',
      color: 'from-red-500 to-pink-500',
      bg: 'bg-red-50',
    },
    {
      title: 'Total Menu',
      value: realtimeStats.totalMenus,
      icon: Coffee,
      change: 'Active',
      trend: 'neutral',
      color: 'from-teal-500 to-green-500',
      bg: 'bg-teal-50',
    },
  ];

  const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];
  const PAYMENT_COLORS = ['#10b981', '#3b82f6'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonChart key={i} />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
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
            Admin Dashboard
          </h1>
          <p className="text-warm-500 mt-1">
            Overview bisnis dan analytics realtime
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-warm-200 rounded-xl">
            <Calendar size={18} className="text-warm-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-warm-700"
            >
              <option value="today">Hari Ini</option>
              <option value="yesterday">Kemarin</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
            </select>
          </div>
          <Button icon={Download} variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="card-premium p-6 relative overflow-hidden"
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 rounded-bl-full`}
            />
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${stat.bg} rounded-xl`}>
                <stat.icon
                  size={24}
                  className={stat.color.split(' ')[1].replace('to-', 'text-')}
                />
              </div>
              {stat.trend === 'up' && (
                <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <ArrowUp size={16} />
                  {stat.change}
                </div>
              )}
              {stat.trend === 'down' && (
                <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                  <ArrowDown size={16} />
                  {stat.change}
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-warm-500 mb-1">
              {stat.title}
            </h3>
            <p className="text-2xl font-bold text-warm-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card-premium p-6"
        >
          <h2 className="text-xl font-bold text-warm-900 mb-6">
            Revenue & Orders per Jam
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboardData?.revenueByHour}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#78716c' }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: '#78716c' }}
                tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: '#78716c' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : 'Orders',
                ]}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Selling Menus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card-premium p-6"
        >
          <h2 className="text-xl font-bold text-warm-900 mb-6">
            Menu Terlaris
          </h2>
          <div className="space-y-4">
            {dashboardData?.topSellingMenus?.map((menu, index) => (
              <motion.div
                key={menu.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">
                    #{index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-warm-900">{menu.name}</p>
                  <div className="mt-1 bg-warm-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          (menu.quantity /
                            dashboardData.topSellingMenus[0].quantity) *
                          100
                        }%`,
                      }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className="h-full bg-primary-500 rounded-full"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-warm-900">{menu.quantity}</p>
                  <p className="text-xs text-warm-500">terjual</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Order Types Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card-premium p-6"
        >
          <h2 className="text-xl font-bold text-warm-900 mb-6">
            Distribusi Tipe Pesanan
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData?.orderTypes}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {dashboardData?.orderTypes?.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '12px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="card-premium p-6"
        >
          <h2 className="text-xl font-bold text-warm-900 mb-6">
            Metode Pembayaran
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData?.paymentMethods}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#78716c' }} />
              <YAxis tick={{ fontSize: 12, fill: '#78716c' }} />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {dashboardData?.paymentMethods?.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="card-premium p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-warm-900">
            Pesanan Terbaru
          </h2>
          <Button variant="ghost" size="sm">
            Lihat Semua
          </Button>
        </div>

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
                  Tipe
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
              </tr>
            </thead>
            <tbody>
              {dashboardData?.recentOrders?.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-warm-50 hover:bg-warm-50/50"
                >
                  <td className="p-4">
                    <span className="font-semibold text-warm-900">
                      #{order.order_number}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-medium">{order.customer_name}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-sm capitalize">
                      {order.order_type === 'dine_in' ? 'Dine In' : 'Takeaway'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-semibold">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : order.status === 'processing'
                          ? 'bg-blue-100 text-blue-700'
                          : order.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {order.status === 'pending'
                        ? 'Pending'
                        : order.status === 'processing'
                        ? 'Diproses'
                        : order.status === 'completed'
                        ? 'Selesai'
                        : 'Cancel'}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-warm-600">
                      {format(new Date(order.created_at), 'HH:mm')}
                    </p>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}