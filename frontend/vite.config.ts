import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@xyflow') || id.includes('d3-')) return 'vendor-flow'
          if (id.includes('recharts')) return 'vendor-charts'
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf'
          if (id.includes('framer-motion') || id.includes('gsap') || id.includes('lenis')) return 'vendor-motion'
          if (id.includes('@tsparticles')) return 'vendor-particles'
          if (id.includes('react-markdown') || id.includes('remark') || id.includes('micromark') || id.includes('unist') || id.includes('mdast')) {
            return 'vendor-markdown'
          }
          if (id.includes('i18next')) return 'vendor-i18n'
          return undefined
        },
      },
    },
  },
})
