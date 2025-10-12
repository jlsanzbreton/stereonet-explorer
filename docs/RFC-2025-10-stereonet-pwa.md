
# RFC-2025-10 — Stereonet Explorer **PWA Edu** (ES/EN) – Arquitectura, Migración y Roadmap

**Autor:** Walker  
**Solicitante:** Jose (Universidad)  
**Estado:** Propuesto → Aprobado (cuando se mergee `rfc/2025-10-stereonet-pwa`)  
**Fecha:** 2025‑10‑12  
**Repos objetivo:** `stereonet-explorer` (nuevo o el ya existente de Google AI Studio)  
**Compatibilidad Node/NPM:** Node `v22.18.0`, npm `10.9.3` (entorno actual de Jose)  
**Build tool:** Vite 7 (o el más reciente compatible)  
**Librerías clave:** React + TypeScript, D3, Dexie (IndexedDB), i18next/react‑i18next, vite‑plugin‑pwa, (Supabase opcional)

---

## 1. Contexto y objetivos

La versión funcional generada en Google AI Studio ya representa **planos y líneas** sobre un estereograma (Schmidt/Wulff). El objetivo es **transformarla** en una **aplicación PWA educativa** e **instalable** (iOS/Android/desktop), **offline‑first**, con **i18n (ES/EN)** y una **arquitectura resiliente** que permita crecer sin “deuda estructural”. La app debe servir **en aula y en campo**.

**Metas principales**  
1) Convertir a **PWA** (manifest + Service Worker; `vite-plugin-pwa`).  
2) Reorganizar el código en **capas** (core matemático, UI, estado, datos).  
3) Añadir **i18n** (ES/EN) y **menú superior** navegable.  
4) Persistencia **local‑first** con **IndexedDB (Dexie)**; backend **pluggable** (Supabase opcional).  
5) Preparar **boilerplate** de componentes futuros (vacíos pero tipados).  
6) Asegurar **tests mínimos** y **calidad** (ESLint/Prettier, Lighthouse PWA).

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
- **Crecimiento seguro:** `features/*` modulares, fáciles de code-split.  
- **PWA** con `vite-plugin-pwa` para “app‑shell” y _autoUpdate_.  
- **Local‑first** con Dexie; `backend/*` pluggable (Supabase en v2).

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

`package.json` (extracto):
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
    "lint": "eslint \"src/**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit",
    "pwa:assets": "pwa-assets-generator -i public/icons/icon-512.png -o public/icons"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "d3": "^7.9.0",
    "dexie": "^4.0.4",
    "i18next": "^23.13.0",
    "react-i18next": "^13.7.0",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "vite": "^7.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite-plugin-pwa": "^0.20.0",
    "eslint": "^9.14.0",
    "@typescript-eslint/eslint-plugin": "^8.12.0",
    "@typescript-eslint/parser": "^8.12.0",
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

### **Iteración 0 – Scaffold + PWA + i18n (5 días)**
- Crear repo `stereonet-explorer` y rama `rfc/2025-10-stereonet-pwa`.
- Añadir `package.json`, Vite, PWA, ESLint/Prettier, i18n, Dexie (sin usar aún).
- Migrar archivos de **Google AI Studio** al nuevo árbol (tabla §4).  
**Criterios de aceptación**:  
PWA instalable, app abre offline, switch ES/EN, TopNav visible, el estereonet actual funciona.

### **Iteración 1 – Capa core & features (1 semana)**
- Aislar proyecciones en `core/` + tests básicos.  
- `features/stereonet/*`: Canvas, GridLayer, PlanesLayer, LinesLayer, Legend.  
- Estado en Zustand; guardado simple a Dexie.  
**Criterios**: no hay “importes cruzados” UI↔core; datasets persisten offline.

### **Iteración 2 – Aula (1 semana)**
- `features/edu/EduTour.tsx`: demo guiada (texto ES/EN).  
- Import CSV básico (`features/import/CsvDrop.tsx`).  
- Export PNG/SVG con leyenda y metadatos.  
**Criterios**: demo reproducible, export correcto con proyección y fecha.

### **Iteración 3 – Opcional backend (1–2 semanas)**
- Hooks `useCloudSync()` (si Supabase env está presente).  
- Políticas RLS y tablas mínimas (orientations, classes, submissions).  
**Criterios**: subida opcional, sin bloquear el uso offline.

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

- [ ] Instalación como PWA en iOS/Android/desktop.  
- [ ] Arranque **sin red** (app‑shell).  
- [ ] i18n ES/EN con switch persistente.  
- [ ] Estructura modular en `core/`, `features/`, `ui/`, `state/`.  
- [ ] Persistencia Dexie correcta (inserción y lectura).  
- [ ] Export PNG/SVG con leyenda.  
- [ ] Lint/format OK; Lighthouse PWA ≥ 90.

---

**Fin del RFC.**
