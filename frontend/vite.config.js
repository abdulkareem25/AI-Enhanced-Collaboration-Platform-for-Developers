import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://backend-pag4.onrender.com',  // Backend ka Render URL yahan dalain
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    target: "esnext"
  }
})
