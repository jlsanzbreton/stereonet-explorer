import Dexie, { Table } from 'dexie';
import { create } from 'zustand';
import { ProjectionType, StructuralData } from '@/features/stereonet/model/types';
import { SAMPLE_DATA } from '@/features/stereonet/model/transforms';

export type OrientationKind = 'plane' | 'line';

interface OrientationRecord {
    id?: number;
    type: OrientationKind;
    azimuth: number;
    inclination: number;
    createdAt: number;
}

export interface Orientation extends Required<Omit<OrientationRecord, 'id'>> {
    id: number;
}

interface LayerRecord {
    id?: number;
    name: string;
    // TODO(rfc-2025-11): Extend schema with layer metadata.
}

interface GeoSourceRecord {
    id?: number;
    title: string;
    // TODO(rfc-2025-11): Extend schema with source metadata.
}

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
    }
}

export const stereonetDB = new StereonetDB();

interface LoadSampleOptions {
    force?: boolean;
    onlyIfEmpty?: boolean;
}

interface StereonetState {
    orientations: Orientation[];
    memoryOrientations: Orientation[];
    structuralData: StructuralData[];
    selectedOrientationId: number | string | null;
    projection: ProjectionType;
    showGrid: boolean;
    showPoles: boolean;
    isInitialized: boolean;
    isDexieAvailable: boolean;
    isDexieFallback: boolean;
    loadInitialData: () => Promise<void>;
    addPlane: (input: { dipDirection: number; dip: number }) => Promise<void>;
    addLine: (input: { trend: number; plunge: number }) => Promise<void>;
    removeById: (id: number | string) => Promise<void>;
    clearAll: () => Promise<void>;
    loadSample: (options?: LoadSampleOptions) => Promise<void>;
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
});

const orientationToStructural = (orientation: Orientation): StructuralData => {
    if (orientation.type === 'plane') {
        return {
            id: orientation.id,
            type: 'plane',
            dipDirection: orientation.azimuth,
            dip: orientation.inclination,
        };
    }
    return {
        id: orientation.id,
        type: 'line',
        trend: orientation.azimuth,
        plunge: orientation.inclination,
    };
};

export const useStereonetStore = create<StereonetState>((set, get) => {
    const updateStateWith = (list: Orientation[]) => {
        rehydrateMemoryCounter(list);
        const snapshot = list.map(item => ({ ...item }));
        const structuralData = snapshot.map(orientationToStructural);
        const previousSelection = get().selectedOrientationId;
        const nextSelection =
            previousSelection === null
                ? null
                : snapshot.some(item => String(item.id) === String(previousSelection))
                  ? previousSelection
                  : null;
        set({
            orientations: snapshot,
            memoryOrientations: snapshot.map(item => ({ ...item })),
            structuralData,
            selectedOrientationId: nextSelection,
        });
    };

    const handleDexieFailure = (error: unknown) => {
        if (!get().isDexieFallback) {
            // Dexie might be unavailable (e.g. private browsing), log once and keep working in memory.
            console.warn('Dexie storage unavailable, falling back to in-memory store.', error);
        }
        const fallbackSnapshot = get().memoryOrientations.map(item => ({ ...item }));
        const fallbackStructural = fallbackSnapshot.map(orientationToStructural);
        set({
            isDexieAvailable: false,
            isDexieFallback: true,
            orientations: fallbackSnapshot,
            memoryOrientations: fallbackSnapshot.map(item => ({ ...item })),
            structuralData: fallbackStructural,
        });
        return fallbackSnapshot;
    };

    const syncFromDexie = async (): Promise<Orientation[]> => {
        try {
            if (!stereonetDB.isOpen()) {
                await stereonetDB.open();
            }
            const rows = await stereonetDB.orientations.orderBy('createdAt').toArray();
            const mapped = rows.map(orientationFromRecord).sort((a, b) => a.createdAt - b.createdAt);
            updateStateWith(mapped);
            set({
                isDexieAvailable: true,
                isDexieFallback: false,
            });
            return mapped;
        } catch (error) {
            return handleDexieFailure(error);
        }
    };

    const persistOrientation = async (record: OrientationRecord) => {
        const { isDexieAvailable } = get();
        if (isDexieAvailable) {
            try {
                await stereonetDB.orientations.add(record);
                await syncFromDexie();
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
        };
        const next = [...get().memoryOrientations, memoryOrientation];
        updateStateWith(next);
    };

    const removeOrientation = async (id: number) => {
        const { isDexieAvailable } = get();
        if (isDexieAvailable) {
            try {
                await stereonetDB.orientations.delete(id);
                await syncFromDexie();
                return;
            } catch (error) {
                handleDexieFailure(error);
            }
        }

        const next = get().memoryOrientations.filter(item => item.id !== id);
        updateStateWith(next);
    };

    const clearOrientations = async () => {
        const { isDexieAvailable } = get();
        if (isDexieAvailable) {
            try {
                await stereonetDB.orientations.clear();
                updateStateWith([]);
                return;
            } catch (error) {
                handleDexieFailure(error);
            }
        }
        updateStateWith([]);
    };

    const loadSampleData = async (options?: LoadSampleOptions) => {
        const { force = false, onlyIfEmpty = false } = options ?? {};
        const current = get().orientations;

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
        const records: OrientationRecord[] = SAMPLE_DATA.map((item, index) => ({
            type: item.type,
            azimuth: item.type === 'plane' ? item.dipDirection : item.trend,
            inclination: item.type === 'plane' ? item.dip : item.plunge,
            createdAt: now + index,
        }));

        if (get().isDexieAvailable) {
            try {
                await stereonetDB.orientations.bulkAdd(records);
                await syncFromDexie();
                return;
            } catch (error) {
                handleDexieFailure(error);
            }
        }

        const next = [
            ...get().memoryOrientations,
            ...records.map(record => ({
                id: nextMemoryId(),
                type: record.type,
                azimuth: record.azimuth,
                inclination: record.inclination,
                createdAt: record.createdAt,
            })),
        ];
        updateStateWith(next);
    };

    return {
        orientations: [],
        memoryOrientations: [],
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
                const loaded = await syncFromDexie();
                if (loaded.length === 0) {
                    await loadSampleData({ onlyIfEmpty: true });
                }
            } else {
                updateStateWith(get().memoryOrientations);
                if (get().orientations.length === 0) {
                    await loadSampleData({ onlyIfEmpty: true });
                }
            }

            set({ isInitialized: true });
        },
        addPlane: async ({ dipDirection, dip }) => persistOrientation({
            type: 'plane',
            azimuth: dipDirection,
            inclination: dip,
            createdAt: Date.now(),
        }),
        addLine: async ({ trend, plunge }) => persistOrientation({
            type: 'line',
            azimuth: trend,
            inclination: plunge,
            createdAt: Date.now(),
        }),
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
            await loadSampleData(options);
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
            set({ selectedOrientationId: id });
        },
        clearSelection: () => {
            set({ selectedOrientationId: null });
        },
    };
});

export const selectStructuralData = (state: StereonetState): StructuralData[] =>
    state.structuralData;

export const selectProjection = (state: StereonetState): ProjectionType => state.projection;

export const selectShowGrid = (state: StereonetState): boolean => state.showGrid;

export const selectShowPoles = (state: StereonetState): boolean => state.showPoles;

export const selectDexieFallback = (state: StereonetState): boolean => state.isDexieFallback;

export const selectSelectedOrientationId = (state: StereonetState): number | string | null =>
    state.selectedOrientationId;
