# RFC-2025-11 — Stereonet Explorer **Mobile UI + GPS**

**Autor:** GitHub Copilot (Walker)
**Solicitante:** Jose (Universidad)
**Estado:** Propuesto
**Fecha:** 2025-10-18
**Repositorio objetivo:** stereonet-explorer

---

## 1. Contexto

La iteración H amplió funcionalidades (Leaflet, gestor de capas, importaciones) pero elevó la fricción en la interfaz, sobre todo en móviles. El mapa y el estereonet comparten poco espacio, el `TopNav` desaparece al hacer scroll y los paneles secundarios saturan la vista.

Uso principal: trabajo de campo en dispositivos móviles. Necesitamos una experiencia móvil limpia, con control táctil eficiente y acceso rápido a herramientas críticas (Mapa, Estereonet, GPS, capa educativa). En escritorio debemos conservar un modo rico que aproveche el espacio, pero sin penalizar la simplicidad base.

---

## 2. Objetivos

1. **Rediseñar la shell mobile-first** con Leaflet y Stereonet visibles o rápidamente accesibles.
2. **Simplificar paneles secundarios** usando cajones/deslizables (“persianas”) para capas, datos estructurales, importaciones.
3. **Garantizar accesos persistentes**: `TopNav` fijo, toolbar compacta con acciones prioritarias.
4. **Introducir modo GPS** que precargue coordenadas en nuevos registros y facilite captura en campo.
5. Dejar alineado el sistema para futuras extensiones (modo escritorio enriquecido, analytics, etc.).

Non-goals inmediatos: autenticación, sincronización cloud, mejoras complejas en análisis estructural. El foco es UX/IA (mobile) y GPS básico.

---

## 3. Requisitos de producto

- **Mobile-first:** mapa y estereonet siempre visibles o a un tap (tabs/pestañas o split). El mapa debe conservar el foco en la zona de trabajo.
- **Paneles colapsables:** capas, datos estructurales e importaciones se abren como drawers deslizables desde los bordes, con estado recordado. Ninguno se mantiene abierto por defecto en móvil.
- **Header sticky:** `TopNav` fijo en la parte superior, con controles compactos; menú overflow para acciones secundarias.
- **Toolbar contextual:** botones flotantes para importar, crear orientación, activar GPS. Deben respetar accesibilidad (44px mínimo, contraste).
- **Modo GPS:**
  - Toggle global accesible desde mapa/toolbar.
  - Cuando está activo y la geolocalización está disponible, precargar `latitude/longitude` para nuevos planos/líneas.
  - Mostrar estado: buscando, fijado (con precisión), error/permisos denegados.
  - Permitir ajustes manuales posteriores.
- **Sincronización de vista:** mapa centra la zona relevante al iniciar o tras importar datos; al seleccionar un registro desde el stereonet o tabla, ambos (mapa/sphere) resaltan en sincronía.
- **Escritorio:** al superar breakpoint (`lg` o similar) se activa modo dual-pane: mapa + stereonet visibles en paralelo; drawers pueden permanecer anclados.

---

## 4. Requisitos técnicos

- **Layout:**
  - Implementar `AppShell` con CSS Grid + utilidades responsive.
  - Introducir contenedor `Viewport` que gestione altura `100dvh` en móviles (solucionar Safari).
  - `TopNav` y footer usan `position: sticky` / `position: fixed` según necesidad.
- **Gestión de paneles:**
  - Crear `useDrawerState` en Zustand (persistido) para recordar paneles abiertos.
  - Reutilizar componentes existentes (`LayerManager`, `DataTable`, `InputPanel`) dentro de wrappers `Drawer`.
  - Optimizar montado perezoso (lazy) para paneles raramente usados en móvil.
- **Modo GPS:**
  - Nuevo slice en Zustand (`gps`) con `isEnabled`, `status`, `position`. Mantener `watchPosition` mientras el modo esté activo.
  - Servicios: `features/map/hooks/useGeoLocation.ts` encapsula permisos, fallback manual y limpieza.
  - Integrar con `addPlane`/`addLine`: si `gps.status === "fixed"`, rellenar `latitude/longitude` al abrir formulario.
  - Guardar precisión (`coords.accuracy`) para mostrar advertencias (>25 m).
- **Mapa:**
  - Reintroducir `fitBounds` automático en función de datos georreferenciados y firma que evita jitter. (Validar con 3 o más puntos.)
  - Añadir botón “centrar en posición actual” (usa GPS/toggle).
- **Componentes globales:**
  - `TopNav` compacto en móvil: icon-only para idioma, ajustes; menú `More` con opciones extra.
  - `FloatingActionGroup` (FAB) que agrupe importar, crear, GPS.
  - Revisión de tipografías y espaciado (Tailwind tokens).
- **Accesibilidad:** aria labels, foco gestionado en drawers, contraste AA.

---

## 5. Plan de implementación (Iteración I propuesta)

1. **Shell responsive** (`feature/mobile-shell`)
   - Refactor de `app.tsx` + `TopNav` para layout sticky y contenedores flex/grid.
   - Introducir componentes `MobileTabs` (Mapa vs Stereonet) y `DesktopSplitPane`.
   - Migrar paneles a drawers (`LayerDrawer`, `DataDrawer`, `ImportDrawer`).
   - QA: responsive en iPhone Safari, Android Chrome, desktop.
2. **Estado de drawers y toolbar** (`feature/drawer-state`)
   - Añadir slice Zustand para drawers + persistencia.
   - Crear `FloatingActionGroup` con accesos rápidos; integrar con drawers.
   - Ajustar `LayerManager`, `DataTable`, `InputPanel` para modo drawer.
3. **Modo GPS** (`feature/gps-mode`)
   - Implementar hook geolocalización, slice Zustand, UI de estado.
   - Añadir toggle, botón centrar, autocompletado de coordenadas al crear orientaciones.
   - Manejo de permisos y fallbacks (mensajes i18n).
4. **Pulido y QA** (`feature/mobile-polish`)
   - Afinar animaciones, accesibilidad, test manual de import/export con GPS.
   - Actualizar documentación (`README`, `docs/state`, `docs/UX`).

Cada fase abre PR independiente hacia `dev`. Tras merge se planifica despliegue en Pages para validación externa.

---

## 6. Riesgos y mitigaciones

- **Riesgo:** `navigator.geolocation` indisponible (iOS sin HTTPS, permisos bloqueados).
  - **Mitigación:** fallback manual, mensajes claros, guardar último punto válido.
- **Riesgo:** drawers en móvil oculten contenido crítico.
  - **Mitigación:** accesos visibles en toolbar, tutorial inicial (modo educativo) explicando interacción.
- **Riesgo:** cambios de layout rompan escritorio existente.
  - **Mitigación:** mantener modo escritorio en `lg:`+ clases y probar en viewport grande.
- **Riesgo:** consumo de batería al usar `watchPosition`.
  - **Mitigación:** activar solo con modo GPS on; detener al cerrar app/pantalla.

---

## 7. Entregables y criterios de aceptación

- `app.tsx`, `TopNav`, `MapView`, `StereonetCanvas` actualizados para nuevo layout responsive.
- Drawers funcionales para capas, datos, importaciones; estado persistido.
- Modo GPS operativo con UI, mensajes y autocompletado de coordenadas.
- Tests manuales checklist: mobile Chrome/Safari, escritorio Chrome/Firefox.
- Documentación actualizada: README (modo móvil, GPS), `docs/state/README.md` (nuevo slice), changelog en `docs/tasks/backlog.md`.

---

## 8. Seguimiento

- Una vez aprobada la RFC, abrir issue maestros para las iteraciones listadas (I1–I4) con responsables y estimaciones.
- Coordinar sesiones de prueba en campo (profesor + alumnos) tras la iteración GPS para validar flujo real.
