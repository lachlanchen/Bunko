/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// `base: './'` keeps the build working from a GitHub Pages project path, from a
// custom domain, and from the file:// origin a Capacitor WebView uses.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Bunko · 文庫',
        short_name: 'Bunko',
        description: 'Public-domain classics in English, Chinese and Japanese, with a reading above every character.',
        theme_color: '#12111a',
        background_color: '#12111a',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: './icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: './icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: './icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Book JSON is cached by the app in IndexedDB, not by the service
        // worker: the app needs to know what it holds, and a 10 MB chapter has
        // no business in the precache.
        navigateFallbackDenylist: [/^\/api/, /\/admin(?:\/|$)/],
        runtimeCaching: [{
          urlPattern: /^https:\/\/(?:raw\.githubusercontent\.com|cdn\.jsdelivr\.net)\/.*\/books\/[^/]+\/cover-[a-f0-9]+\.(?:webp|png|jpg)$/,
          handler: 'CacheFirst',
          options: { cacheName: 'bunko-covers', expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 }, cacheableResponse: { statuses: [200] } },
        }],
      },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'], globals: true },
})
