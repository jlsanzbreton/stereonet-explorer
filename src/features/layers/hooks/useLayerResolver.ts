import { useCallback, useEffect, useRef } from 'react';
import type { Layer, LayerKind } from '../model/layerTypes';
import {
  selectDefaultLayerId,
  selectLayers,
  useStereonetStore,
} from '@/state/store';
import type { LayerHint } from '@/services/validation';

interface LayerCache {
  byId: Map<number, Layer>;
  byName: Map<string, Layer>;
}

const normalizeName = (name: string): string => name.trim().toLowerCase();

export const useLayerResolver = (fallbackKind: LayerKind = 'map') => {
  const layers = useStereonetStore(selectLayers);
  const defaultLayerId = useStereonetStore(selectDefaultLayerId);
  const addLayer = useStereonetStore((state) => state.addLayer);

  const cacheRef = useRef<LayerCache>({
    byId: new Map(),
    byName: new Map(),
  });

  useEffect(() => {
    const nextCache: LayerCache = {
      byId: new Map(),
      byName: new Map(),
    };
    layers.forEach((layer) => {
      nextCache.byId.set(layer.id, layer);
      nextCache.byName.set(normalizeName(layer.name), layer);
    });
    cacheRef.current = nextCache;
  }, [layers]);

  const resolveLayerId = useCallback(
    async (hint?: LayerHint): Promise<number | null> => {
      const cache = cacheRef.current;

      if (hint?.layerId !== undefined && hint.layerId !== null) {
        const numericId =
          typeof hint.layerId === 'string'
            ? Number.parseInt(hint.layerId, 10)
            : hint.layerId;
        if (Number.isFinite(numericId)) {
          const cached = cache.byId.get(numericId as number);
          if (cached) {
            return cached.id;
          }
        }
      }

      if (hint?.layerName) {
        const key = normalizeName(hint.layerName);
        const cached = cache.byName.get(key);
        if (cached) {
          return cached.id;
        }

        const created = await addLayer({
          name: hint.layerName.trim(),
          kind: hint.layerKind ?? fallbackKind,
        });
        if (created) {
          cache.byId.set(created.id, created);
          cache.byName.set(normalizeName(created.name), created);
          return created.id;
        }
      }

      return defaultLayerId ?? null;
    },
    [addLayer, defaultLayerId, fallbackKind]
  );

  return resolveLayerId;
};

export default useLayerResolver;
