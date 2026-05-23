import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    
    // Resolve aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@styles': path.resolve(__dirname, './src/styles'),
      },
    },
    
    // Server configuration
    server: {
      port: 3000,
      open: true,
      cors: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:54321',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    
    // Build configuration
    build: {
      target: 'es2020',
      sourcemap: false,
      minify: 'terser',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            
            // UI & Animation
            'ui-vendor': ['framer-motion', 'lucide-react'],
            
            // State & Data
            'data-vendor': ['@tanstack/react-query', 'zustand'],
            
            // Charts
            'chart-vendor': ['recharts'],
            
            // Supabase
            'supabase-vendor': ['@supabase/supabase-js'],
            
            // Utilities
            'util-vendor': ['date-fns', 'clsx'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    
    // Preview configuration
    preview: {
      port: 4173,
      open: true,
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'framer-motion',
        'lucide-react',
        '@tanstack/react-query',
        'zustand',
        '@supabase/supabase-js',
        'recharts',
        'date-fns',
        'clsx',
      ],
    },
    
    // CSS configuration
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
      preprocessorOptions: {
        css: {
          additionalData: '',
        },
      },
      postcss: './postcss.config.js',
    },
    
    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
  };
});