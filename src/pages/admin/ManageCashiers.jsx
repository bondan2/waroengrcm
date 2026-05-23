import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  UserPlus,
  User,
  Mail,
  Shield,
  Trash2,
  CheckCircle,
  XCircle,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function ManageCashiers() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'cashier',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  const { data: cashiers, isLoading } = useQuery({
    queryKey: ['admin-cashiers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['cashier', 'admin']);
      return data || [];
    },
  });

  const createCashier = useMutation({
    mutationFn: async (data) => {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: data.full_name,
          role: data.role,
          phone: data.phone,
        });

      if (profileError) throw profileError;

      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cashiers'] });
      toast.success('Kasir berhasil ditambahkan');
      resetForm();
    },
    onError: (error) => {
      toast.error('Gagal menambahkan kasir: ' + error.message);
    },
  });

  const deleteCashier = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.auth.admin.deleteUser(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cashiers'] });
      toast.success('Kasir berhasil dihapus');
    },
    onError: (error) => {
      toast.error('Gagal menghapus kasir: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ email: '', password: '', full_name: '', role: 'cashier', phone: '' });
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createCashier.mutate(formData);
  };

  const getRoleBadge = (role) => {
    const badges = {
      cashier: 'bg-blue-50 text-blue-700 border-blue-200',
      admin: 'bg-purple-50 text-purple-700 border-purple-200',
      super_admin: 'bg-red-50 text-red-700 border-red-200',
    };
    const labels = {
      cashier: 'Kasir',
      admin: 'Admin',
      super_admin: 'Super Admin',
    };
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${badges[role]}`}>
        {labels[role]}
      </span>
    );
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
            Kelola Kasir
          </h1>
          <p className="text-warm-500 mt-1">
            Tambah dan kelola akun kasir
          </p>
        </div>
        <Button
          icon={UserPlus}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Tambah Kasir
        </Button>
      </motion.div>

      {/* Cashiers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {cashiers?.map((cashier, index) => (
          <motion.div
            key={cashier.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card-premium p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                  <User size={24} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-warm-900">{cashier.full_name}</h3>
                  <p className="text-sm text-warm-500">{cashier.phone || 'No phone'}</p>
                </div>
                {getRoleBadge(cashier.role)}
              </div>

              <Button
                size="sm"
                variant="danger"
                icon={Trash2}
                onClick={() => {
                  if (window.confirm(`Hapus ${cashier.full_name}?`)) {
                    deleteCashier.mutate(cashier.id);
                  }
                }}
              >
                Hapus
              </Button>
            </div>
          </motion.div>
        ))}

        {cashiers?.length === 0 && (
          <div className="text-center py-16">
            <User size={48} className="mx-auto text-warm-300 mb-4" />
            <h3 className="text-lg font-bold text-warm-700">Belum ada kasir</h3>
            <p className="text-warm-500">Tambahkan kasir untuk memulai</p>
          </div>
        )}
      </motion.div>

      {/* Add Cashier Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title="Tambah Kasir Baru"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={18} />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="input-modern pl-10"
                placeholder="Nama kasir"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={18} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-modern pl-10"
                placeholder="email@waroengrcm.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-modern pl-10 pr-12"
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-warm-100 rounded-lg"
              >
                {showPassword ? <EyeOff size={18} className="text-warm-400" /> : <Eye size={18} className="text-warm-400" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={18} />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input-modern pl-10"
              >
                <option value="cashier">Kasir</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              No. Telepon (opsional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-modern"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className="p-4 bg-yellow-50 rounded-xl">
            <p className="text-sm text-yellow-700">
              <strong>Catatan:</strong> Kasir yang dibuat harus diverifikasi melalui email atau langsung aktif jika email confirmation diaktifkan.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 px-4 py-3 border-2 border-warm-200 rounded-xl font-semibold hover:bg-warm-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createCashier.isPending}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {createCashier.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menambahkan...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Tambah Kasir
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}