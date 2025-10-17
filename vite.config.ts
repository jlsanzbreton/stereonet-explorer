import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const repoBase = '/stereonet-explorer/';
const manifest = JSON.parse(
  fs.readFileSync(new URL('./public/manifest.webmanifest', import.meta.url), 'utf-8')
);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const shouldUseRepoBase = env.VITE_USE_PAGES_BASE === 'true';
    return {
      base: shouldUseRepoBase ? repoBase : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          strategies: 'injectManifest',
          srcDir: 'src/pwa',
          filename: 'sw.ts',
          includeAssets: [
            'assets/grid.svg',
            'icons/icon-192.png',
            'icons/icon-512.png',
            'leaflet/marker-icon.png',
            'leaflet/marker-icon-2x.png',
            'leaflet/marker-shadow.png'
          ], // Explicitly precache Leaflet markers for RFC-2025-10 Iteración G.
          manifest,
          injectManifest: {
            globPatterns: [
              '**/*.{js,css,html,svg,png,ico,json,webmanifest,woff2,jpg,jpeg,webp}'
            ] // keep common raster and font formats so Leaflet tiles drop in later
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
