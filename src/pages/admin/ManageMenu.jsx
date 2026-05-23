import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Image,
  Upload,
  Star,
  Eye,
  EyeOff,
  MoreVertical,
  Filter,
  Download,
  UploadCloud,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import { formatCurrency } from '../../lib/utils';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function ManageMenu() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    price: '',
    is_best_seller: false,
    is_available: true,
    stock: 0,
    prep_time: 15,
    image_url: '',
  });

  const { data: menus, isLoading } = useQuery({
    queryKey: ['admin-menus', search, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('menus')
        .select('*, categories(name)')
        .order('name');

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });

  useRealtime('menus', () => {
    queryClient.invalidateQueries({ queryKey: ['admin-menus'] });
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('menus').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus'] });
      toast.success('Menu berhasil ditambahkan');
      resetForm();
    },
    onError: (error) => {
      toast.error('Gagal menambahkan menu: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from('menus').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus'] });
      toast.success('Menu berhasil diupdate');
      resetForm();
    },
    onError: (error) => {
      toast.error('Gagal mengupdate menu: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('menus').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menus'] });
      toast.success('Menu berhasil dihapus');
    },
    onError: (error) => {
      toast.error('Gagal menghapus menu: ' + error.message);
    },
  });

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Compress image before upload
      const compressedFile = await compressImage(file);

      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percent));
          },
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      toast.success('Gambar berhasil diupload');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengupload gambar');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            0.8
          );
        };
      };
      reader.onerror = reject;
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: '',
      description: '',
      price: '',
      is_best_seller: false,
      is_available: true,
      stock: 0,
      prep_time: 15,
      image_url: '',
    });
    setEditingMenu(null);
    setShowForm(false);
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      category_id: menu.category_id || '',
      description: menu.description || '',
      price: menu.price.toString(),
      is_best_seller: menu.is_best_seller,
      is_available: menu.is_available,
      stock: menu.stock || 0,
      prep_time: menu.prep_time || 15,
      image_url: menu.image_url || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      ...formData,
      price: parseFloat(formData.price),
      slug: formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    };

    if (editingMenu) {
      updateMutation.mutate({ id: editingMenu.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = async (menu) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus menu "${menu.name}"?`)) {
      deleteMutation.mutate(menu.id);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

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
            Kelola Menu
          </h1>
          <p className="text-warm-500 mt-1">
            Tambah, edit, dan kelola menu makanan & minuman
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Tambah Menu
        </Button>
      </motion.div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Cari menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-warm-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 bg-white border border-warm-200 rounded-xl text-sm focus:border-primary-500 outline-none"
        >
          <option value="all">Semua Kategori</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus?.map((menu, index) => (
          <motion.div
            key={menu.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card-premium overflow-hidden group"
          >
            <div className="relative">
              <img
                src={menu.image_url || '/placeholder-food.jpg'}
                alt={menu.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(menu)}
                  className="p-2 bg-white rounded-xl shadow-lg hover:bg-primary-500 hover:text-white transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(menu)}
                  className="p-2 bg-white rounded-xl shadow-lg hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {menu.is_best_seller && (
                <div className="absolute top-3 left-3 bg-yellow-400 text-warm-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Star size={12} fill="currentColor" />
                  Best Seller
                </div>
              )}
              {!menu.is_available && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-white text-warm-900 px-4 py-2 rounded-xl font-bold">
                    Tidak Tersedia
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-warm-900">{menu.name}</h3>
                  <p className="text-xs text-warm-500">{menu.categories?.name}</p>
                </div>
                <p className="text-lg font-bold text-primary-600">
                  {formatCurrency(menu.price)}
                </p>
              </div>
              <p className="text-sm text-warm-500 line-clamp-2">
                {menu.description}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-warm-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${
                      menu.is_available ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {menu.is_available ? (
                      <Eye size={12} />
                    ) : (
                      <EyeOff size={12} />
                    )}
                    {menu.is_available ? 'Tersedia' : 'Tidak Tersedia'}
                  </span>
                </div>
                <span className="text-xs text-warm-400">
                  Stok: {menu.stock}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Menu Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">
                Gambar Menu
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-warm-200 rounded-xl p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
              >
                {formData.image_url ? (
                  <div className="relative">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, image_url: '' })
                      }
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud
                      size={48}
                      className="mx-auto text-warm-400 mb-4"
                    />
                    <p className="text-warm-600 font-medium mb-1">
                      Drag & drop gambar di sini
                    </p>
                    <p className="text-sm text-warm-400 mb-4">
                      atau klik untuk memilih file
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0])}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="btn-primary cursor-pointer inline-flex items-center gap-2"
                    >
                      <Upload size={18} />
                      Pilih Gambar
                    </label>
                  </>
                )}

                {uploading && (
                  <div className="mt-4">
                    <div className="bg-warm-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-primary-500 rounded-full"
                      />
                    </div>
                    <p className="text-sm text-warm-500 mt-2">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Nama Menu
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-modern"
                  placeholder="Nama menu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Kategori
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="input-modern"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Harga
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="input-modern"
                  placeholder="Harga menu"
                  required
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
                  placeholder="Deskripsi menu"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    Stok
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: parseInt(e.target.value) })
                    }
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    Waktu Persiapan (menit)
                  </label>
                  <input
                    type="number"
                    value={formData.prep_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prep_time: parseInt(e.target.value),
                      })
                    }
                    className="input-modern"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_best_seller}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_best_seller: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-warm-700">
                    Tandai sebagai Best Seller
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_available: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-warm-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-warm-700">
                    Menu tersedia
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-warm-100">
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
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {editingMenu ? 'Update Menu' : 'Simpan Menu'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}