import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Table2,
  Users,
  Clock,
  MoreVertical,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Coffee,
  Eye,
  Printer,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import { useAudio } from '../../hooks/useAudio';
import { formatCurrency } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableDetail, setShowTableDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const { play } = useAudio();

  const { data, refetch } = useQuery({
    queryKey: ['tables-monitoring'],
    queryFn: async () => {
      const { data: tablesData } = await supabase
        .from('tables')
        .select(`
          *,
          current_order:orders(
            id,
            order_number,
            customer_name,
            total_amount,
            status,
            created_at,
            order_items(
              quantity,
              menus(name, price)
            )
          )
        `)
        .order('table_number');
      return tablesData || [];
    },
  });

  useEffect(() => {
    if (data) setTables(data);
  }, [data]);

  useEffect(() => {
    if (tables.length > 0) setLoading(false);
  }, [tables]);

  // Realtime table updates
  useRealtime('tables', (payload) => {
    const updatedTable = payload.new;
    setTables((prev) =>
      prev.map((table) =>
        table.id === updatedTable.id ? { ...table, ...updatedTable } : table
      )
    );

    // Play sound when table becomes active
    if (payload.eventType === 'UPDATE' && updatedTable.status === 'occupied') {
      play('tableActive');
      toast.info(`Meja ${updatedTable.table_number} aktif`, {
        icon: '🪑',
      });
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'occupied':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'reserved':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'cleaning':
        return 'bg-gray-50 border-gray-200 text-gray-700';
      default:
        return 'bg-warm-50 border-warm-200 text-warm-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return CheckCircle;
      case 'occupied':
        return Users;
      case 'reserved':
        return Clock;
      case 'cleaning':
        return RefreshCw;
      default:
        return AlertCircle;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'available':
        return 'Tersedia';
      case 'occupied':
        return 'Dine In';
      case 'reserved':
        return 'Dipesan';
      case 'cleaning':
        return 'Dibersihkan';
      default:
        return status;
    }
  };

  const handleReleaseTable = async (table) => {
    try {
      await supabase
        .from('tables')
        .update({
          status: 'cleaning',
          current_order_id: null,
        })
        .eq('id', table.id);

      if (table.current_order) {
        await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', table.current_order.id);
      }

      toast.success(`Meja ${table.table_number} berhasil dilepas`);
      refetch();
    } catch (error) {
      console.error('Error releasing table:', error);
      toast.error('Gagal melepas meja');
    }
  };

  const handleMoveTable = async (fromTable, toTableId) => {
    try {
      // Update old table
      await supabase
        .from('tables')
        .update({
          status: 'cleaning',
          current_order_id: null,
        })
        .eq('id', fromTable.id);

      // Update new table
      await supabase
        .from('tables')
        .update({
          status: 'occupied',
          current_order_id: fromTable.current_order?.id,
        })
        .eq('id', toTableId);

      // Update order
      if (fromTable.current_order) {
        await supabase
          .from('orders')
          .update({ table_id: toTableId })
          .eq('id', fromTable.current_order.id);
      }

      toast.success('Meja berhasil dipindahkan');
      refetch();
    } catch (error) {
      console.error('Error moving table:', error);
      toast.error('Gagal memindahkan meja');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-warm-500">Memuat data meja...</p>
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
            Monitoring Meja
          </h1>
          <p className="text-warm-500 mt-1">
            Pantau status meja secara realtime
          </p>
        </div>
        <Button icon={RefreshCw} onClick={() => refetch()} variant="outline">
          Refresh
        </Button>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Meja', value: tables.length, color: 'text-warm-900' },
          {
            label: 'Tersedia',
            value: tables.filter((t) => t.status === 'available').length,
            color: 'text-green-600',
          },
          {
            label: 'Terpakai',
            value: tables.filter((t) => t.status === 'occupied').length,
            color: 'text-red-600',
          },
          {
            label: 'Lainnya',
            value: tables.filter((t) => !['available', 'occupied'].includes(t.status)).length,
            color: 'text-yellow-600',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card-premium p-4 text-center"
          >
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-warm-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table, index) => {
          const StatusIcon = getStatusIcon(table.status);
          return (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={() => {
                setSelectedTable(table);
                setShowTableDetail(true);
              }}
              className={`card-premium p-6 text-center cursor-pointer border-2 ${getStatusColor(
                table.status
              )}`}
            >
              <div className="text-4xl mb-3">🪑</div>
              <h3 className="text-2xl font-bold mb-2">Meja {table.table_number}</h3>
              <div className="flex items-center justify-center gap-2">
                <StatusIcon size={16} />
                <span className="text-sm font-medium">{getStatusLabel(table.status)}</span>
              </div>
              {table.status === 'occupied' && table.current_order && (
                <div className="mt-3 pt-3 border-t border-current/10">
                  <p className="text-xs opacity-75">
                    {formatDistanceToNow(new Date(table.current_order.created_at), {
                      addSuffix: true,
                      locale: id,
                    })}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Table Detail Modal */}
      <Modal
        isOpen={showTableDetail}
        onClose={() => setShowTableDetail(false)}
        title={`Meja ${selectedTable?.table_number}`}
        size="lg"
      >
        {selectedTable && (
          <div className="space-y-6">
            {/* Status */}
            <div className={`p-4 rounded-xl ${getStatusColor(selectedTable.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">
                    {getStatusLabel(selectedTable.status)}
                  </p>
                  <p className="text-sm opacity-75">
                    Kapasitas: {selectedTable.capacity} orang
                  </p>
                </div>
                {selectedTable.status === 'occupied' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      icon={CheckCircle}
                      onClick={() => handleReleaseTable(selectedTable)}
                    >
                      Release Meja
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Current Order */}
            {selectedTable.current_order && (
              <div>
                <h3 className="text-lg font-semibold text-warm-900 mb-4">
                  Pesanan Aktif
                </h3>
                <div className="card-premium p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-warm-900">
                        #{selectedTable.current_order.order_number}
                      </p>
                      <p className="text-sm text-warm-500">
                        {selectedTable.current_order.customer_name}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-primary-600">
                      {formatCurrency(selectedTable.current_order.total_amount)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {selectedTable.current_order.order_items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-warm-600">
                          {item.quantity}x {item.menus?.name}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.quantity * item.menus?.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" icon={Eye}>
                      Detail Order
                    </Button>
                    <Button size="sm" variant="outline" icon={Printer}>
                      Cetak
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {selectedTable.status === 'occupied' && (
              <div>
                <h3 className="text-lg font-semibold text-warm-900 mb-4">
                  Pindah Meja
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {tables
                    .filter((t) => t.id !== selectedTable.id && t.status === 'available')
                    .map((table) => (
                      <button
                        key={table.id}
                        onClick={() => handleMoveTable(selectedTable, table.id)}
                        className="p-3 rounded-xl border-2 border-warm-200 hover:border-primary-500 text-center transition-all"
                      >
                        <p className="font-bold">Meja {table.table_number}</p>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}