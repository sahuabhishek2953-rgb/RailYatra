import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'RailYatra — Live Train Tracker',
        short_name: 'RailYatra',
        description: 'Track any Indian Railways train live on an interactive map with real-time delay, ETA, weather & journey analytics.',
        theme_color: '#4F6EF7',
        background_color: '#FAFAFA',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        categories: ['travel', 'navigation', 'utilities'],
        shortcuts: [
          {
            name: 'Search Trains',
            short_name: 'Search',
            description: 'Search for any Indian Railways train',
            url: '/',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        // Cache static assets forever
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // Cache API responses for train search (short TTL)
          {
            urlPattern: /\/api\/v1\/trains\/search/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-search-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 }
            }
          },
          // Cache journey data (very short TTL — live data)
          {
            urlPattern: /\/api\/v1\/trains\/.*\/journey/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-journey-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 }
            }
          },
          // Cache elevation data for a week
          {
            urlPattern: /\/api\/v1\/trains\/.*\/elevation/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-elevation-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 604800 }
            }
          },
          // Cache weather for 10 minutes
          {
            urlPattern: /\/api\/v1\/weather/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-weather-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 600 }
            }
          },
          // Cache MapTiler tiles
          {
            urlPattern: /api\.maptiler\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'maptiler-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 86400 }
            }
          }
        ]
      },
      devOptions: {
        enabled: false // Don't register SW in dev
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split map library into its own chunk
          'maplibre': ['maplibre-gl'],
          // Split recharts into its own chunk
          'recharts': ['recharts'],
          // Core React + router + query
          'react-vendor': ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          // UI utilities
          'ui-vendor': ['zustand', 'sonner', 'lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
});
