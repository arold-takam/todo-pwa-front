import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    // ← build.outDir ici, PAS dans VitePWA
    build: {
        outDir: 'dist',
    },

    plugins: [
        react(),
        VitePWA({
            // Le SW se met à jour automatiquement sans demander à l'utilisateur
            registerType: 'autoUpdate',

            // Active le SW même en dev (utile pour tester l'offline)
            devOptions: {
                enabled: true,
                type: 'module',
            },

            // Assets à précacher (shell de l'app)
            includeAssets: [
                'favicon.ico',
                'logo.png',
                'logo_2.png',
                'apple-touch-icon.png',
            ],

            // Manifest Web App (installabilité PWA)
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

            // Configuration Workbox (Service Worker)
            workbox: {
                // Précache tous les assets compilés
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}'],

                // SPA : toute navigation non trouvée → index.html
                // Indispensable pour que /add/task et /update/task fonctionnent
                // après installation en mode standalone
                navigateFallback: 'index.html',

                // Exclure les requêtes API du navigateFallback
                navigateFallbackDenylist: [/^\/api\//],

                // Purger les caches des anciennes versions du SW
                cleanupOutdatedCaches: true,

                // Prendre le contrôle immédiatement sans attendre le prochain rechargement
                skipWaiting: true,
                clientsClaim: true,

                // Stratégies de cache par type de ressource
                runtimeCaching: [
                    {
                        // Requêtes API → NetworkFirst avec fallback cache
                        // Fonctionne pour : /api/v1/... (Docker local)
                        // et https://mon-back.onrender.com/api/v1/... (prod)
                        urlPattern: ({ url, request }) => {
                            return (
                                url.pathname.startsWith('/api/v1') ||
                                url.origin.includes('onrender.com') ||
                                request.destination === 'fetch' && url.pathname.startsWith('/api')
                            );
                        },
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache-v1',
                            networkTimeoutSeconds: 8,
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 24 * 60 * 60, // 24h
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        // Images → CacheFirst (rarement changées)
                        urlPattern: ({ request }) => request.destination === 'image',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache-v1',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 jours
                            },
                        },
                    },
                    {
                        // Polices / fonts → CacheFirst
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