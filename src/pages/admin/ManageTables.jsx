import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  QrCode,
  Edit,
  Trash2,
  Download,
  Copy,
  CheckCircle,
  Table2,
  Users,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';

export default function ManageTables() {
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [showQR, setShowQR] = useState(null);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: 4,
    status: 'available',
  });
  const qrRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: tables, isLoading } = useQuery({
    queryKey: ['admin-tables'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tables')
        .select('*')
        .order('table_number');
      return data || [];
    },
  });

  useRealtime('tables', () => {
    queryClient.invalidateQueries({ queryKey: ['admin-tables'] });
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Generate QR code value
      const qrValue = JSON.stringify({
        table_id: data.table_number,
        restaurant: 'Waroeng RCM Kang Abuy',
        url: `${window.location.origin}/table/${data.table_number}`,
      });
      
      const { error } = await supabase
        .from('tables')
        .insert({ ...data, qr_code: qrValue });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tables'] });
      toast.success('Meja berhasil ditambahkan');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from('tables')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tables'] });
      toast.success('Meja berhasil diupdate');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tables').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tables'] });
      toast.success('Meja berhasil dihapus');
    },
  });

  const resetForm = () => {
    setFormData({ table_number: '', capacity: 4, status: 'available' });
    setEditingTable(null);
    setShowForm(false);
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      status: table.status,
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTable) {
      updateMutation.mutate({ id: editingTable.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDownloadQR = (table) => {
    const svg = document.getElementById(`qr-${table.id}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Add table number text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Meja ${table.table_number}`, canvas.width / 2, canvas.height - 20);
      
      const link = document.createElement('a');
      link.download = `QR-Meja-${table.table_number}-WaroengRCM.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: 'bg-green-50 text-green-700 border-green-200',
      occupied: 'bg-red-50 text-red-700 border-red-200',
      reserved: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      cleaning: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return badges[status] || badges.available;
  };

  const getStatusLabel = (status) => {
    return {
      available: 'Tersedia',
      occupied: 'Terpakai',
      reserved: 'Dipesan',
      cleaning: 'Dibersihkan',
    }[status] || status;
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
            Kelola Meja
          </h1>
          <p className="text-warm-500 mt-1">
            Atur meja dan generate QR Code untuk setiap meja
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Tambah Meja
        </Button>
      </motion.div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables?.map((table, index) => (
          <motion.div
            key={table.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card-premium p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-2xl">
                  🪑
                </div>
                <div>
                  <h3 className="text-xl font-bold text-warm-900">
                    Meja {table.table_number}
                  </h3>
                  <p className="text-sm text-warm-500">
                    <Users size={14} className="inline mr-1" />
                    Kapasitas {table.capacity} orang
                  </p>
                </div>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(table.status)}`}>
                {getStatusLabel(table.status)}
              </span>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4 p-4 bg-white rounded-xl border border-warm-100">
              {table.qr_code ? (
                <div className="text-center">
                  <QRCode
                    id={`qr-${table.id}`}
                    value={table.qr_code}
                    size={128}
                    level="M"
                  />
                  <p className="text-xs text-warm-400 mt-2">
                    Scan untuk pesan
                  </p>
                </div>
              ) : (
                <div className="w-32 h-32 bg-warm-50 rounded-xl flex items-center justify-center">
                  <QrCode size={32} className="text-warm-300" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                icon={Edit}
                onClick={() => handleEdit(table)}
                className="flex-1"
              >
                Edit
              </Button>
              {table.qr_code && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={Download}
                  onClick={() => handleDownloadQR(table)}
                >
                  QR
                </Button>
              )}
              <Button
                size="sm"
                variant="danger"
                icon={Trash2}
                onClick={() => {
                  if (window.confirm(`Hapus Meja ${table.table_number}?`)) {
                    deleteMutation.mutate(table.id);
                  }
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Table Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingTable ? 'Edit Meja' : 'Tambah Meja Baru'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Nomor Meja
            </label>
            <input
              type="text"
              value={formData.table_number}
              onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
              className="input-modern"
              placeholder="Contoh: A1, B2, atau 1, 2, 3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Kapasitas
            </label>
            <select
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="input-modern"
            >
              {[2, 4, 6, 8, 10, 12].map((num) => (
                <option key={num} value={num}>
                  {num} orang
                </option>
              ))}
            </select>
          </div>

          {editingTable && (
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-modern"
              >
                <option value="available">Tersedia</option>
                <option value="occupied">Terpakai</option>
                <option value="reserved">Dipesan</option>
                <option value="cleaning">Dibersihkan</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 px-4 py-3 border-2 border-warm-200 rounded-xl font-semibold hover:bg-warm-50"
            >
              Batal
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {editingTable ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Preview Modal */}
      <Modal
        isOpen={!!showQR}
        onClose={() => setShowQR(null)}
        title={`QR Code - Meja ${showQR?.table_number}`}
        size="sm"
      >
        {showQR && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <QRCode
                id={`qr-preview-${showQR.id}`}
                value={showQR.qr_code}
                size={256}
                level="H"
              />
            </div>
            <p className="text-lg font-bold text-warm-900 mb-2">
              Meja {showQR.table_number}
            </p>
            <p className="text-sm text-warm-500 mb-4">
              Scan QR code ini untuk memesan
            </p>
            <Button
              icon={Download}
              onClick={() => handleDownloadQR(showQR)}
              className="w-full"
            >
              Download QR Code
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}