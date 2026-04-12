// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    build: {
        outDir: 'dist',
    },

    // IMPORTANT : pas de server.proxy ici — Netlify est un CDN statique,
    // il ne peut pas proxifier. Le front appelle directement l'URL Render.
    // Le proxy nginx est uniquement utile pour le docker-compose local.

    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',

            devOptions: {
                enabled: true,
                type: 'module',
            },

            includeAssets: [
                'favicon.ico',
                'logo.png',
                'logo_2.png',
                'apple-touch-icon.png',
            ],

            manifest: {
                name: 'ToDo PWA - TeckIt',
                short_name: 'ToDoPWA',
                description: 'Une liste de tâches offline-first avec React JS & Spring Boot',
                theme_color: '#00BCD4',
                background_color: '#005A5F',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                orientation: 'portrait-primary',
                icons: [
                    {
                        src: '/logo.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/logo_2.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable any',
                    },
                ],
            },

            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}'],
                navigateFallback: 'index.html',

                // Exclure les appels vers le back Render du navigateFallback
                navigateFallbackDenylist: [
                    /^\/api\//,
                    /onrender\.com/,
                ],

                cleanupOutdatedCaches: true,
                skipWaiting: true,
                clientsClaim: true,

                runtimeCaching: [
                    {
                        // Requêtes API vers Render (prod) ou localhost (dev)
                        // NetworkFirst : essaie le réseau, fallback sur le cache
                        urlPattern: ({ url }) => {
                            return (
                                url.pathname.startsWith('/api/v1') ||
                                url.hostname.includes('onrender.com')
                            );
                        },
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache-v1',
                            networkTimeoutSeconds: 10,
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 24 * 60 * 60,
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: ({ request }) => request.destination === 'image',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache-v1',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 7 * 24 * 60 * 60,
                            },
                        },
                    },
                    {
                        urlPattern: ({ request }) =>
                            request.destination === 'font' ||
                            request.destination === 'style',
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'static-assets-v1',
                        },
                    },
                ],
            },
        }),
    ],
})