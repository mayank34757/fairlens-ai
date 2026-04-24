import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Disable sourcemaps in production for smaller, more secure bundles
    sourcemap: false,
    // Warn when any chunk exceeds 600 kB
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor libraries into separate cached chunks (function form for rolldown)
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react'
          }
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
            return 'charts'
          }
          if (
            id.includes('node_modules/axios') ||
            id.includes('node_modules/react-hot-toast') ||
            id.includes('node_modules/react-dropzone')
          ) {
            return 'vendor'
          }
        },
      },
    },
  },
  // Expose all VITE_* env vars to the client bundle
  envPrefix: 'VITE_',
})

