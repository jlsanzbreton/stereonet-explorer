# Backlog Iterativo — Stereonet Explorer PWA

Repositorio base: `stereonet-explorer`
Branch principal: `main`
Branch de integración: `dev`

## Ticket A — Refactor modular inicial
- **Rama sugerida:** `feature/modules-shell`
- **Objetivo:** Crear estructura de carpetas (`src/core`, `src/features/stereonet`, `src/ui`, `src/state`, `src/i18n`, `src/data`) y mover código actual manteniendo firmas públicas.
- **Criterios de aceptación:**
  - `npm run dev`, `npm run build`, `npm run lint`, `npm run type-check` sin errores.
  - Imports actualizados sin romper funcionalidad actual.
- **Dependencias:** Ninguna.

## Ticket B — i18n y App Shell
- **Rama sugerida:** `feature/i18n-shell`
- **Objetivo:** Integrar `i18next/react-i18next`, añadir `TopNav`, `LanguageSwitch` y reorganizar `App`/`main` para consumir traducciones ES/EN.
- **Criterios de aceptación:**
  - Textos clave traducidos vía i18n.
  - Cambio de idioma refleja UI sin recargar la página.
  - Tooling sigue pasando (`lint`, `type-check`, `build`).
- **Dependencias:** Ticket A.

## Ticket C — Persistencia local con Dexie
- **Rama sugerida:** `feature/offline-dexie`
- **Objetivo:** Integrar Dexie, crear store en `src/state` con persistencia local-first y manejo de fallbacks.
- **Criterios de aceptación:**
  - Altas/Bajas/Ediciones persisten tras recargar.
  - Fallos de Dexie no bloquean la app (fallback en memoria documentado).
- **Dependencias:** Tickets A y B.

## Ticket D — PWA y assets
- **Rama sugerida:** `feature/pwa-upgrade`
- **Objetivo:** Integrar `vite-plugin-pwa`, manifest, assets en `public/` y service worker.
- **Criterios de aceptación:**
  - `npm run preview` permite instalar y usar offline.
  - Deploy en `dev` se verifica en GitHub Pages (staging).
- **Dependencias:** Tickets A–C.

## Ticket E — Funcionalidades educativas e import/export
- **Rama sugerida:** `feature/edu-suite`
- **Objetivo:** Implementar `EduTour`, `CsvDrop` y exportaciones PNG/SVG.
- **Criterios de aceptación:**
  - Tour básico funcional en ES/EN.
  - Import CSV crea entradas válidas.
  - Export PNG/SVG incluye leyenda y metadatos.
- **Dependencias:** Tickets A–D.

## Ticket F — Sincronización opcional con Supabase
- **Rama sugerida:** `feature/cloud-sync`
- **Objetivo:** Añadir integración opcional Supabase cuando haya entorno disponible.
- **Criterios de aceptación:**
  - Hook que sincroniza con Supabase solo si existen variables de entorno.
  - Documentación de seguridad y uso.
- **Dependencias:** Tickets A–E (especialmente C para modelo de datos, D para PWA estable).

> Cada ticket debe fusionarse en `dev` tras QA manual. Cuando `dev` esté estable con un conjunto de tickets, abrir PR `dev` → `main` para despliegue.
