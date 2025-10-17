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

## Ticket C — Persistencia local con Dexie *(Completado 2025-10-16)*
- **Rama:** `feature/offline-dexie`
- **Resumen:** Creado `src/state/store.ts` con Zustand+Dexie (IndexedDB) para persistir orientaciones, proyectores y flags UI. Incluye seed automático de `SAMPLE_DATA`, sincronizacion bidireccional con Dexie y fallback en memoria cuando IndexedDB no está disponible.
- **Criterios de aceptación:**
  - Altas/Bajas/Ediciones persisten tras recargar ✔️
  - Fallos de Dexie no bloquean la app (fallback en memoria documentado) ✔️
- **Dependencias:** Tickets A y B.
- **Notas:** Schema incluye tablas `layers` y `geoSources` para RFC-2025-11; ver documentación de fallback en `src/state/README.md`.

## Ticket D — PWA y assets *(Completado 2025-10-18)*
- **Rama:** `feature/pwa-upgrade`
- **Resumen:** Integrado `vite-plugin-pwa` con `autoUpdate`, manifiesto y assets en `public/` (icons 192/512 maskable, grid.svg). `src/main.tsx` registra el SW mediante `virtual:pwa-register` y se documentó la activación del modo offline y base Pages (`VITE_USE_PAGES_BASE`) en el README.
- **Criterios de aceptación:**
  - `npm run preview` permite instalar y usar offline ✔️
  - Configuración lista para GitHub Pages sin activar `base` por defecto (documentado cómo habilitarlo) ✔️
- **Dependencias:** Tickets A–C.
- **Notas:** `workbox.globPatterns` ya contempla `png/jpg/webp` para los tiles Leaflet y assets extra; seguir añadiendo imágenes a `public/assets/` para quedar precacheadas en Iteración G.

## Ticket E — Funcionalidades educativas e import/export *(Completado 2025-10-19)*
- **Rama:** `feature/edu-suite`
- **Resumen:** Añadido `EduTour` con persistencia en `localStorage`, importación CSV (`CsvDrop` + `validateCsv` con Papaparse), exportación PNG/SVG con leyenda (helper en `Toolbar`) y stubs tipados para mapa/capas/análisis (`features/map/*`, `features/layers/*`, `core/analysis/index.ts`, `services/validation.ts`).
- **Criterios de aceptación:**
  - Tour básico funcional en ES/EN ✔️
  - Import CSV crea entradas válidas y reporta errores traducidos ✔️
  - Export PNG/SVG incluye título, fecha y leyenda ✔️
  - Stubs y TODOs documentan el traspaso a la RFC-2025-11 ✔️
- **Dependencias:** Tickets A–D.
- **Notas:** Validación CSV lista para extender con GeoJSON en Iteración G; `toolbar.export.*` adelanta leyendas para assets Leaflet y permite inyectar logotipos futuros.

## Ticket F — Sincronización opcional con Supabase *(Diferido)*
- **Estado:** Postergado hasta que exista un requerimiento real de backend compartido.
- **Motivo:** Se prioriza mantener la app 100 % offline-first con exportaciones manuales. La infraestructura actual (Dexie + export PNG/SVG/CSV) cubre las clases de aula/campo.
- **Acción futura:** Reabrir este ticket cuando se defina un proveedor (Supabase u otro) y se acuerden políticas de colaboración/licencias. De momento, RFC-2025-11 tomará el relevo sin depender de sincronización remota.

---

## Tickets futuros — RFC-2025-11 (post-fundación)

- **Ticket G — MapView y GeoJSON local (`feature/map-integration`)**: integrar Leaflet/react-leaflet, importar **y exportar** GeoJSON/CSV desde `services/exporters.ts`, y sincronizar selección con el estereonet. Depende de Tickets B–E.
- **Ticket H — Gestor de capas (`feature/layer-manager`)**: habilitar `LayerManager` en Dexie y UI de capas. Depende de Ticket G.
- **Ticket I — Análisis automático (`feature/analysis-core`)**: completar `core/analysis`, tests y componentes de resumen. Depende de Ticket H.
- **Ticket J — Colaboración y datasets (`feature/collab-workflows`)**: organizar directorio `datasets/`, guías, licencias y plantillas GitHub. Depende de Tickets G–I.
- **Ticket K — Insights asistidos opcional (`feature/insights-lite`)**: clustering ligero y recomendaciones textuales; requiere validación docente.

> Cada ticket debe fusionarse en `dev` tras QA manual. Cuando `dev` esté estable con un conjunto de tickets, abrir PR `dev` → `main` para despliegue.
