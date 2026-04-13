import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Tend',
        short_name: 'Tend',
        description: 'Tend your friendships.',
        theme_color: '#E2613A',
        background_color: '#FDF6EC',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache-first for app shell; network-first for API calls
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-api' },
          },
          {
            urlPattern: /^https:\/\/.*basemaps\.cartocdn\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'map-tiles' },
          },
        ],
      },
    }),
  ],
})
