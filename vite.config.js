import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            devOptions: {
                enabled: true,
            },
            registerType: 'autoUpdate',
            includeAssets: [
                'favicon.ico',
                'apple-touch-icon.png',
                'logo.png',
                'logo_2.png',
                '**/*.{js,css,html,png,svg,woff,woff2,ttf,ico}',
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
                runtimeCaching: [
                    {
                        // Cette fonction détecte si la requête est destinée à ton API
                        urlPattern: ({ url }) =>
                            url.pathname.startsWith('/api/v1') ||
                            url.origin === 'http://localhost:8080' ||
                            url.origin.includes('onrender.com'),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-responses',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 24 * 60 * 60,
                            },
                            networkTimeoutSeconds: 10,
                        },
                    },
                ],
            },
            build: {
                outDir: 'build'
            }
        }),
    ],
})