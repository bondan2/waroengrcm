import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Coffee,
  FileText,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatCurrency } from '../../lib/utils';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import Button from '../../components/ui/Button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

export default function Reports() {
  const [dateRange, setDateRange] = useState('week');
  const [reportType, setReportType] = useState('revenue');

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date() };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return {
          start: new Date(yesterday.setHours(0, 0, 0, 0)),
          end: new Date(yesterday.setHours(23, 59, 59, 999)),
        };
      case 'week':
        return { start: subDays(now, 7), end: new Date() };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        };
      default:
        return { start: subDays(now, 7), end: new Date() };
    }
  };

  const { start, end } = getDateRange();

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', dateRange, reportType],
    queryFn: async () => {
      // Get orders in date range
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Get payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Get order items with menu details
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          subtotal,
          menus(name, category_id, categories(name))
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Revenue by day
      const revenueByDay = [];
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dayPayments = payments?.filter(
          (p) => format(new Date(p.created_at), 'yyyy-MM-dd') === dateStr
        );
        revenueByDay.push({
          date: format(currentDate, 'dd MMM', { locale: id }),
          revenue: dayPayments?.reduce((sum, p) => sum + p.amount, 0) || 0,
          orders: orders?.filter(
            (o) => format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr
          ).length || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Sales by category
      const categorySales = {};
      orderItems?.forEach((item) => {
        const categoryName = item.menus?.categories?.name || 'Uncategorized';
        categorySales[categoryName] =
          (categorySales[categoryName] || 0) + item.subtotal;
      });

      const salesByCategory = Object.entries(categorySales).map(
        ([name, value]) => ({ name, value })
      );

      // Payment methods summary
      const cashPayments = payments?.filter((p) => p.payment_method === 'cash') || [];
      const qrisPayments = payments?.filter((p) => p.payment_method === 'qris') || [];

      // Order type summary
      const dineInOrders = orders?.filter((o) => o.order_type === 'dine_in') || [];
      const takeawayOrders = orders?.filter((o) => o.order_type.includes('takeaway')) || [];

      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        revenueByDay,
        salesByCategory,
        summary: {
          totalRevenue,
          totalOrders,
          avgOrderValue,
          totalCashPayments: cashPayments.reduce((sum, p) => sum + p.amount, 0),
          totalQRISPayments: qrisPayments.reduce((sum, p) => sum + p.amount, 0),
          dineInOrders: dineInOrders.length,
          takeawayOrders: takeawayOrders.length,
          cashTransactions: cashPayments.length,
          qrisTransactions: qrisPayments.length,
        },
      };
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = ['Tanggal', 'Revenue', 'Orders'];
    const rows = reportData?.revenueByDay?.map((day) => [
      day.date,
      day.revenue,
      day.orders,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
            Laporan & Analytics
          </h1>
          <p className="text-warm-500 mt-1">
            Analisis performa bisnis dan export laporan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button icon={Printer} variant="outline" onClick={handlePrint}>
            Cetak
          </Button>
          <Button icon={Download} variant="primary" onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-warm-200 rounded-xl">
          <Calendar size={18} className="text-warm-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium text-warm-700"
          >
            <option value="today">Hari Ini</option>
            <option value="yesterday">Kemarin</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">Bulan Ini</option>
            <option value="lastMonth">Bulan Lalu</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue',
            value: formatCurrency(reportData?.summary.totalRevenue || 0),
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Total Orders',
            value: reportData?.summary.totalOrders || 0,
            icon: ShoppingBag,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Avg Order Value',
            value: formatCurrency(reportData?.summary.avgOrderValue || 0),
            icon: TrendingUp,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            label: 'Dine In vs Takeaway',
            value: `${reportData?.summary.dineInOrders || 0} / ${reportData?.summary.takeawayOrders || 0}`,
            icon: Coffee,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card-premium p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 ${stat.bg} rounded-lg`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
            <p className="text-sm text-warm-500">{stat.label}</p>
            <p className="text-xl font-bold text-warm-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-premium p-6"
      >
        <h2 className="text-xl font-bold text-warm-900 mb-6">
          Revenue & Orders Trend
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={reportData?.revenueByDay}>
            <defs>
              <linearGradient id="revenueGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#78716c' }}
            />
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
              fill="url(#revenueGradient2)"
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

      {/* Sales by Category & Payment Methods */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-premium p-6"
        >
          <h2 className="text-xl font-bold text-warm-900 mb-6">
            Penjualan per Kategori
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.salesByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#78716c' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#78716c' }}
                tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '12px',
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payment Methods Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card-premium p-6"
        >
          <h2 className="text-xl font-bold text-warm-900 mb-6">
            Ringkasan Pembayaran
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-700">Cash</span>
                <span className="text-sm text-green-600">
                  {reportData?.summary.cashTransactions || 0} transaksi
                </span>
              </div>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(reportData?.summary.totalCashPayments || 0)}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-700">QRIS</span>
                <span className="text-sm text-blue-600">
                  {reportData?.summary.qrisTransactions || 0} transaksi
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-800">
                {formatCurrency(reportData?.summary.totalQRISPayments || 0)}
              </p>
            </div>

            <div className="p-4 bg-primary-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-primary-700">Total Revenue</span>
                <span className="text-sm text-primary-600">
                  {reportData?.summary.totalOrders || 0} orders
                </span>
              </div>
              <p className="text-2xl font-bold text-primary-800">
                {formatCurrency(reportData?.summary.totalRevenue || 0)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}