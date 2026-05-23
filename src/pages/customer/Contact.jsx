import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, MessageCircle, ExternalLink, Mail } from 'lucide-react';

export default function Contact() {
  const contactInfo = [
    {
      icon: MapPin,
      title: 'Alamat',
      content: 'Jl. Raya Cisauk Lapan Bunderan Avani No.21, Sampora, Kec. Cisauk, Kabupaten Tangerang, Banten 15345',
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      icon: Phone,
      title: 'Telepon / WhatsApp',
      content: '0821-1001-1010',
      color: 'text-green-500',
      bg: 'bg-green-50',
      action: {
        label: 'Hubungi via WhatsApp',
        href: 'https://wa.me/6282110011010',
        icon: MessageCircle,
      },
    },
    {
      icon: Clock,
      title: 'Jam Operasional',
      content: 'Setiap hari, 08:00 - 22:00 WIB',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
  ];

  const onlineOrders = [
    {
      name: 'GoFood',
      url: 'https://gofood.co.id/jakarta/restaurant/waroeng-rcm-kang-abuy-b9ada0f0-93a9-448a-997d-14a56bc904db',
      color: 'bg-red-500 hover:bg-red-600',
      icon: '🍜',
    },
    {
      name: 'GrabFood',
      url: '#',
      color: 'bg-green-500 hover:bg-green-600',
      icon: '🛵',
    },
    {
      name: 'ShopeeFood',
      url: '#',
      color: 'bg-orange-500 hover:bg-orange-600',
      icon: '🛒',
    },
  ];

  return (
    <div className="pt-20 min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-white border-b border-warm-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-warm-900 font-display mb-2">
              Hubungi Kami
            </h1>
            <p className="text-warm-500">
              Kami siap melayani Anda. Silakan hubungi kami melalui kontak di bawah ini.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {contactInfo.map((info, index) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-premium p-6"
            >
              <div className={`w-12 h-12 ${info.bg} rounded-xl flex items-center justify-center mb-4`}>
                <info.icon size={24} className={info.color} />
              </div>
              <h3 className="font-bold text-warm-900 mb-2">{info.title}</h3>
              <p className="text-sm text-warm-500 mb-4">{info.content}</p>
              {info.action && (
                <a
                  href={info.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <info.action.icon size={16} />
                  {info.action.label}
                  <ExternalLink size={14} />
                </a>
              )}
            </motion.div>
          ))}
        </div>

        {/* Online Order Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-premium p-8 text-center mb-12"
        >
          <h2 className="text-2xl font-bold text-warm-900 font-display mb-4">
            Pesan Online
          </h2>
          <p className="text-warm-500 mb-8 max-w-lg mx-auto">
            Tidak sempat datang langsung? Pesan melalui aplikasi favorit Anda
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {onlineOrders.map((order) => (
              <a
                key={order.name}
                href={order.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${order.color} text-white px-8 py-4 rounded-2xl font-semibold text-lg inline-flex items-center gap-3 transition-all hover:scale-105 shadow-lg`}
              >
                <span className="text-2xl">{order.icon}</span>
                {order.name}
              </a>
            ))}
          </div>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-premium overflow-hidden"
        >
          <div className="aspect-video bg-warm-100">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.8!2d106.6!3d-6.3!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTgnMDAuMCJTIDEwNsKwMzYnMDAuMCJF!5e0!3m2!1sen!2sid!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Waroeng RCM Kang Abuy Location"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}