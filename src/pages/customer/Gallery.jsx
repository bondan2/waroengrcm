import { motion } from 'framer-motion'

// Vite memblokir import langsung dari public, jadi kita pakai query ?url
const galleryModules = import.meta.glob('/public/img/galeri/*.{png,jpg,jpeg,webp,JPG,PNG,JPEG}', { eager: true, query: '?url', import: 'default' })
const GALLERY_IMAGES = Object.values(galleryModules)

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } }),
}

export default function Gallery() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Galeri Resto</h1>
        <p className="text-gray-500 text-sm md:text-base">Melihat lebih dekat suasana dan sajian khas Waroeng RCM</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {GALLERY_IMAGES.map((imgSrc, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 aspect-video sm:aspect-square"
          >
            <img 
              src={imgSrc} 
              alt={`Galeri ${i + 1}`} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            />
            {/* Overlay Gradient on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
              <p className="text-white font-medium text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                Waroeng RCM
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {GALLERY_IMAGES.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400">Belum ada foto di galeri saat ini.</p>
        </div>
      )}
    </div>
  )
}
