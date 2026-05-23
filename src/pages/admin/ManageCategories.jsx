import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Image,
  Upload,
  CheckCircle,
  X,
  FolderOpen,
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function ManageCategories() {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    image_url: '',
    sort_order: 0,
    is_active: true,
  });
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('categories').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      toast.success('Kategori berhasil ditambahkan');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from('categories').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      toast.success('Kategori berhasil diupdate');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      toast.success('Kategori berhasil dihapus');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('categories')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      toast.success('Status kategori diupdate');
    },
  });

  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      const fileName = `category-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      toast.success('Gambar berhasil diupload');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengupload gambar');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      image_url: '',
      sort_order: 0,
      is_active: true,
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      image_url: category.image_url || '',
      sort_order: category.sort_order || 0,
      is_active: category.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      ...formData,
      slug: formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
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
            Kelola Kategori
          </h1>
          <p className="text-warm-500 mt-1">
            Atur kategori menu makanan & minuman
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Tambah Kategori
        </Button>
      </motion.div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className={`card-premium p-6 ${
              !category.is_active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {category.icon ? (
                  <span className="text-3xl">{category.icon}</span>
                ) : (
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                    <FolderOpen size={24} className="text-primary-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-warm-900">{category.name}</h3>
                  <p className="text-xs text-warm-500">
                    {category.is_active ? 'Aktif' : 'Nonaktif'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleActiveMutation.mutate({
                    id: category.id,
                    is_active: !category.is_active,
                  })}
                  className="p-2 hover:bg-warm-50 rounded-lg transition-colors"
                  title={category.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {category.is_active ? (
                    <Eye size={16} className="text-green-600" />
                  ) : (
                    <EyeOff size={16} className="text-warm-400" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 hover:bg-warm-50 rounded-lg transition-colors"
                >
                  <Edit size={16} className="text-warm-500" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Hapus kategori "${category.name}"?`)) {
                      deleteMutation.mutate(category.id);
                    }
                  }}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>

            {category.description && (
              <p className="text-sm text-warm-500 mb-4">{category.description}</p>
            )}

            {category.image_url && (
              <img
                src={category.image_url}
                alt={category.name}
                className="w-full h-32 object-cover rounded-xl"
              />
            )}

            <div className="mt-4 pt-4 border-t border-warm-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-warm-500">
                <GripVertical size={16} />
                <span>Urutan: {category.sort_order}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Nama Kategori
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-modern"
              placeholder="Nama kategori"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Icon (Emoji)
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="input-modern"
              placeholder="🍜"
              maxLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="input-modern resize-none"
              placeholder="Deskripsi kategori"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Gambar Kategori
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
              <div className="border-2 border-dashed border-warm-200 rounded-xl p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                  className="hidden"
                  id="category-image"
                />
                <label
                  htmlFor="category-image"
                  className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Upload size={18} />
                  Upload Gambar
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Urutan
            </label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) =>
                setFormData({ ...formData, sort_order: parseInt(e.target.value) })
              }
              className="input-modern"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="w-5 h-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-warm-700">Kategori aktif</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 px-6 py-3 border-2 border-warm-200 rounded-xl font-semibold hover:bg-warm-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              {editingCategory ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}