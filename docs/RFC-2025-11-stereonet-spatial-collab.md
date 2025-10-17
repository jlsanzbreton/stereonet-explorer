# RFC-2025-11 — Stereonet Explorer **Mapas, Capas y Colaboración**

**Autor:** Walker  
**Solicitante:** Jose (Universidad)  
**Estado:** Borrador  
**Fecha:** 2025-10-13  
**Repos objetivo:** `stereonet-explorer`  
**Bloque previo:** RFC-2025-10 — Stereonet Explorer PWA Edu (foundation)

---

## 1. Contexto y objetivos

Tras completar la fase fundacional descrita en la RFC-2025-10 (Iteraciones A–F), la aplicación ya cuenta con arquitectura modular, i18n, persistencia local con Dexie y base PWA. El siguiente paso es añadir **contexto espacial**, **gestión avanzada de capas**, **análisis automático** y **mecanismos de colaboración educativa** sin sacrificar el enfoque offline-first.

**Metas principales**  
1) Integrar visualización geoespacial (Leaflet + GeoJSON) sincronizada con el estereonet.  
2) Promover un gestor de capas flexible (visibilidad, estilo, agrupación).  
3) Incorporar análisis geométricos automáticos (polos, intersecciones, densidades).  
4) Fortalecer flujos colaborativos y de publicación (datasets, licencias, GitHub Classroom).  
5) Mantener la seguridad local y compatibilidad con el trabajo previo (Dexie, PWA, i18n).

---

## 2. Alcance y exclusiones

**Incluye**  
- Mapa interactivo Leaflet con carga local de GeoJSON/CSV.  
- Layer Manager con tipado fuerte y UI para controlar visibilidad, estilo y jerarquías.  
- `core/analysis` con funciones deterministas (plane/pole conversions, clustering básico, densidad con `d3-contour`).  
- Validación de archivos y mensajes de seguridad (“datos locales”).  
- Organización de datasets y documentación colaborativa en GitHub.

**Excluye (por ahora)**  
- Backends remotos; Supabase permanece opcional y sincroniza únicamente cuando se habilite (RFC futura).  
- Autenticación o roles en línea.  
- Funcionalidad 3D o renderizados volumétricos.  
- IA pesada en el navegador (se deja en roadmap).

---

## 3. Arquitectura incremental

La estructura de la RFC-2025-10 se amplía con los _placeholders_ ya creados en Iteración E:

```
/src
  /core
    projection.ts
    spherical.ts
    fisher.ts
    analysis/
      index.ts             # punto de entrada a cálculos
      stats.ts             # medias, densidad, clustering
      transforms.ts        # conversiones plano ↔ polo ↔ geo
  /features
    /map
      MapView.tsx          # Leaflet + sincronización Dexie
      GeoLayerToggle.tsx   # UI de capas de mapa
      useGeoLayers.ts      # hook para interactuar con LayerManager
    /layers
      LayerManager.ts      # lógica compartida mapa/estereonet
      model/
        layerTypes.ts      # tipado Layer, LayerStyle
      components/
        LayerPanel.tsx     # UI principal de capas
    /analysis
      components/
        AnalysisSummary.tsx
        DensityPreview.tsx
      hooks/
        useAnalysis.ts
    /stereonet
      ... (mantiene componentes existentes)
  /services
    validation.ts          # reglas GeoJSON/CSV + mensajes de advertencia
    exporters.ts           # export CSV/GeoJSON/PNG actualizados
  /datasets
    examples/
    user-guides/
    templates/
```

---

## 4. Bloques funcionales

### 4.1 Integración con mapas y GeoJSON (Eje A)
- **Leaflet + react-leaflet:** mapa base ligero compatible PWA.  
- **Carga local:** FileReader → parser GeoJSON/CSV → validación → Dexie.  
- **Exportación offline:** Dexie → CSV/GeoJSON mediante `services/exporters` para compartir datos de campo.  
- **Sincronización bidireccional:** seleccionar un feature resalta plano/polo asociado en el estereonet y viceversa.  
- **Modo sandbox:** opción para trabajar sin persistencia (señalado mediante `services/validation`).

### 4.2 Gestor de capas (Eje B)
- **LayerManager:** controla visibilidad, color, opacidad, orden, tipo (`planes`, `lines`, `poles`).  
- **UI:** panel lateral con toggles, selectores de color y sliders; accesible vía teclado.  
- **Extensibilidad:** soporta capas docentes predefinidas, escenarios colaborativos y filtros.

### 4.3 Análisis automático (Eje C)
- **Cálculos puros:** `planeToPole`, `intersection`, `meanOrientation`, `densityMap` (con `d3-contour`).  
- **Resumen visual:** componente `AnalysisSummary` muestra resultados clave (texto, gráficos).  
- **Exportación:** CSV/JSON con resultados de análisis, manteniendo offline-first.

### 4.4 Colaboración y sostenibilidad (Ejes D, E)
- **Datasets versionados:** directorio `datasets/` con ejemplos y plantillas; instrucciones para contribuir vía PR.  
- **Tooling GitHub:** issues templados, GitHub Projects, GitHub Classroom como flujo sugerido.  
- **Licencias:** MIT para código + CC BY-NC-SA para material educativo.  
- **Guías:** `docs/tutorials/` y `docs/exercises/` con pasos reproducibles.

### 4.5 Robustez y modularidad (Eje F)
- **Contexto compartido:** `DataContext` conecta mapa, estereonet y análisis.  
- **Dexie schema v2:** añade tablas `layers`, `geo_sources`, `analysis_cache`.  
- **PWA:** workbox pre-cachea assets Leaflet; `vite.config.ts` amplía `globPatterns` y recursos.

---

## 5. Dependencias y tooling

Agregar a `package.json` cuando inicien las iteraciones correspondientes:

```
"dependencies": {
  "leaflet": "^1.9.4",
  "react-leaflet": "^5.0.0",
  "@types/geojson": "^7946.0.8",
  "mathjs": "^13.0.1",
  "d3-contour": "^4.0.2"
},
"devDependencies": {
  "@types/leaflet": "^1.9.9"
}
```

- **Leaflet/react-leaflet:** mapa interactivo.  
- **@types/geojson:** tipado para validaciones.  
- **mathjs + d3-contour:** soporte para análisis y densidad.  
- **Testing adicional:** jest/vitest opcional para funciones de análisis.

---

## 6. Compatibilidad y migración de datos

- **Dexie:** migrar de versión 1 → 2 manteniendo orientaciones existentes. Añadir índices adecuados (`layers`, `layerId`).  
- **Archivos legacy:** CSV actuales deben mapearse a la estructura `Layer` por defecto (`default-layer`).  
- **Backward compatibility:** si `LayerManager` no está habilitado (feature flag), la app continúa operando como en RFC-2025-10.

---

## 7. Iteraciones propuestas (posteriores a F)

#### **Iteración G — MapView y GeoJSON local** (`feature/map-integration`)
- Integrar Leaflet/react-leaflet y renderizar datos desde Dexie.  
- Implementar importación GeoJSON/CSV con validación básica.  
- Habilitar exportación offline GeoJSON/CSV con `services/exporters`.  
- Sincronizar selección mapa ↔ estereonet.

#### **Iteración H — Gestor de capas** (`feature/layer-manager`)
- Implementar `LayerManager` en Dexie y en la UI.  
- Añadir controles de visibilidad, opacidad, color y agrupaciones básicas.  
- Actualizar exportaciones/CSV para reflejar la jerarquía de capas.

#### **Iteración I — Análisis automático** (`feature/analysis-core`)
- Completar `core/analysis` con funciones matemáticas puras y tests.  
- Mostrar resúmenes en `AnalysisSummary` y gráficos de densidad.  
- Permitir exportar resultados (CSV/JSON) y adjuntar a dataset.

#### **Iteración J — Colaboración y datasets** (`feature/collab-workflows`)
- Organizar `datasets/` y documentar flujos en `docs/tutorials/` y `docs/exercises/`.  
- Añadir plantillas de issues/PRs, `CONTRIBUTING.md`, guía para GitHub Classroom.  
- Publicar política de licencias (MIT + CC BY-NC-SA).

#### **Iteración K — Insights asistidos (opcional)** (`feature/insights-lite`)
- Implementar clustering ligero (PCA/K-means) ejecutado en cliente.  
- Generar recomendaciones textuales básicas (“Eje NE-SW probable”).  
- Requiere feedback docente antes de pasar a producción.

---

## 8. QA y métricas

- **Unit tests:** `core/analysis` (conversiones, intersecciones, medias).  
- **Integration tests:** importación GeoJSON ↔ render estereonet ↔ export.  
- **Manual:** verificación PWA offline con mapa y capas, validaciones de datos incorrectos.  
- **Lighthouse:** mantener PWA ≥ 90, Performance ≥ 80 (Leaflet puede bajar el score si no se cuidan assets).

---

## 9. Riesgos y mitigaciones

- **Tamaño de bundle Leaflet:** usar imports dinámicos y control de assets.  
- **IndexedDB storage limits:** ofrecer limpieza de capas/datasets desde la UI.  
- **Validaciones GeoJSON:** sanitizar propiedades y limitar tamaños de archivos.  
- **Accesibilidad del mapa:** garantizar teclado/lectores de pantalla (roles ARIA y alternativas textuales).  
- **Sincronización mapa ↔ estereonet:** definir contrato de datos común (`OrientationFeature`).

---

## 10. Checklist de aceptación (fase Mapas/Capas)

- [ ] MapView Leaflet integrado y offline-ready (Iteración G).  
- [ ] Importación/exportación GeoJSON y CSV validada (Iteración G/H).  
- [ ] LayerManager funcional con UI accesible (Iteración H).  
- [ ] Análisis automático y exportaciones científicas (Iteración I).  
- [ ] Guías colaborativas y licenciamiento publicados (Iteración J).  
- [ ] Insights asistidos opcionales evaluados (Iteración K).  
- [ ] Tooling (lint/type-check/tests) actualizado con dependencias nuevas.

---

**Fin del RFC.**
