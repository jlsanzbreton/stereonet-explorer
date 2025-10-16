# State Layer

This directory hosts the application store and any shared state helpers.

## Stereonet store

`store.ts` exposes a Zustand store backed by Dexie (IndexedDB). It persists:

- orientation entries (`plane` / `line`)
- placeholder tables for future `layers` and `geoSources` work

On bootstrap the store hydrates from IndexedDB and, if the database is empty, seeds the `SAMPLE_DATA`. Every change writes to Dexie and keeps an in-memory mirror so the UI can stay responsive.

### Fallback mode

Some browsers (e.g. iOS private mode) block IndexedDB. When Dexie throws, the store logs a warning once, flips to `isDexieFallback=true`, and continues operating in-memory. Users can keep working without losing the session, and the UI can surface the flag if we decide to display a toast later.
