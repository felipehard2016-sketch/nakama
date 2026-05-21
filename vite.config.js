import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Nakama — Anime Tracker',
        short_name: 'Nakama',
        description: 'Acompanhe seus animes e mangás favoritos',
        theme_color: '#7c3aed',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        /*
         * ─── ATENÇÃO: JS e HTML removidos do precache ──────────────────────
         *
         * Problema anterior: o SW usava CacheFirst para index.html (via
         * NavigationRoute + createHandlerBoundToURL). Após um novo deploy,
         * o SW continuava servindo o index.html antigo, que referenciava
         * chunks com hash antigo — ainda na cache do SW → código quebrado.
         *
         * Solução:
         *   • Não precachear JS: chunks têm hash imutável (1 ano no browser
         *     via vercel.json), o browser HTTP cache já cuida disso.
         *   • Não precachear HTML: navegações vão direto à rede → sempre
         *     recebem o index.html atualizado do Vercel.
         *   • SW cuida apenas de fontes, ícones e CSS (raramente mudam).
         * ──────────────────────────────────────────────────────────────── */
        globPatterns: ['**/*.{css,ico,png,svg,woff2,woff,ttf}'],

        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,

        /* navigateFallback: null desativa o NavigationRoute automático do VitePWA.
         * Sem isso, o SW usa CacheFirst para index.html → serve HTML antigo após deploys. */
        navigateFallback: null,

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/graphql\.anilist\.co/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'anilist-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/s4\.anilist\.co/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'anilist-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
});
