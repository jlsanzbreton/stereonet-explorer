import Dexie, { Table } from 'dexie';
import { create } from 'zustand';
import {
  DEFAULT_LAYER_COLOR,
  DEFAULT_LAYER_OPACITY,
  Layer,
  LayerKind,
} from '@/features/layers/model/layerTypes';
import { ProjectionType, StructuralData } from '@/features/stereonet/model/types';
import { SAMPLE_DATA } from '@/features/stereonet/model/transforms';

export type OrientationKind = 'plane' | 'line';

interface OrientationRecord {
  id?: number;
  type: OrientationKind;
  azimuth: number;
  inclination: number;
  createdAt: number;
  latitude: number | null;
  longitude: number | null;
  layerId: number | null;
  notes: string | null;
}

export interface Orientation extends Required<Omit<OrientationRecord, 'id'>> {
  id: number;
}

interface LayerRecord {
  id?: number;
  name: string;
  kind: LayerKind;
  color: string;
  opacity: number;
  visible: boolean;
  createdAt: number;
}

interface GeoSourceRecord {
  id?: number;
  title: string;
  // TODO(rfc-2025-11): Extend schema with source metadata.
}

const DEFAULT_LAYER_NAME = 'Stereonet data';
const DEFAULT_LAYER_KIND: LayerKind = 'stereonet';

const cloneOrientation = (orientation: Orientation): Orientation => ({ ...orientation });
const cloneLayer = (layer: Layer): Layer => ({ ...layer });

class StereonetDB extends Dexie {
  orientations!: Table<OrientationRecord, number>;
  layers!: Table<LayerRecord, number>;
  geoSources!: Table<GeoSourceRecord, number>;

  constructor() {
    super('StereonetDB');
    this.version(1).stores({
      orientations: '++id, type, azimuth, inclination, createdAt',
      layers: '++id, name',
      geoSources: '++id, title',
    });
    this.version(2)
      .stores({
        orientations:
          '++id, type, layerId, createdAt, azimuth, inclination, latitude, longitude',
        layers: '++id, kind, visible, createdAt',
        geoSources: '++id, title',
      })
      .upgrade(async (tx) => {
        const layersTable = tx.table<LayerRecord>('layers');
        const orientationsTable = tx.table<OrientationRecord>('orientations');
        const now = Date.now();

        const existingLayers = await layersTable.toArray();
        let defaultLayerId: number;

        if (existingLayers.length === 0) {
          defaultLayerId = await layersTable.add({
            name: DEFAULT_LAYER_NAME,
            kind: DEFAULT_LAYER_KIND,
            color: DEFAULT_LAYER_COLOR,
            opacity: DEFAULT_LAYER_OPACITY,
            visible: true,
            createdAt: now,
          });
        } else {
          let stereonetLayer = existingLayers.find(
            (layer) => layer.kind === DEFAULT_LAYER_KIND
          );
          if (!stereonetLayer) {
            stereonetLayer = existingLayers[0];
          }
          defaultLayerId = stereonetLayer.id ?? 1;
          await Promise.all(
            existingLayers.map((layer) =>
              layersTable.update(layer.id!, {
                color: layer.color ?? DEFAULT_LAYER_COLOR,
                opacity:
                  typeof layer.opacity === 'number'
                    ? layer.opacity
                    : DEFAULT_LAYER_OPACITY,
                visible: layer.visible ?? true,
                createdAt: layer.createdAt ?? now,
              })
            )
          );
        }

        await orientationsTable.toCollection().modify((record) => {
          record.latitude =
            typeof record.latitude === 'number' ? record.latitude : null;
          record.longitude =
            typeof record.longitude === 'number' ? record.longitude : null;
          record.layerId =
            typeof record.layerId === 'number' ? record.layerId : defaultLayerId;
          record.notes = record.notes ?? null;
        });
      });
  }
}

export const stereonetDB = new StereonetDB();

interface LoadSampleOptions {
  force?: boolean;
  onlyIfEmpty?: boolean;
}

interface CoordinateInput {
  latitude?: number | null;
  longitude?: number | null;
}

interface OrientationBaseInput extends CoordinateInput {
  layerId?: number | null;
  notes?: string | null;
}

interface AddPlaneInput extends OrientationBaseInput {
  dipDirection: number;
  dip: number;
}

interface AddLineInput extends OrientationBaseInput {
  trend: number;
  plunge: number;
}

interface StereonetState {
  orientations: Orientation[];
  memoryOrientations: Orientation[];
  layers: Layer[];
  memoryLayers: Layer[];
  defaultLayerId: number | null;
  structuralData: StructuralData[];
  selectedOrientationId: number | string | null;
  projection: ProjectionType;
  showGrid: boolean;
  showPoles: boolean;
  isInitialized: boolean;
  isDexieAvailable: boolean;
  isDexieFallback: boolean;
  loadInitialData: () => Promise<void>;
  ensureDefaultLayers: () => Promise<void>;
  addPlane: (input: AddPlaneInput) => Promise<void>;
  addLine: (input: AddLineInput) => Promise<void>;
  assignOrientationToLayer: (
    orientationId: number | string,
    layerId: number
  ) => Promise<void>;
  setOrientationCoordinates: (
    orientationId: number | string,
    coordinates: { latitude: number | null; longitude: number | null }
  ) => Promise<void>;
  updateOrientationNotes: (
    orientationId: number | string,
    notes: string | null
  ) => Promise<void>;
  removeById: (id: number | string) => Promise<void>;
  clearAll: () => Promise<void>;
  loadSample: (options?: LoadSampleOptions) => Promise<void>;
  addLayer: (input: { name: string; kind: LayerKind }) => Promise<Layer | null>;
  updateLayerStyle: (
    layerId: number,
    updates: Partial<Pick<Layer, 'name' | 'color' | 'opacity'>>
  ) => Promise<void>;
  toggleLayerVisibility: (layerId: number) => Promise<void>;
  deleteLayer: (layerId: number) => Promise<void>;
  setOrientationProjection: (projection: ProjectionType) => void;
  setShowGrid: (value: boolean) => void;
  setShowPoles: (value: boolean) => void;
  setSelectedOrientationId: (id: number | string | null) => void;
  clearSelection: () => void;
}

let memoryIdCounter = 0;

const nextMemoryId = (): number => {
  memoryIdCounter += 1;
  return memoryIdCounter;
};

const rehydrateMemoryCounter = (list: Orientation[]): void => {
  if (list.length === 0) {
    return;
  }
  const maxId = list.reduce((max, item) => Math.max(max, item.id), memoryIdCounter);
  memoryIdCounter = Math.max(memoryIdCounter, maxId);
};

const orientationFromRecord = (record: OrientationRecord): Orientation => ({
  id: record.id ?? nextMemoryId(),
  type: record.type,
  azimuth: record.azimuth,
  inclination: record.inclination,
  createdAt: record.createdAt,
  latitude:
    typeof record.latitude === 'number' && Number.isFinite(record.latitude)
      ? record.latitude
      : null,
  longitude:
    typeof record.longitude === 'number' && Number.isFinite(record.longitude)
      ? record.longitude
      : null,
  layerId:
    typeof record.layerId === 'number' && Number.isFinite(record.layerId)
      ? record.layerId
      : null,
  notes: record.notes ?? null,
});

const layerFromRecord = (record: LayerRecord): Layer => ({
  id: record.id ?? 0,
  name: record.name,
  kind: record.kind ?? DEFAULT_LAYER_KIND,
  color: record.color ?? DEFAULT_LAYER_COLOR,
  opacity:
    typeof record.opacity === 'number' ? record.opacity : DEFAULT_LAYER_OPACITY,
  visible: record.visible ?? true,
  createdAt: record.createdAt ?? Date.now(),
});

const toStructuralData = (orientation: Orientation, layer: Layer | undefined): StructuralData => {
  const metadata = {
    latitude: orientation.latitude,
    longitude: orientation.longitude,
    layerId: layer?.id ?? null,
    layerName: layer?.name,
    layerColor: layer?.color,
    layerOpacity: layer?.opacity,
    layerVisible: layer?.visible ?? true,
    notes: orientation.notes,
    createdAt: orientation.createdAt,
  };

  if (orientation.type === 'plane') {
    return {
      id: orientation.id,
      type: 'plane',
      dipDirection: orientation.azimuth,
      dip: orientation.inclination,
      ...metadata,
    };
  }

  return {
    id: orientation.id,
    type: 'line',
    trend: orientation.azimuth,
    plunge: orientation.inclination,
    ...metadata,
  };
};

const determineDefaultLayerId = (layers: Layer[]): number | null => {
  if (layers.length === 0) {
    return null;
  }
  const stereonetLayer = layers.find((layer) => layer.kind === DEFAULT_LAYER_KIND);
  return (stereonetLayer ?? layers[0]).id ?? null;
};

export const useStereonetStore = create<StereonetState>((set, get) => {
  const buildStructuralData = (orientations: Orientation[], layers: Layer[]): StructuralData[] => {
    const structural = orientations
      .map((item) => toStructuralData(item, layers.find((layer) => layer.id === item.layerId)))
      .sort((a, b) => {
        const aCreated = a.createdAt ?? 0;
        const bCreated = b.createdAt ?? 0;
        return aCreated - bCreated;
      });
    return structural;
  };

  const getActiveLayers = (): Layer[] =>
    get().isDexieFallback ? get().memoryLayers.map(cloneLayer) : get().layers.map(cloneLayer);

  const getActiveOrientations = (): Orientation[] =>
    get().isDexieFallback
      ? get().memoryOrientations.map(cloneOrientation)
      : get().orientations.map(cloneOrientation);

  const updateLayersState = (layers: Layer[]) => {
    const cloned = layers.map(cloneLayer);
    const orientations = getActiveOrientations();
    const structuralData = buildStructuralData(orientations, cloned);
    const selected = get().selectedOrientationId;
    const nextSelection =
      selected === null
        ? null
        : (() => {
            const orientation = orientations.find(
              (item) => String(item.id) === String(selected)
            );
            if (!orientation) {
              return null;
            }
            const layer = cloned.find((entry) => entry.id === orientation.layerId);
            if (layer && !layer.visible) {
              return null;
            }
            return selected;
          })();

    set({
      layers: cloned,
      memoryLayers: cloned.map(cloneLayer),
      structuralData,
      defaultLayerId: determineDefaultLayerId(cloned),
      selectedOrientationId: nextSelection,
    });
  };

  const updateOrientationsState = (orientations: Orientation[]) => {
    rehydrateMemoryCounter(orientations);
    const cloned = orientations.map(cloneOrientation);
    const layers = getActiveLayers();
    const structuralData = buildStructuralData(cloned, layers);
    const previousSelection = get().selectedOrientationId;
    const nextSelection =
      previousSelection === null
        ? null
        : (() => {
            const orientation = cloned.find(
              (item) => String(item.id) === String(previousSelection)
            );
            if (!orientation) {
              return null;
            }
            const layer = layers.find((entry) => entry.id === orientation.layerId);
            if (layer && !layer.visible) {
              return null;
            }
            return previousSelection;
          })();

    set({
      orientations: cloned,
      memoryOrientations: cloned.map(cloneOrientation),
      structuralData,
      selectedOrientationId: nextSelection,
    });
  };

  const handleDexieFailure = (error: unknown) => {
    if (!get().isDexieFallback) {
      console.warn('Dexie storage unavailable, falling back to in-memory store.', error);
    }

    const fallbackLayers = get().memoryLayers.map(cloneLayer);
    const fallbackOrientations = get().memoryOrientations.map(cloneOrientation);
    const structuralData = buildStructuralData(fallbackOrientations, fallbackLayers);
    const selection = get().selectedOrientationId;
    const nextSelection =
      selection === null
        ? null
        : (() => {
            const orientation = fallbackOrientations.find(
              (item) => String(item.id) === String(selection)
            );
            if (!orientation) {
              return null;
            }
            const layer = fallbackLayers.find((entry) => entry.id === orientation.layerId);
            if (layer && !layer.visible) {
              return null;
            }
            return selection;
          })();

    set({
      isDexieAvailable: false,
      isDexieFallback: true,
      layers: fallbackLayers,
      orientations: fallbackOrientations,
      structuralData,
      selectedOrientationId: nextSelection,
      defaultLayerId: determineDefaultLayerId(fallbackLayers),
    });

    return {
      orientations: fallbackOrientations,
      layers: fallbackLayers,
    };
  };

  const syncLayersFromDexie = async (): Promise<Layer[]> => {
    try {
      if (!stereonetDB.isOpen()) {
        await stereonetDB.open();
      }
      const rows = await stereonetDB.layers.orderBy('createdAt').toArray();
      const mapped = rows.map(layerFromRecord).sort((a, b) => a.createdAt - b.createdAt);
      updateLayersState(mapped);
      set({
        isDexieAvailable: true,
        isDexieFallback: false,
      });
      return mapped;
    } catch (error) {
      const fallback = handleDexieFailure(error);
      return fallback.layers;
    }
  };

  const syncOrientationsFromDexie = async (
    layersSnapshot?: Layer[]
  ): Promise<Orientation[]> => {
    try {
      if (!stereonetDB.isOpen()) {
        await stereonetDB.open();
      }
      const rows = await stereonetDB.orientations.orderBy('createdAt').toArray();
      const mapped = rows
        .map(orientationFromRecord)
        .sort((a, b) => a.createdAt - b.createdAt);
      if (layersSnapshot) {
        updateLayersState(layersSnapshot);
      }
      updateOrientationsState(mapped);
      set({
        isDexieAvailable: true,
        isDexieFallback: false,
      });
      return mapped;
    } catch (error) {
      const fallback = handleDexieFailure(error);
      return fallback.orientations;
    }
  };

  const ensureDefaultLayerInMemory = () => {
    const layers = get().memoryLayers;
    if (layers.length === 0) {
      const now = Date.now();
      const defaultLayer: Layer = {
        id: nextMemoryId(),
        name: DEFAULT_LAYER_NAME,
        kind: DEFAULT_LAYER_KIND,
        color: DEFAULT_LAYER_COLOR,
        opacity: DEFAULT_LAYER_OPACITY,
        visible: true,
        createdAt: now,
      };
      const updated = [defaultLayer];
      set({
        memoryLayers: updated,
        defaultLayerId: defaultLayer.id,
      });
      updateLayersState(updated);
      return defaultLayer.id;
    }
    const defaultLayerId = determineDefaultLayerId(layers);
    if (defaultLayerId === null) {
      return layers[0]?.id ?? null;
    }
    return defaultLayerId;
  };

  const ensureDefaultLayer = async (): Promise<number | null> => {
    if (get().isDexieFallback || !get().isDexieAvailable) {
      return ensureDefaultLayerInMemory();
    }

    try {
      const layers = await stereonetDB.layers.toArray();
      let stereonetLayer = layers
        .map(layerFromRecord)
        .find((layer) => layer.kind === DEFAULT_LAYER_KIND);
      if (!stereonetLayer) {
        const now = Date.now();
        const id = await stereonetDB.layers.add({
          name: DEFAULT_LAYER_NAME,
          kind: DEFAULT_LAYER_KIND,
          color: DEFAULT_LAYER_COLOR,
          opacity: DEFAULT_LAYER_OPACITY,
          visible: true,
          createdAt: now,
        });
        stereonetLayer = {
          id,
          name: DEFAULT_LAYER_NAME,
          kind: DEFAULT_LAYER_KIND,
          color: DEFAULT_LAYER_COLOR,
          opacity: DEFAULT_LAYER_OPACITY,
          visible: true,
          createdAt: now,
        };
      }
      await syncLayersFromDexie();
      return stereonetLayer.id;
    } catch (error) {
      const fallback = handleDexieFailure(error);
      return determineDefaultLayerId(fallback.layers);
    }
  };

  const persistOrientation = async (record: OrientationRecord) => {
    const { isDexieAvailable } = get();
    const targetLayerId =
      record.layerId ??
      get().defaultLayerId ??
      (await ensureDefaultLayer()) ??
      null;

    if (targetLayerId !== null) {
      record.layerId = targetLayerId;
    }

    if (isDexieAvailable) {
      try {
        await stereonetDB.orientations.add(record);
        await syncOrientationsFromDexie();
        return;
      } catch (error) {
        handleDexieFailure(error);
      }
    }

    const memoryOrientation: Orientation = {
      id: nextMemoryId(),
      type: record.type,
      azimuth: record.azimuth,
      inclination: record.inclination,
      createdAt: record.createdAt,
      latitude: record.latitude ?? null,
      longitude: record.longitude ?? null,
      layerId: record.layerId ?? ensureDefaultLayerInMemory(),
      notes: record.notes ?? null,
    };
    const next = [...get().memoryOrientations, memoryOrientation];
    updateOrientationsState(next);
  };

  const removeOrientation = async (id: number) => {
    const { isDexieAvailable } = get();
    if (isDexieAvailable) {
      try {
        await stereonetDB.orientations.delete(id);
        await syncOrientationsFromDexie();
        return;
      } catch (error) {
        handleDexieFailure(error);
      }
    }

    const next = get().memoryOrientations.filter((item) => item.id !== id);
    updateOrientationsState(next);
  };

  const persistLayerUpdate = async (layer: Layer | null) => {
    if (layer && get().isDexieAvailable) {
      try {
        await stereonetDB.layers.put({
          id: layer.id,
          name: layer.name,
          kind: layer.kind,
          color: layer.color,
          opacity: layer.opacity,
          visible: layer.visible,
          createdAt: layer.createdAt,
        });
      } catch (error) {
        handleDexieFailure(error);
      }
    }
  };

  const updateOrientationById = async (
    orientationId: number,
    updater: (orientation: Orientation) => Orientation
  ) => {
    const { isDexieAvailable } = get();
    if (isDexieAvailable) {
      try {
        const existing = await stereonetDB.orientations.get(orientationId);
        if (!existing) {
          return;
        }
        const updated = updater(orientationFromRecord(existing));
        await stereonetDB.orientations.put({
          id: updated.id,
          type: updated.type,
          azimuth: updated.azimuth,
          inclination: updated.inclination,
          createdAt: updated.createdAt,
          latitude: updated.latitude,
          longitude: updated.longitude,
          layerId: updated.layerId,
          notes: updated.notes,
        });
        await syncOrientationsFromDexie();
        return;
      } catch (error) {
        handleDexieFailure(error);
      }
    }

    const current = get().memoryOrientations;
    const next = current.map((orientation) =>
      orientation.id === orientationId ? updater(cloneOrientation(orientation)) : orientation
    );
    updateOrientationsState(next);
  };

  const clearOrientations = async () => {
    const { isDexieAvailable } = get();
    if (isDexieAvailable) {
      try {
        await stereonetDB.orientations.clear();
        updateOrientationsState([]);
        return;
      } catch (error) {
        handleDexieFailure(error);
      }
    }
    updateOrientationsState([]);
  };

  return {
    orientations: [],
    memoryOrientations: [],
    layers: [],
    memoryLayers: [],
    defaultLayerId: null,
    structuralData: [],
    selectedOrientationId: null,
    projection: ProjectionType.Schmidt,
    showGrid: true,
    showPoles: true,
    isInitialized: false,
    isDexieAvailable: true,
    isDexieFallback: false,
    loadInitialData: async () => {
      if (get().isInitialized) {
        return;
      }

      if (get().isDexieAvailable) {
        const layers = await syncLayersFromDexie();
        if (layers.length === 0) {
          await ensureDefaultLayer();
          await syncLayersFromDexie();
        }
        const orientations = await syncOrientationsFromDexie();
        if (orientations.length === 0) {
          await get().loadSample({ onlyIfEmpty: true });
        }
      } else {
        ensureDefaultLayerInMemory();
        updateOrientationsState(get().memoryOrientations);
        if (get().memoryOrientations.length === 0) {
          await get().loadSample({ onlyIfEmpty: true });
        }
      }

      set({ isInitialized: true });
    },
    ensureDefaultLayers: async () => {
      await ensureDefaultLayer();
      const layers = getActiveLayers();
      updateLayersState(layers);
    },
    addPlane: async ({ dipDirection, dip, latitude = null, longitude = null, layerId = null, notes = null }) =>
      persistOrientation({
        type: 'plane',
        azimuth: dipDirection,
        inclination: dip,
        createdAt: Date.now(),
        latitude,
        longitude,
        layerId,
        notes,
      }),
    addLine: async ({ trend, plunge, latitude = null, longitude = null, layerId = null, notes = null }) =>
      persistOrientation({
        type: 'line',
        azimuth: trend,
        inclination: plunge,
        createdAt: Date.now(),
        latitude,
        longitude,
        layerId,
        notes,
      }),
    assignOrientationToLayer: async (orientationId, targetLayerId) => {
      const numericId =
        typeof orientationId === 'string'
          ? Number.parseInt(orientationId, 10)
          : orientationId;
      if (Number.isNaN(numericId)) {
        return;
      }
      await updateOrientationById(numericId, (orientation) => ({
        ...orientation,
        layerId: targetLayerId,
      }));
    },
    setOrientationCoordinates: async (orientationId, coordinates) => {
      const numericId =
        typeof orientationId === 'string'
          ? Number.parseInt(orientationId, 10)
          : orientationId;
      if (Number.isNaN(numericId)) {
        return;
      }
      await updateOrientationById(numericId, (orientation) => ({
        ...orientation,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }));
    },
    updateOrientationNotes: async (orientationId, notes) => {
      const numericId =
        typeof orientationId === 'string'
          ? Number.parseInt(orientationId, 10)
          : orientationId;
      if (Number.isNaN(numericId)) {
        return;
      }
      await updateOrientationById(numericId, (orientation) => ({
        ...orientation,
        notes: notes ?? null,
      }));
    },
    removeById: async (id) => {
      const numericId = typeof id === 'string' ? Number.parseInt(id, 10) : id;
      if (Number.isNaN(numericId)) {
        return;
      }
      await removeOrientation(numericId);
    },
    clearAll: async () => {
      await clearOrientations();
    },
    loadSample: async (options?: LoadSampleOptions) => {
      const { force = false, onlyIfEmpty = false } = options ?? {};
      const current = getActiveOrientations();

      if (onlyIfEmpty && current.length > 0) {
        return;
      }
      if (!force && !onlyIfEmpty && current.length > 0) {
        return;
      }

      if (force && current.length > 0) {
        await clearOrientations();
      }

      const now = Date.now();
      const defaultLayerId =
        get().defaultLayerId ?? (await ensureDefaultLayer()) ?? null;
      const records: OrientationRecord[] = SAMPLE_DATA.map((item, index) => ({
        type: item.type,
        azimuth: item.type === 'plane' ? item.dipDirection : item.trend,
        inclination: item.type === 'plane' ? item.dip : item.plunge,
        createdAt: now + index,
        latitude: null,
        longitude: null,
        layerId: defaultLayerId,
        notes: null,
      }));

      if (get().isDexieAvailable) {
        try {
          await stereonetDB.orientations.bulkAdd(records);
          await syncOrientationsFromDexie();
          return;
        } catch (error) {
          handleDexieFailure(error);
        }
      }

      const next = [
        ...get().memoryOrientations,
        ...records.map((record) => ({
          id: nextMemoryId(),
          type: record.type,
          azimuth: record.azimuth,
          inclination: record.inclination,
          createdAt: record.createdAt,
          latitude: record.latitude,
          longitude: record.longitude,
          layerId: record.layerId ?? ensureDefaultLayerInMemory(),
          notes: null,
        })),
      ];
      updateOrientationsState(next);
    },
    addLayer: async ({ name, kind }) => {
      const now = Date.now();

      if (get().isDexieAvailable) {
        try {
          const id = await stereonetDB.layers.add({
            name,
            kind,
            color: DEFAULT_LAYER_COLOR,
            opacity: DEFAULT_LAYER_OPACITY,
            visible: true,
            createdAt: now,
          });
          await syncLayersFromDexie();
          return get().layers.find((layer) => layer.id === id) ?? null;
        } catch (error) {
          const fallback = handleDexieFailure(error);
          return fallback.layers.find((layer) => layer.name === name) ?? null;
        }
      }

      const newLayer: Layer = {
        id: nextMemoryId(),
        name,
        kind,
        color: DEFAULT_LAYER_COLOR,
        opacity: DEFAULT_LAYER_OPACITY,
        visible: true,
        createdAt: now,
      };
      const next = [...get().memoryLayers, newLayer];
      updateLayersState(next);
      return newLayer;
    },
    updateLayerStyle: async (layerId, updates) => {
      const mutate = (layer: Layer): Layer => ({
        ...layer,
        ...updates,
      });

      if (get().isDexieAvailable) {
        try {
          const existing = await stereonetDB.layers.get(layerId);
          if (!existing) {
            return;
          }
          const mutated = mutate(layerFromRecord(existing));
          await persistLayerUpdate(mutated);
          await syncLayersFromDexie();
          return;
        } catch (error) {
          handleDexieFailure(error);
        }
      }

      const next = get().memoryLayers.map((layer) =>
        layer.id === layerId ? mutate(cloneLayer(layer)) : layer
      );
      updateLayersState(next);
    },
    toggleLayerVisibility: async (layerId) => {
      const mutateVisibility = (layer: Layer): Layer => ({
        ...layer,
        visible: !layer.visible,
      });

      if (get().isDexieAvailable) {
        try {
          const existing = await stereonetDB.layers.get(layerId);
          if (!existing) {
            return;
          }
          const mutated = mutateVisibility(layerFromRecord(existing));
          await persistLayerUpdate(mutated);
          await syncLayersFromDexie();
          return;
        } catch (error) {
          handleDexieFailure(error);
        }
      }

      const next = get().memoryLayers.map((layer) =>
        layer.id === layerId ? mutateVisibility(cloneLayer(layer)) : layer
      );
      updateLayersState(next);
    },
    deleteLayer: async (layerId) => {
      const defaultLayerId = get().defaultLayerId;
      if (layerId === defaultLayerId) {
        // Prevent deleting the default stereonet layer.
        return;
      }

      if (get().isDexieAvailable) {
        try {
          // Reassign orientations to default layer before deleting.
          const fallbackLayerId =
            defaultLayerId ?? (await ensureDefaultLayer()) ?? null;
          if (fallbackLayerId !== null) {
            const orientations = await stereonetDB.orientations
              .where('layerId')
              .equals(layerId)
              .toArray();
            await Promise.all(
              orientations.map((orientation) =>
                stereonetDB.orientations.update(orientation.id!, {
                  layerId: fallbackLayerId,
                })
              )
            );
          }

          await stereonetDB.layers.delete(layerId);
          await syncLayersFromDexie();
          await syncOrientationsFromDexie();
          return;
        } catch (error) {
          handleDexieFailure(error);
        }
      }

      const fallbackLayerId =
        defaultLayerId ?? determineDefaultLayerId(get().memoryLayers);
      const nextLayers = get()
        .memoryLayers.filter((layer) => layer.id !== layerId)
        .map(cloneLayer);
      const nextOrientations = get()
        .memoryOrientations.map((orientation) =>
          orientation.layerId === layerId
            ? {
                ...orientation,
                layerId: fallbackLayerId,
              }
            : orientation
        );
      set({
        memoryLayers: nextLayers,
        memoryOrientations: nextOrientations,
      });
      updateLayersState(nextLayers);
      updateOrientationsState(nextOrientations);
    },
    setOrientationProjection: (projection) => {
      set({ projection });
    },
    setShowGrid: (value) => {
      set({ showGrid: value });
    },
    setShowPoles: (value) => {
      set({ showPoles: value });
    },
    setSelectedOrientationId: (id) => {
      if (id === null) {
        set({ selectedOrientationId: null });
        return;
      }
      const orientations = getActiveOrientations();
      const layers = getActiveLayers();
      const orientation = orientations.find((item) => String(item.id) === String(id));
      if (!orientation) {
        set({ selectedOrientationId: null });
        return;
      }
      const layer = layers.find((entry) => entry.id === orientation.layerId);
      if (layer && !layer.visible) {
        set({ selectedOrientationId: null });
        return;
      }
      set({ selectedOrientationId: id });
    },
    clearSelection: () => {
      set({ selectedOrientationId: null });
    },
  };
});

export const selectStructuralData = (state: StereonetState): StructuralData[] =>
  state.structuralData;

export const selectProjection = (state: StereonetState): ProjectionType =>
  state.projection;

export const selectShowGrid = (state: StereonetState): boolean => state.showGrid;

export const selectShowPoles = (state: StereonetState): boolean => state.showPoles;

export const selectDexieFallback = (state: StereonetState): boolean =>
  state.isDexieFallback;

export const selectSelectedOrientationId = (
  state: StereonetState
): number | string | null => state.selectedOrientationId;

export const selectLayers = (state: StereonetState): Layer[] => state.layers;

export const selectVisibleLayers = (state: StereonetState): Layer[] =>
  state.layers.filter((layer) => layer.visible);

export const selectDefaultLayerId = (state: StereonetState): number | null =>
  state.defaultLayerId;
