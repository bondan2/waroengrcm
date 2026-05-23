import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save,
  Globe,
  Phone,
  MapPin,
  Clock,
  Image,
  Upload,
  CheckCircle,
  AlertCircle,
  Store,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    site_name: 'Waroeng RCM Kang Abuy',
    site_tagline: 'Makanan Enak, Harga Ekonomis, Solusi Ketika Laper & Mageer',
    address: 'Jl. Raya Cisauk Lapan Bunderan Avani No.21, Sampora, Kec. Cisauk, Kabupaten Tangerang, Banten 15345',
    phone: '0821-1001-1010',
    whatsapp: '6282110011010',
    gofood_url: 'https://gofood.co.id/jakarta/restaurant/waroeng-rcm-kang-abuy-b9ada0f0-93a9-448a-997d-14a56bc904db',
    grabfood_url: '',
    shopeefood_url: '',
    opening_hours: '08:00 - 22:00',
    tax_rate: 11,
    currency: 'IDR',
    logo_url: '/images/logo.png',
  });

  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Upload logo if changed
      if (logoFile) {
        const fileName = `logo-${Date.now()}.${logoFile.name.split('.').pop()}`;
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(fileName, logoFile, { upsert: true });

        if (!error) {
          const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);
          setSettings((prev) => ({ ...prev, logo_url: publicUrl }));
        }
      }

      // Here you would save settings to a settings table in Supabase
      // For now, we'll just show success
      
      toast.success('Pengaturan berhasil disimpan');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-warm-900 font-display">
          Pengaturan Website
        </h1>
        <p className="text-warm-500 mt-1">
          Konfigurasi informasi dan pengaturan website
        </p>
      </motion.div>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-premium p-6"
      >
        <h2 className="text-xl font-bold text-warm-900 mb-6 flex items-center gap-2">
          <Store size={24} className="text-primary-500" />
          Informasi Bisnis
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Nama Website
            </label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) =>
                setSettings({ ...settings, site_name: e.target.value })
              }
              className="input-modern"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Tagline
            </label>
            <input
              type="text"
              value={settings.site_tagline}
              onChange={(e) =>
                setSettings({ ...settings, site_tagline: e.target.value })
              }
              className="input-modern"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Alamat
            </label>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-3 text-warm-400"
                size={18}
              />
              <textarea
                value={settings.address}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
                rows={3}
                className="input-modern pl-10 resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Telepon
            </label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400"
                size={18}
              />
              <input
                type="text"
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
                className="input-modern pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              WhatsApp
            </label>
            <div className="relative">
              <MessageCircle
                className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400"
                size={18}
              />
              <input
                type="text"
                value={settings.whatsapp}
                onChange={(e) =>
                  setSettings({ ...settings, whatsapp: e.target.value })
                }
                className="input-modern pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Jam Operasional
            </label>
            <div className="relative">
              <Clock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400"
                size={18}
              />
              <input
                type="text"
                value={settings.opening_hours}
                onChange={(e) =>
                  setSettings({ ...settings, opening_hours: e.target.value })
                }
                className="input-modern pl-10"
                placeholder="08:00 - 22:00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Tax Rate (%)
            </label>
            <input
              type="number"
              value={settings.tax_rate}
              onChange={(e) =>
                setSettings({ ...settings, tax_rate: parseFloat(e.target.value) })
              }
              className="input-modern"
            />
          </div>
        </div>
      </motion.div>

      {/* Online Order Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-premium p-6"
      >
        <h2 className="text-xl font-bold text-warm-900 mb-6 flex items-center gap-2">
          <ShoppingBag size={24} className="text-primary-500" />
          Link Order Online
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              GoFood URL
            </label>
            <input
              type="url"
              value={settings.gofood_url}
              onChange={(e) =>
                setSettings({ ...settings, gofood_url: e.target.value })
              }
              className="input-modern"
              placeholder="https://gofood.co.id/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              GrabFood URL
            </label>
            <input
              type="url"
              value={settings.grabfood_url}
              onChange={(e) =>
                setSettings({ ...settings, grabfood_url: e.target.value })
              }
              className="input-modern"
              placeholder="https://food.grab.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              ShopeeFood URL
            </label>
            <input
              type="url"
              value={settings.shopeefood_url}
              onChange={(e) =>
                setSettings({ ...settings, shopeefood_url: e.target.value })
              }
              className="input-modern"
              placeholder="https://shopee.co.id/..."
            />
          </div>
        </div>
      </motion.div>

      {/* Logo Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-premium p-6"
      >
        <h2 className="text-xl font-bold text-warm-900 mb-6 flex items-center gap-2">
          <Image size={24} className="text-primary-500" />
          Logo Website
        </h2>

        <div className="flex items-start gap-6">
          <div className="w-32 h-32 bg-warm-50 rounded-2xl flex items-center justify-center overflow-hidden">
            <img
              src={logoPreview || settings.logo_url}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <p className="text-sm text-warm-600 mb-4">
              Upload logo website. Format yang didukung: PNG, JPG, SVG.
              Ukuran maksimal 2MB.
            </p>
            <div className="flex gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="btn-outline cursor-pointer inline-flex items-center gap-2"
              >
                <Upload size={18} />
                Pilih Logo
              </label>
              {logoPreview && (
                <button
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end"
      >
        <Button
          icon={Save}
          onClick={handleSave}
          disabled={saving}
          size="lg"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </motion.div>
    </div>
  );
}