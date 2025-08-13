import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  publicDir: 'fe/public',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png'],
      manifest: {
        name: 'My aiCare',
        short_name: 'aiCare',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0ea5e9',
        icons: [
          {
            src: '/icon.png',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
