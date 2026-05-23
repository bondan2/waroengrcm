import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Image,
  Upload,
  CheckCircle,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function ManagePromos() {
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase: '',
    start_date: '',
    end_date: '',
    image_url: '',
    is_active: true,
  });
  const queryClient = useQueryClient();

  const { data: promos, isLoading } = useQuery({
    queryKey: ['admin-promos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('promotions').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
      toast.success('Promo berhasil ditambahkan');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from('promotions').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
      toast.success('Promo berhasil diupdate');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
      toast.success('Promo berhasil dihapus');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
    },
  });

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);

    try {
      const fileName = `promo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('promo-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('promo-images')
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      toast.success('Gambar berhasil diupload');
    } catch (error) {
      toast.error('Gagal upload gambar');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase: '',
      start_date: '',
      end_date: '',
      image_url: '',
      is_active: true,
    });
    setEditingPromo(null);
    setShowForm(false);
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      title: promo.title,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value?.toString() || '',
      min_purchase: promo.min_purchase?.toString() || '',
      start_date: promo.start_date ? format(new Date(promo.start_date), "yyyy-MM-dd'T'HH:mm") : '',
      end_date: promo.end_date ? format(new Date(promo.end_date), "yyyy-MM-dd'T'HH:mm") : '',
      image_url: promo.image_url || '',
      is_active: promo.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      discount_value: parseFloat(formData.discount_value),
      min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    if (editingPromo) {
      updateMutation.mutate({ id: editingPromo.id, data });
    } else {
      createMutation.mutate(data);
    }
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
            Kelola Promo
          </h1>
          <p className="text-warm-500 mt-1">
            Buat dan kelola promo untuk pelanggan
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Tambah Promo
        </Button>
      </motion.div>

      {/* Promos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promos?.map((promo, index) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`card-premium overflow-hidden ${!promo.is_active ? 'opacity-60' : ''}`}
          >
            {/* Promo Image */}
            <div className="relative h-40 bg-gradient-to-br from-primary-500 to-orange-500">
              {promo.image_url ? (
                <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Tag size={48} className="text-white/50" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => toggleActive.mutate({ id: promo.id, is_active: !promo.is_active })}
                  className="p-2 bg-white rounded-lg shadow-lg hover:bg-warm-50"
                >
                  {promo.is_active ? <Eye size={16} className="text-green-600" /> : <EyeOff size={16} className="text-warm-400" />}
                </button>
                <button
                  onClick={() => handleEdit(promo)}
                  className="p-2 bg-white rounded-lg shadow-lg hover:bg-warm-50"
                >
                  <Edit size={16} className="text-warm-600" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Hapus promo "${promo.title}"?`)) {
                      deleteMutation.mutate(promo.id);
                    }
                  }}
                  className="p-2 bg-white rounded-lg shadow-lg hover:bg-red-50"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
              <div className="absolute top-3 left-3">
                <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-primary-600">
                  {promo.discount_type === 'percentage'
                    ? `${promo.discount_value}% OFF`
                    : `Diskon ${formatCurrency(promo.discount_value)}`}
                </span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-warm-900 mb-1">{promo.title}</h3>
              {promo.description && (
                <p className="text-sm text-warm-500 mb-3">{promo.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {promo.min_purchase > 0 && (
                  <div className="flex items-center gap-2 text-warm-600">
                    <DollarSign size={14} />
                    <span>Min. pembelian {formatCurrency(promo.min_purchase)}</span>
                  </div>
                )}
                {(promo.start_date || promo.end_date) && (
                  <div className="flex items-center gap-2 text-warm-600">
                    <Calendar size={14} />
                    <span>
                      {promo.start_date && format(new Date(promo.start_date), 'dd MMM', { locale: id })}
                      {promo.start_date && promo.end_date && ' - '}
                      {promo.end_date && format(new Date(promo.end_date), 'dd MMM yyyy', { locale: id })}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-warm-100">
                <span className={`text-xs font-medium ${promo.is_active ? 'text-green-600' : 'text-warm-400'}`}>
                  {promo.is_active ? '● Aktif' : '○ Nonaktif'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Promo Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingPromo ? 'Edit Promo' : 'Tambah Promo Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Judul Promo
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-modern"
                placeholder="Contoh: Diskon Spesial Weekend"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Tipe Diskon
              </label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                className="input-modern"
              >
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal (Rp)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Nilai Diskon
              </label>
              <div className="relative">
                {formData.discount_type === 'percentage' ? (
                  <>
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      className="input-modern pr-10"
                      placeholder="10"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 font-bold">%</span>
                  </>
                ) : (
                  <>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400">Rp</span>
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      className="input-modern pl-10"
                      placeholder="10000"
                      required
                    />
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Minimal Pembelian
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400">Rp</span>
                <input
                  type="number"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                  className="input-modern pl-10"
                  placeholder="50000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Tanggal Mulai
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Tanggal Berakhir
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="input-modern"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="input-modern resize-none"
              placeholder="Deskripsi promo"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Gambar Promo
            </label>
            {formData.image_url ? (
              <div className="relative">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image_url: '' })}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-warm-200 rounded-xl p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                  className="hidden"
                  id="promo-image"
                />
                <label
                  htmlFor="promo-image"
                  className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Upload size={18} />
                  Upload Gambar Promo
                </label>
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-warm-700">Promo aktif</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 px-4 py-3 border-2 border-warm-200 rounded-xl font-semibold hover:bg-warm-50"
            >
              Batal
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {editingPromo ? 'Update Promo' : 'Simpan Promo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}