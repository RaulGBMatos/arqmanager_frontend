import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://arqmanager.onrender.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: 'https://arqmanager.onrender.com/',
        changeOrigin: true,
      },
    },
  },
build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const normalizedId = id.replace(/\\+/g, '/')

            if (normalizedId.includes('react-dom')) return 'react-dom'
            if (normalizedId.includes('react-router-dom')) return 'router'
            if (normalizedId.includes('@tanstack/react-query')) return 'react-query'
            if (normalizedId.includes('date-fns')) return 'date-fns'
            if (normalizedId.includes('axios')) return 'axios'
            if (normalizedId.includes('lucide-react')) return 'lucide-react'
            if (normalizedId.includes('zod')) return 'zod'
            if (normalizedId.includes('@radix-ui')) return 'radix-ui'

            return 'vendor'
          }
        },
      },
    },
  },

})
