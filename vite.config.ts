import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

/**
 * Aplikacja mobilna (Capacitor): `VITE_PLATFORM=native vite build` buduje do dist-mobile/
 * bez service workera i manifestu PWA, bez konfiguracji Firebase i bez czcionek pobieranych
 * z internetu — aplikacja w sklepie nie łączy się z żadną usługą zewnętrzną poza serwerem
 * LimeSurvey użytkownika.
 */
const native = process.env.VITE_PLATFORM === 'native';
const outDir = native ? 'dist-mobile' : 'dist';

export default defineConfig(() => {
  return {
    build: { outDir },
    plugins: [
      react(),
      tailwindcss(),
      native && {
        name: 'native-index-html',
        transformIndexHtml(html: string): string {
          return html
            // bez czcionek pobieranych z internetu — aplikacja używa czcionek systemowych
            .replace(/\s*<link\b[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>/g, '')
            // jak w aplikacji natywnej: bez powiększania strony po dotknięciu pola formularza
            .replace(/(<meta name="viewport" content=")[^"]*(")/, '$1width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover$2');
        },
      },
      !native && VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        manifest: {
          id: '/',
          name: 'LimeControl',
          short_name: 'LimeControl',
          description: 'Aplikacja PWA do zarządzania instancjami LimeSurvey przez API RemoteControl 2: ankiety, harmonogram, uczestnicy, szablony i eksport wyników.',
          theme_color: '#1b5e36',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          lang: 'pl',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, outDir);
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        // Konfiguracja Firebase jest potrzebna tylko usłudze chmurowej. Własna instalacja (AUTH_MODE=local)
        // buduje się bez tego pliku — moduł Firebase dostaje wtedy pusty zamiennik i nie jest ładowany.
        // VITE_AUTH_MODE=local wymusza zamiennik także wtedy, gdy plik istnieje (obraz dla własnej instalacji).
        '#firebase-config':
          process.env.VITE_AUTH_MODE !== 'local' && !native && fs.existsSync(path.resolve(__dirname, 'firebase-applet-config.json'))
            ? path.resolve(__dirname, 'firebase-applet-config.json')
            : path.resolve(__dirname, 'src/backend/firebase-config.stub.json'),
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
