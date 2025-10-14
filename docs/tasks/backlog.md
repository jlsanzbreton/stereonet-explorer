# Backlog Iterativo — Stereonet Explorer PWA

Repositorio base: `stereonet-explorer`
Branch principal: `main`
Branch de integración: `dev`

## Ticket A — Refactor modular inicial *(Completado 2025-10-12)*
- **Rama:** `feature/modules-shell`
- **Resumen:** Estructura de carpetas lista según RFC-2025-10 §3, manteniendo firmas públicas.

## Ticket B — i18n y App Shell *(Completado 2025-10-14)*
- **Rama:** `feature/i18n-shell`
- **Resumen:** Integrado `i18next/react-i18next`, creado `LanguageSwitch`, actualizado `App`, `TopNav` y componentes para consumir llaves ES/EN con persistencia en `localStorage`. Claves preparadas para `map`, `layers` y `analysis` según RFC-2025-11.
- **Criterios de aceptación:**
  - Textos clave traducidos vía i18n y namespaces preparados para módulos nuevos ✔️
  - Cambio de idioma refleja la UI sin recargar la página ✔️
  - Tooling (`lint`, `type-check`, `build`) ejecutado sin errores ✔️
- **Dependencias:** Ticket A.
- **Notas:** ver `src/i18n/locales/*` para llaves extendidas de MapView/LayerManager/Analysis.

## Ticket C — Persistencia local con Dexie
- **Rama sugerida:** `feature/offline-dexie`
- **Objetivo:** Integrar Dexie, crear store en `src/state` con persistencia local-first, manejo de fallbacks y campos preparados para `layers` y `geoSources` (sin activarlos aún).
- **Criterios de aceptación:**
  - Altas/Bajas/Ediciones persisten tras recargar.
  - Fallos de Dexie no bloquean la app (fallback en memoria documentado).
- **Dependencias:** Tickets A y B.
- **Notas de preparación RFC-2025-11:** documentar migraciones Dexie v2 y contratos de datos compartidos.

## Ticket D — PWA y assets
- **Rama sugerida:** `feature/pwa-upgrade`
- **Objetivo:** Integrar `vite-plugin-pwa`, manifest, assets en `public/` y service worker, adelantando la documentación de assets Leaflet que llegarán en la siguiente RFC.
- **Criterios de aceptación:**
  - `npm run preview` permite instalar y usar offline.
  - Deploy en `dev` se verifica en GitHub Pages (staging) y se documenta cómo cachear futuros tiles/recursos del mapa.
- **Dependencias:** Tickets A–C.
- **Notas de preparación RFC-2025-11:** registrar requisitos de `globPatterns` y tamaño de bundle cuando se añada Leaflet.

## Ticket E — Funcionalidades educativas e import/export
- **Rama sugerida:** `feature/edu-suite`
- **Objetivo:** Implementar `EduTour`, `CsvDrop`, exportaciones PNG/SVG y generar stubs tipados (`features/map/MapView.tsx`, `features/layers/LayerManager.tsx`, `core/analysis/index.ts`, `services/validation.ts`) enlazados a la RFC-2025-11.
- **Criterios de aceptación:**
  - Tour básico funcional en ES/EN.
  - Import CSV crea entradas válidas.
  - Export PNG/SVG incluye leyenda y metadatos.
  - Stubs y TODOs documentan claramente el traspaso a la RFC-2025-11.
- **Dependencias:** Tickets A–D.

## Ticket F — Sincronización opcional con Supabase
- **Rama sugerida:** `feature/cloud-sync`
- **Objetivo:** Añadir integración opcional Supabase cuando haya entorno disponible y publicar la guía mínima de colaboración/licencias antes de activar sincronización.
- **Criterios de aceptación:**
  - Hook que sincroniza con Supabase solo si existen variables de entorno.
  - Documentación de seguridad, colaboración y uso enlazando la RFC-2025-11 como siguiente paso.
- **Dependencias:** Tickets A–E (especialmente C para modelo de datos, D para PWA estable).
- **Notas de preparación RFC-2025-11:** dejar claro qué datos seguirán siendo locales y cuáles podrían sincronizarse en fases posteriores.

---

## Tickets futuros — RFC-2025-11 (post-fundación)

- **Ticket G — MapView y GeoJSON local (`feature/map-integration`)**: integrar Leaflet/react-leaflet, importar GeoJSON/CSV y sincronizar selección con el estereonet. Depende de Tickets B–E.
- **Ticket H — Gestor de capas (`feature/layer-manager`)**: habilitar `LayerManager` en Dexie y UI de capas. Depende de Ticket G.
- **Ticket I — Análisis automático (`feature/analysis-core`)**: completar `core/analysis`, tests y componentes de resumen. Depende de Ticket H.
- **Ticket J — Colaboración y datasets (`feature/collab-workflows`)**: organizar directorio `datasets/`, guías, licencias y plantillas GitHub. Depende de Tickets G–I.
- **Ticket K — Insights asistidos opcional (`feature/insights-lite`)**: clustering ligero y recomendaciones textuales; requiere validación docente.

> Cada ticket debe fusionarse en `dev` tras QA manual. Cuando `dev` esté estable con un conjunto de tickets, abrir PR `dev` → `main` para despliegue.
