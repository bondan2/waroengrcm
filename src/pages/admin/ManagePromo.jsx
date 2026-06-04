import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Edit, Trash2, Image, Upload, X,
  Percent, Calendar, Tag, Eye
} from 'lucide-react'
import { supabase, uploadFile, STORAGE_BUCKETS, STORAGE_FOLDERS } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../utils/format'
import { toast } from 'sonner'

export default function ManagePromo() {
  const [promotions, setPromotions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    start_date: '',
    end_date: '',
    is_active: true
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => { loadPromotions() }, [])

  const loadPromotions = async () => {
    try {
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false })
      setPromotions(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat promo')
    } finally {
      setLoading(false)
    }
  }

  const filteredPromotions = promotions.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo)
      setForm({
        title: promo.title || '',
        description: promo.description || '',
        discount_type: promo.discount_type || 'percentage',
        discount_value: promo.discount_value?.toString() || '',
        start_date: promo.start_date ? new Date(promo.start_date).toISOString().split('T')[0] : '',
        end_date: promo.end_date ? new Date(promo.end_date).toISOString().split('T')[0] : '',
        is_active: promo.is_active ?? true
      })
      setImagePreview(promo.image_url || null)
    } else {
      setEditingPromo(null)
      setForm({
        title: '', description: '', discount_type: 'percentage',
        discount_value: '', start_date: '', end_date: '', is_active: true
      })
      setImagePreview(null)
      setImageFile(null)
    }
    setShowModal(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validasi
    if (!form.title.trim()) {
      toast.error('Judul promo wajib diisi')
      return
    }
    if (!form.discount_value || parseFloat(form.discount_value) <= 0) {
      toast.error('Nilai diskon harus lebih dari 0')
      return
    }

    setSaving(true)

    try {
      let imageUrl = editingPromo?.image_url || null

      // Upload gambar jika ada
      if (imageFile) {
        setUploading(true)
        const result = await uploadFile(
          STORAGE_BUCKETS.WEBSITE_ASSETS,
          STORAGE_FOLDERS.PROMOTIONS,
          imageFile
        )
        setUploading(false)

        if (result.success) {
          imageUrl = result.url
          toast.success('Gambar berhasil diupload!')
        } else {
          toast.error(result.error || 'Gagal upload gambar')
          setSaving(false)
          return
        }
      }

      const promoData = {
        title: form.title.trim(),
        description: form.description.trim(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value) || 0,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        is_active: form.is_active,
        image_url: imageUrl
      }

      console.log('💾 Saving promo:', promoData)

      if (editingPromo) {
        const { error } = await supabase
          .from('promotions')
          .update(promoData)
          .eq('id', editingPromo.id)

        if (error) throw error
        toast.success('Promo berhasil diupdate!')
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert([promoData])

        if (error) throw error
        toast.success('Promo berhasil ditambahkan!')
      }

      setShowModal(false)
      loadPromotions()
    } catch (error) {
      console.error('Error saving promotion:', error)
      toast.error('Gagal menyimpan promo: ' + error.message)
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const handleDelete = async (promoId) => {
    if (!window.confirm('Yakin ingin menghapus promo ini?')) return
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', promoId)
      if (error) throw error
      toast.success('Promo berhasil dihapus')
      loadPromotions()
    } catch (error) {
      toast.error('Gagal menghapus promo')
    }
  }

  const handleToggleActive = async (promo) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: !promo.is_active })
        .eq('id', promo.id)

      if (error) throw error
      toast.success(`Promo ${promo.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      loadPromotions()
    } catch (error) {
      toast.error('Gagal mengubah status promo')
    }
  }

  const isPromoActive = (promo) => {
    if (!promo.is_active) return false
    const now = new Date()
    if (promo.start_date && new Date(promo.start_date) > now) return false
    if (promo.end_date && new Date(promo.end_date) < now) return false
    return true
  }

  const getPromoStatus = (promo) => {
    if (!promo.is_active) return { label: 'Nonaktif', color: 'bg-gray-100 text-gray-600' }
    const now = new Date()
    if (promo.start_date && new Date(promo.start_date) > now) return { label: 'Terjadwal', color: 'bg-blue-100 text-blue-700' }
    if (promo.end_date && new Date(promo.end_date) < now) return { label: 'Berakhir', color: 'bg-red-100 text-red-700' }
    return { label: 'Aktif', color: 'bg-green-100 text-green-700' }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kelola Promo</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {promotions.length} promo · {promotions.filter(p => isPromoActive(p)).length} aktif
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Promo</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text" placeholder="Cari promo..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Promo Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="text-center py-16">
          <Percent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Belum Ada Promo</h2>
          <p className="text-sm text-gray-500">Klik "Tambah Promo" untuk membuat promo baru</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPromotions.map((promo) => {
            const status = getPromoStatus(promo)
            const active = isPromoActive(promo)

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                  !active ? 'opacity-70' : 'border-gray-100 hover:shadow-lg'
                }`}
              >
                {/* Image */}
                <div className="relative h-40 bg-gradient-to-br from-orange-100 to-red-100">
                  {promo.image_url ? (
                    <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Percent className="w-16 h-16 text-orange-300" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Discount Badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-bold text-red-600 shadow">
                      {promo.discount_type === 'percentage'
                        ? `${promo.discount_value}% OFF`
                        : formatCurrency(promo.discount_value)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{promo.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[2.5rem]">
                    {promo.description || 'Tidak ada deskripsi'}
                  </p>

                  {/* Date Range */}
                  {(promo.start_date || promo.end_date) && (
                    <div className="flex items-center text-xs text-gray-500 mb-3">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      <span>
                        {promo.start_date ? formatDate(promo.start_date) : 'Sekarang'}
                        {' — '}
                        {promo.end_date ? formatDate(promo.end_date) : 'Selamanya'}
                      </span>
                    </div>
                  )}

                  {/* Tipe Diskon */}
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <Tag className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span>
                      {promo.discount_type === 'percentage' ? 'Diskon Persentase' : 'Diskon Nominal'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenModal(promo)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4 mr-1" />Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(promo)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        promo.is_active
                          ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {promo.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal Tambah/Edit */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPromo ? 'Edit Promo' : 'Tambah Promo Baru'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Upload Gambar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Promo (Opsional)</label>
                  <div className="flex items-start space-x-4">
                    <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 flex-shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors">
                        <Upload className="w-4 h-4 mr-1.5" />
                        {uploading ? 'Mengupload...' : 'Pilih Gambar'}
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploading} />
                      </label>
                      <p className="text-xs text-gray-400 mt-2">PNG, JPG, GIF, WEBP (Max 10MB)</p>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={() => { setImagePreview(null); setImageFile(null) }}
                          className="text-xs text-red-500 hover:text-red-600 mt-1 block"
                        >
                          Hapus gambar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Judul */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Promo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Diskon 20% Semua Menu!"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows="3"
                    placeholder="Deskripsikan promo Anda..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  />
                </div>

                {/* Tipe & Nilai Diskon */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Diskon</label>
                    <select
                      value={form.discount_type}
                      onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="percentage">Persentase (%)</option>
                      <option value="fixed">Nominal (Rp)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nilai Diskon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.discount_value}
                      onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                      placeholder={form.discount_type === 'percentage' ? 'Contoh: 20' : 'Contoh: 5000'}
                      min="0"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {form.discount_type === 'percentage' ? 'Masukkan angka (1-100)' : 'Masukkan nominal (Rp)'}
                    </p>
                  </div>
                </div>

                {/* Tanggal */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Kosongkan untuk langsung aktif</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Berakhir</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Kosongkan untuk selamanya</p>
                  </div>
                </div>

                {/* Status Aktif */}
                <label className="flex items-center space-x-3 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Promo Aktif</span>
                    <p className="text-xs text-gray-400">Promo akan langsung muncul di halaman menu</p>
                  </div>
                </label>

                {/* Buttons */}
                <div className="flex space-x-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {saving || uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Menyimpan...
                      </>
                    ) : editingPromo ? (
                      'Update Promo'
                    ) : (
                      'Simpan Promo'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}