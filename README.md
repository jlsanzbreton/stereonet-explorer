> Proyecto en curso — rama `feature/pwa-upgrade`. Consulta los RFC en `docs/` para el contexto completo.

# Stereonet Explorer

Aplicación React para analizar orientaciones geológicas en un estereonet, pensada para funcionar **offline-first** en aula y campo.

## Requisitos

- Node.js 22.11+ (recomendado 22.18 para alinear con RFC-2025-10)
- npm 10+

## Puesta en marcha

```bash
npm install
npm run dev
```

La app usa `VITE_USE_PAGES_BASE` para decidir si aplica la base `/stereonet-explorer/` (GitHub Pages). Déjalo sin definir durante el desarrollo.

## Scripts frecuentes

- `npm run dev` — servidor de desarrollo.
- `npm run lint` — ESLint sin advertencias.
- `npm run type-check` — comprobación TypeScript sin emitir código.
- `npm run build` — bundle de producción con el service worker.
- `npm run preview` — sirve la build generada; úsalo para probar la PWA.

## PWA y soporte offline

La integración con `vite-plugin-pwa@^1.1.0` registra el service worker mediante `virtual:pwa-register` en `src/main.tsx`. Para verificar el modo offline:

1. Ejecuta `npm run build && npm run preview`.
2. Abre `http://localhost:4173`, instala la PWA y activa el modo avión/Work Offline.
3. Comprueba que la navegación y los datos (Dexie) siguen disponibles.

El manifiesto (`public/manifest.webmanifest`) y los iconos (`public/icons/`) se precachean automáticamente. Añade futuros assets (por ejemplo, tiles de Leaflet) a `public/assets/` o `public/icons/` y quedarán cubiertos por la configuración `workbox.globPatterns`.

## Despliegue en GitHub Pages

Cuando sea necesario usar la base `/stereonet-explorer/`, exporta `VITE_USE_PAGES_BASE=true` antes de ejecutar `npm run build`. El servicio de GitHub Pages servirá `dist/` desde `https://<user>.github.io/stereonet-explorer/`.

## Variables de entorno

El proyecto mantiene compatibilidad con los prompts originales de Gemini (`GEMINI_API_KEY`). Define la clave en `.env.local` si continúas usando esas integraciones.
