import { useMemo } from 'react';

export interface GeoLayerDescriptor {
  id: string;
  name: string;
  type: 'geojson' | 'raster' | 'tile';
  source?: string;
  visible: boolean;
}

/**
 * Placeholder hook for RFC-2025-11. The implementation will connect Leaflet layers
 * with Dexie-backed metadata so they can be toggled alongside stereonet data.
 */
export function useGeoLayers(): GeoLayerDescriptor[] {
  return useMemo(
    () => [
      {
        id: 'base-layer',
        name: 'Base Layer (placeholder)',
        type: 'tile',
        source: undefined,
        visible: true,
      },
    ],
    []
  );
}

export default useGeoLayers;
