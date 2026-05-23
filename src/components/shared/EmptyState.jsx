import { motion } from 'framer-motion';
import { Package } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = Package,
  title = 'Tidak ada data', 
  description = 'Belum ada data yang tersedia',
  action,
  actionLabel,
  onAction,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 bg-warm-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Icon size={40} className="text-warm-400" />
      </div>
      <h3 className="text-xl font-bold text-warm-700 mb-2">{title}</h3>
      <p className="text-warm-500 max-w-sm mx-auto mb-6">{description}</p>
      {action && (
        <button
          onClick={onAction}
          className="btn-primary inline-flex items-center gap-2"
        >
          {action}
        </button>
      )}
    </motion.div>
  );
}