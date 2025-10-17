
# RFC-2025-10 — Stereonet Explorer **PWA Edu** (ES/EN) – Arquitectura, Migración y Roadmap

**Autor:** Walker  
**Solicitante:** Jose (Universidad)  
**Estado:** Propuesto → Aprobado (cuando se mergee `rfc/2025-10-stereonet-pwa`)  
**Fecha:** 2025‑10‑12  
**Repos objetivo:** `stereonet-explorer` (nuevo o el ya existente de Google AI Studio)  
**Compatibilidad Node/NPM:** Node `v22.18.0`, npm `10.9.3` (entorno actual de Jose)  
**Stack base actual:** Vite `^6.2.0`, React `^19.2.0`, TypeScript `~5.8.2` (mantener salvo que se indique lo contrario).
**Librerías clave a incorporar:** D3 (ya presente), Dexie (IndexedDB), i18next/react‑i18next, vite‑plugin‑pwa, (Supabase opcional en fase futura)

---

## 1. Contexto y objetivos

La versión funcional generada en Google AI Studio ya representa **planos y líneas** sobre un estereograma (Schmidt/Wulff). El objetivo es **transformarla** en una **aplicación PWA educativa** e **instalable** (iOS/Android/desktop), **offline‑first**, con **i18n (ES/EN)** y una **arquitectura resiliente** que permita crecer sin “deuda estructural”. La app debe servir **en aula y en campo**.

**Metas principales**  
1) Reorganizar el código en **capas** (core matemático, UI, estado, datos) manteniendo funcionamiento actual.  
2) Añadir **i18n** (ES/EN) y **menú superior** navegable.  
3) Incorporar persistencia **local‑first** con **IndexedDB (Dexie)**; backend **pluggable** (Supabase opcional en etapa posterior).  
4) Convertir a **PWA** (manifest + Service Worker; `vite-plugin-pwa`).  
5) Preparar **boilerplate** de componentes futuros (vacíos pero tipados).  
6) Asegurar **tests mínimos** y **calidad** (ESLint, Lighthouse PWA). Prettier opcional.

Referencias técnicas: **PWA manifest** y **Service Workers (MDN/web.dev)**; **Vite/Vite PWA**; **i18next/react‑i18next**; **Dexie**; **Supabase JS**.  

---

## 2. Non‑Goals (por ahora)

- No se implementa todavía autenticación, entregas a la nube o panel docente (solo _hooks_ y _stubs_).  
- No se añade 3D (Three.js) en esta iteración; mantenemos 2D con D3 para ligereza móvil.  
- No se implementa contorneado Kamb/Vollmer ni estadística Fisher completa (se deja plan en roadmap).

---

## 3. Arquitectura propuesta

```
/public
  index.html
  manifest.webmanifest
  /icons (192, 512, maskable)
  /assets (grid.svg, logo.svg)
/src
  /core               # Matemática y proyecciones (puro TS, sin React)
    projection.ts
    spherical.ts
    fisher.ts         # (stub v1)
    analysis/         # (placeholder RFC-2025-11: cálculos automáticos)
      index.ts        # (stub creado en Iteración E)
  /features
    /stereonet
      components/
        StereonetCanvas.tsx
        GridLayer.tsx
        PlanesLayer.tsx
        LinesLayer.tsx
        Legend.tsx
      hooks/
        useStereonet.ts
      model/
        types.ts
        transforms.ts
    /edu               # (modo docente)
      components/
        EduTour.tsx    # (stub con TODO)
    /import
      CsvDrop.tsx      # (stub)
    /map               # (placeholder RFC-2025-11: Leaflet + GeoJSON)
      MapView.tsx      # (stub creado en Iteración E)
      useGeoLayers.ts  # (stub)
    /layers            # (placeholder RFC-2025-11: gestor de capas)
      LayerManager.tsx # (stub)
      model/
        layerTypes.ts  # (stub)
  /ui
    AppShell.tsx       # layout + TopNav + Footer
    TopNav.tsx
    LanguageSwitch.tsx
    ThemeSwitch.tsx    # (stub)
  /state
    store.ts           # Zustand o Context (elegimos Zustand por simplicidad)
  /data
    samples/
      planes_lines.es.csv
      planes_lines.en.csv
  /i18n
    index.ts
    locales/
      en/common.json
      es/common.json
  /services
    validation.ts      # (placeholder RFC-2025-11: validaciones GeoJSON/CSV)
  /pwa
    sw.ts              # generado por vite-plugin-pwa (virtual)
  app.tsx
  main.tsx
  styles.css
/env
  .env.example         # SUPABASE_URL, SUPABASE_ANON_KEY (opc)
/scripts
  scaffold.sh          # crea boilerplate + icons (opcional)
vite.config.ts
tsconfig.json
.eslintrc.cjs
.prettierrc
```

**Motivación**  
- **Separación de intereses:** `core` (puro TS y testable) vs `features` (UI/estado).  
- **Crecimiento seguro:** `features/*` modulares, fáciles de code-split y preparadas para el eje mapa/capas.  
- **PWA** con `vite-plugin-pwa` para “app‑shell” y _autoUpdate_.  
- **Local‑first** con Dexie; `backend/*` pluggable (Supabase en v2).  
- **Extensibilidad controlada:** `core/analysis`, `features/map`, `features/layers` y `services/validation` quedan definidos como _placeholders_ creados en Iteración E para acelerar la RFC-2025-11 sin refactors.

---

## 4. Plan de **migración** desde la app de Google AI Studio

**Estructura actual detectada (pantallazo):** `App.tsx`, `components/{DataTable.tsx, InputPanel.tsx, Stereonet.tsx, Toolbar.tsx, icons/*}`, `lib/projection.ts`, `constants.ts`, `types.ts`, `index.tsx`, `index.html`.

**Mapa de migración**

| Origen (actual)                 | Destino (nuevo)                              | Acción |
|---------------------------------|----------------------------------------------|-------|
| `lib/projection.ts`             | `src/core/projection.ts`                     | mover / refactor nombres puros |
| `types.ts`                      | `src/features/stereonet/model/types.ts`      | mover |
| `constants.ts`                  | `src/features/stereonet/model/transforms.ts` | fusionar constantes/funciones |
| `components/Stereonet.tsx`     | `src/features/stereonet/components/StereonetCanvas.tsx` | renombrar + desacoplar props |
| `components/InputPanel.tsx`    | `src/features/stereonet/components/Legend.tsx` + `ui/TopNav.tsx` | dividir UI/inputs |
| `components/DataTable.tsx`     | `src/features/stereonet/components/DataTable.tsx`        | mover |
| `components/Toolbar.tsx`       | `src/ui/TopNav.tsx` + `features/stereonet/components/*`  | repartir |
| `index.tsx` / `App.tsx`        | `src/main.tsx` / `src/app.tsx`               | rehacer shell + rutas |

**Estrategia**  
- Crear **adaptadores temporales** (`adapters/legacy.ts`) si algún import rompe.  
- Mantener `export { projectLine, projectPlane }` con **firma estable** hasta finalizar migración.  
- Tests rápidos con datasets de muestra tras cada paso.

---

## 5. Dependencias y _tooling_

`package.json` (extracto objetivo cuando estén todas las iteraciones completadas):
```json
{
  "name": "stereonet-explorer",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.18.0" },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --max-warnings=0",
    "type-check": "tsc --noEmit",
    "pwa:assets": "pwa-assets-generator -i public/icons/icon-512.png -o public/icons"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "d3": "^7.9.0",
    "dexie": "^4.0.4",
    "i18next": "^23.13.0",
    "react-i18next": "^13.7.0",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "typescript": "~5.8.2",
    "vite": "^6.2.0",
    "@vitejs/plugin-react": "^5.0.0",
    "vite-plugin-pwa": "^0.20.0",
    "eslint": "^9.14.0",
    "@eslint/js": "^9.15.0",
    "typescript-eslint": "^8.16.0",
    "prettier": "^3.3.3"
  }
}
```

- **Vite**: build/dev server moderno. citeturn0search2turn0search18  
- **vite-plugin-pwa**: manifiesto + SW con Workbox integrado. citeturn0search3turn0search11turn0search19  
- **i18next/react‑i18next**: i18n robusto en React. citeturn0search12turn0search4  
- **Dexie** para IndexedDB (offline). citeturn0search5turn0search13  
- **D3** para el estereograma. citeturn0search15turn0search7  
- **Supabase** (opcional, v2): `@supabase/supabase-js`. citeturn0search6turn0search22

---

## 6. Configuración clave

### 6.1 `vite.config.ts`
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["/assets/grid.svg"],
      manifest: {
        name: "Stereonet Explorer",
        short_name: "Stereonet",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0b0b0b",
        theme_color: "#0b0b0b",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png}"] }
    })
  ]
});
```
(PWA manifest y SW, ver MDN/web.dev para detalles de miembros de manifiesto y ciclo de vida de SW.) citeturn0search8turn0search0turn0search1

### 6.2 `src/i18n/index.ts`
```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es/common.json";
import en from "./locales/en/common.json";

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
```

**`locales/es/common.json` (extracto)**
```json
{
  "app.title": "Stereonet Explorer",
  "nav.explore": "Explorar",
  "nav.edu": "Modo Aula",
  "nav.settings": "Ajustes",
  "panel.addPlane": "Añadir plano",
  "panel.addLine": "Añadir línea",
  "projection.equalArea": "Igual-Área (Schmidt)",
  "projection.equalAngle": "Igual-Ángulo (Wulff)"
}
```

### 6.3 `src/ui/TopNav.tsx` (menú superior)
```tsx
import { useTranslation } from "react-i18next";
import LanguageSwitch from "./LanguageSwitch";

export default function TopNav(){
  const { t } = useTranslation();
  return (
    <header className="top-nav">
      <h1>{t("app.title")}</h1>
      <nav>
        <a href="#/explore">{t("nav.explore")}</a>
        <a href="#/edu">{t("nav.edu")}</a>
        <a href="#/settings">{t("nav.settings")}</a>
      </nav>
      <LanguageSwitch />
    </header>
  );
}
```

### 6.4 Dexie (persistencia local)
`src/state/store.ts` (extracto):
```ts
import Dexie, { Table } from "dexie";

export interface Orientation {
  id?: number;
  kind: "plane" | "line";
  azimuth: number;
  inclination: number;
  createdAt: number;
}
class StereonetDB extends Dexie {
  orientations!: Table<Orientation, number>;
  constructor(){
    super("stereonet-db");
    this.version(1).stores({ orientations: "++id,kind,azimuth,inclination,createdAt" });
  }
}
export const db = new StereonetDB();
```
(Dexie & IndexedDB.) citeturn0search5

### 6.5 Supabase (stub opcional)
`src/backend/supabase.ts` (stub):
```ts
// optional in v1: used only if env present
export function getSupabase(){
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key);
}
```
(Supabase JS client.) citeturn0search6

---

## 7. Núcleo estereográfico (firmas estables)

`src/core/projection.ts` (extracto, EQ‑AREA/EQ‑ANGLE coherente con tu versión):
```ts
export enum ProjectionType { Schmidt = "schmidt", Wulff = "wulff" }

export function projectLine(trendDeg: number, plungeDeg: number, radius: number, type: ProjectionType){
  const T = (trendDeg * Math.PI) / 180;
  const P = (plungeDeg * Math.PI) / 180;
  let r;
  if (type === ProjectionType.Wulff) {      // igual-ángulo
    r = radius * Math.tan((Math.PI/2 - P) / 2);
  } else {                                  // igual-área (Schmidt)
    r = radius * Math.SQRT2 * Math.sin((Math.PI/2 - P) / 2);
  }
  return { x: r * Math.sin(T), y: -r * Math.cos(T) };
}

// add: projectPlane(strike/dip) → devuelve puntos de gran círculo
```

---

## 8. PWA: manifest y registro

`public/manifest.webmanifest`:
```json
{
  "name": "Stereonet Explorer",
  "short_name": "Stereonet",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0b0b0b",
  "theme_color": "#0b0b0b",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```
(Manifest y SW: ver MDN/web.dev.) citeturn0search0turn0search16

`src/main.tsx` – registro del SW (vite‑plugin‑pwa lo expone automáticamente).

---

## 9. Iteraciones (roadmap y entregables)

### Flujo de ramas
- `main`: producción (Pages).  
- `dev`: integración estable previa a producción.  
- Cada iteración se desarrolla en una rama `feature/<nombre>` partiendo de `dev`; tras QA se fusiona en `dev`. Cuando `dev` esté estable, se abre PR a `main`.

### Iteraciones propuestas

#### **Iteración A — Refactor modular inicial** (`feature/modules-shell`)
- Crear estructura de carpetas descrita en §3 (`src/core`, `src/features/stereonet`, `src/ui`, `src/state`, `src/i18n`, `src/data`).
- Mover archivos actuales a la nueva estructura manteniendo las firmas públicas (`projectLine`, etc.) mediante adaptadores si es necesario.
- No introducir dependencias nuevas aún. Garantizar que `npm run dev`, `build`, `lint`, `type-check` siguen pasando.

- Añadir setup `i18next/react-i18next` y archivos de traducción ES/EN.
- Crear `TopNav`, `LanguageSwitch`, reorganizar `App`/`main` para usar el nuevo shell.
- Revisar textos existentes para usar llaves de traducción, añadiendo namespaces y claves pensadas para vistas futuras (`map`, `layers`, `analysis`). Mantener Dexie y PWA pendientes.
- **Estado:** Completado el 2025-10-14 en `feature/i18n-shell`.

#### **Iteración C — Persistencia local** (`feature/offline-dexie`)
- **Estado:** Completada el 2025-10-16 (pendiente de merge a `dev`).
- Integrado Zustand + Dexie en `src/state/store.ts` para persisitir orientaciones con seed automático de `SAMPLE_DATA`.
- Añadido fallback in-memory cuando IndexedDB falla (ej. modo privado iOS) y bandera `isDexieFallback` documentada.
- Schema anticipa tablas `layers` y `geoSources`; se describen migraciones iniciales en `src/state/README.md`.

#### **Iteración D — PWA y assets** (`feature/pwa-upgrade`)
- **Estado:** Completada el 2025-10-18 en `feature/pwa-upgrade`.
- Integrado `vite-plugin-pwa@1.1.0` con `autoUpdate`, `includeAssets` y `workbox.globPatterns` extendido (`png/jpg/webp`) para anticipar tiles Leaflet.
- `public/` aloja `manifest.webmanifest`, `assets/grid.svg` y iconos 192/512 maskable generados ad hoc; `index.html` referencia manifest y favicon.
- `src/main.tsx` registra el SW con `virtual:pwa-register` y se documentó en el README cómo verificar la instalación offline y cómo activar la base `/stereonet-explorer/` mediante `VITE_USE_PAGES_BASE` cuando toque desplegar en Pages.
- QA ejecutada (`npm run lint`, `npm run type-check`, `npm run build`); `npm run preview` advertido por el sandbox (EPERM al abrir `127.0.0.1:4173`) y Lighthouse pendiente para validación manual en entorno local/GitHub Pages.

#### **Iteración E — Funcionalidades educativas/import/export** (`feature/edu-suite`)
- **Estado:** Completada el 2025-10-19 en `feature/edu-suite`.
- `features/edu/components/EduTour.tsx` incorpora un tour de 4 pasos (ES/EN) con persistencia en `localStorage`; botón accesible desde `TopNav` y documentado en el README.
- `CsvDrop` + `validateCsv` (Papaparse) permiten arrastrar CSV, validan filas (mensajes traducidos) y añaden registros mediante Dexie/Zustand; incluye prueba `src/services/validation.test.ts` (Vitest).
- Toolbar expone exportaciones PNG/SVG con leyenda, fecha y resumen usando `html-to-image`; README describe limitaciones de estilo y cómo extender la plantilla.
- Se añadieron stubs tipados para `features/map/MapView.tsx`, `features/layers/LayerManager.tsx`, `core/analysis/index.ts` y `services/validation.ts` (TODO GeoJSON) alineados con RFC-2025-11.
- QA ejecutada (`npm run lint`, `npm run type-check`, `npm run test`, `npm run build`) y verificación manual: recorrido guiado, importación de CSV de ejemplo y exportación SVG/PNG desde Toolbar.

#### **Iteración F — Opcional backend Supabase** (`feature/cloud-sync`)
- **Estado:** Diferida hasta que haya una necesidad confirmada de backend colaborativo.
- **Motivo:** La aplicación cubre los usos docentes offline mediante Dexie + exportaciones manuales; añadir un servicio remoto implicaría costes de mantenimiento y acuerdos de datos aún no definidos.
- **Próximo paso (cuando aplique):** Revisar proveedores (Supabase u otros), definir políticas de sincronización/licencias y, sólo entonces, habilitar la integración en una rama dedicada.

---

## 10. Seguridad, privacidad y rendimiento

- **Offline‑first**: datos de alumnos locales por defecto (Dexie).  
- **Sin PII** por defecto; si se activa nube: **RLS en Supabase** y scopes mínimos.  
- **Cachés PWA**: invalidaciones por versión (`vite-plugin-pwa` `autoUpdate`).  
- **Lighthouse**: PWA ≥ 90, Performance ≥ 85 móvil.  
- **Accesibilidad**: contraste y `aria-label` en controles clave.

---

## 11. QA y pruebas mínimas

- **Unit**: `core/projection.ts` (casos canónicos de proyección).  
- **E2E manual**: instalar PWA, apagar red, cargar dataset de ejemplo, exportar PNG.  
- **iOS**: comprobar “Añadir a pantalla de inicio” y entrada táctil para audio (si se usa).

---

## 12. Prompt para Codex (pegar tal cual en VS Code)

```
Implementa el RFC-2025-10 (archivo /docs/RFC-2025-10-stereonet-pwa.md):
1) Crea el armazón de carpetas/archivos indicado en §3.
2) Añade package.json, Vite 7, @vitejs/plugin-react e integra vite-plugin-pwa con manifest de §8.
3) Migra los archivos actuales siguiendo la tabla de §4, manteniendo firmas de projectLine/projectPlane.
4) Añade i18n (ES/EN) según §6.2 y TopNav (§6.3). 
5) Crea Dexie (§6.4) y úsalo para persistir nuevas entradas (aunque aún no haya UI).
6) Ejecuta: npm i && npm run dev. Verifica PWA instalable y offline.
7) Comitea en rama rfc/2025-10-stereonet-pwa.
```

---

## 13. Riesgos y mitigaciones

- **Cambios de rutas de import** → usar `adapters/legacy` temporal.  
- **SW en desarrollo** → usar “vite preview” o desactivar SW en `dev`.  
- **Safari/IndexedDB** → Dexie tiene guías específicas; probar en iOS real. citeturn0search21

---

## 14. Apéndice: Enlaces

- MDN **Web App Manifest** / **PWA** / **Service Workers**. citeturn0search0turn0search8turn0search1turn0search9  
- **web.dev**: Manifest. citeturn0search16  
- **Vite** y **vite-plugin-pwa** docs. citeturn0search2turn0search11turn0search19  
- **i18next/react‑i18next**. citeturn0search12turn0search4  
- **Dexie** (IndexedDB). citeturn0search5  
- **Supabase JS**. citeturn0search6  
- **D3**. citeturn0search15

---

## 15. Checklist de aceptación (v1)

- [x] Estructura modular en `core/`, `features/`, `ui/`, `state/` (Iteración A).  
- [x] i18n ES/EN con switch persistente (Iteración B).  
- [ ] Persistencia Dexie correcta (Iteración C).  
- [x] PWA instalable y offline (Iteración D).  
- [x] Export PNG/SVG con leyenda y componentes educativos (Iteración E).  
- [ ] Opcional: Sincronización Supabase cuando se habilite (Iteración F).  
- [ ] Lint/Type-check/Build OK en todas las iteraciones; Lighthouse PWA ≥ 90 al final de Iteración D.

---

**Fin del RFC.**
