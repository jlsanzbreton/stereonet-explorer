import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import type { LatLngExpression, Map as LeafletMap } from 'leaflet';
import type { Position as GeoJsonPosition } from 'geojson';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  orientationToLeafletLatLng,
  orientationToLonLat,
  orientationHasCoordinates,
} from '@/features/map/orientationMapping';
import {
  selectLayers,
  selectSelectedOrientationId,
  selectStructuralData,
  useStereonetStore,
} from '@/state/store';
import {
  LineImport,
  LayerHint,
  OrientationGeoJsonFeature,
  PlaneImport,
  validateCsv,
  validateGeoJson,
  ValidationMessage,
} from '@/services/validation';
import useLayerResolver from '@/features/layers/hooks/useLayerResolver';
import type { LayerKind } from '@/features/layers/model/layerTypes';

type FitTarget = [number, number];

const buildSignature = (targets: FitTarget[]): string =>
  targets
    .map(([lat, lng]) => `${lat.toFixed(4)}:${lng.toFixed(4)}`)
    .sort()
    .join('|');

const DEFAULT_CENTER: LatLngExpression = [0, 0];
const DEFAULT_ZOOM = 2;

interface ImportFeedback {
  imported: { planes: number; lines: number } | null;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

const initialFeedback: ImportFeedback = {
  imported: null,
  errors: [],
  warnings: [],
};

let leafletIconsPatched = false;
const ensureLeafletIcons = () => {
  if (leafletIconsPatched) {
    return;
  }
  leafletIconsPatched = true;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};

const isWithin = (value: number | null, min: number, max: number): value is number => {
  if (value === null) {
    return false;
  }
  return value >= min && value <= max;
};

const EXTRACT_RANGES = {
  dipDirection: { min: 0, max: 360 },
  dip: { min: 0, max: 90 },
  trend: { min: 0, max: 360 },
  plunge: { min: 0, max: 90 },
} as const;

const LAYER_KINDS: LayerKind[] = ['stereonet', 'map', 'analysis'];

const parseLayerKind = (value: unknown): LayerKind | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return LAYER_KINDS.find((kind) => kind === normalized);
};

const parseLayerHint = (properties: Record<string, unknown>): LayerHint => {
  const candidates = [properties.layerId, properties.layerName, properties.layer];
  let layerId: string | number | null = null;
  let layerName: string | null = null;

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      layerId = candidate;
      layerName = layerName ?? candidate.toString();
      break;
    }
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed !== '') {
        layerId = trimmed;
        layerName = trimmed;
        break;
      }
    }
  }

  const layerKind = parseLayerKind(properties.layerKind);

  return { layerId, layerName, layerKind };
};

const extractOrientationsFromGeoJson = (
  features: OrientationGeoJsonFeature[]
): {
  planes: PlaneImport[];
  lines: LineImport[];
  warnings: ValidationMessage[];
} => {
  const planes: PlaneImport[] = [];
  const lines: LineImport[] = [];
  const warnings: ValidationMessage[] = [];

  features.forEach((feature, index) => {
    const rowIndex = index + 1;
    const properties = feature.properties ?? {};
    const rawType = typeof properties.type === 'string' ? properties.type.trim().toLowerCase() : undefined;

    if (!rawType) {
      return;
    }

    if (rawType === 'plane' || rawType === 'line') {
      if (feature.geometry.type !== 'Point') {
        warnings.push({
          key: 'map.import.errors.pointGeometryRequired',
          context: { feature: rowIndex },
        });
        return;
      }

      const [longitudeRaw, latitudeRaw] = feature.geometry.coordinates;
      if (
        !Number.isFinite(longitudeRaw) ||
        !Number.isFinite(latitudeRaw)
      ) {
        warnings.push({
          key: 'map.import.errors.missingCoordinates',
          context: { feature: rowIndex },
        });
        return;
      }

      const metadata = parseLayerHint(properties as Record<string, unknown>);
      const baseOrientation = {
        latitude: Math.max(-90, Math.min(90, latitudeRaw)),
        longitude: ((longitudeRaw + 180) % 360 + 360) % 360 - 180,
        layerId: metadata.layerId ?? null,
        layerName: metadata.layerName ?? null,
        layerKind: metadata.layerKind,
      };

      if (rawType === 'plane') {
        const dipDirection = toNumber(
          (properties.dipDirection ??
            (properties as Record<string, unknown>).azimuth) as number | string
        );
        const dip = toNumber(properties.dip as number | string);
        if (
          isWithin(dipDirection, EXTRACT_RANGES.dipDirection.min, EXTRACT_RANGES.dipDirection.max) &&
          isWithin(dip, EXTRACT_RANGES.dip.min, EXTRACT_RANGES.dip.max)
        ) {
          planes.push({ dipDirection, dip, ...baseOrientation });
        } else {
          warnings.push({
            key: 'map.import.errors.invalidPlaneProps',
            context: { feature: rowIndex },
          });
        }
        return;
      }

      const trend = toNumber(properties.trend as number | string);
      const plunge = toNumber(properties.plunge as number | string);
      if (
        isWithin(trend, EXTRACT_RANGES.trend.min, EXTRACT_RANGES.trend.max) &&
        isWithin(plunge, EXTRACT_RANGES.plunge.min, EXTRACT_RANGES.plunge.max)
      ) {
        lines.push({ trend, plunge, ...baseOrientation });
      } else {
        warnings.push({
          key: 'map.import.errors.invalidLineProps',
          context: { feature: rowIndex },
        });
      }
      return;
    }

    warnings.push({
      key: 'map.import.errors.unsupportedFeatureType',
      context: { feature: rowIndex, type: rawType },
    });
  });

  return { planes, lines, warnings };
};

const toPolyline = (coordinates: GeoJsonPosition[]): LatLngExpression[] => {
  return coordinates
    .map((position) => {
      if (!Array.isArray(position) || position.length < 2) {
        return null;
      }
      const [longitude, latitude] = position;
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        return null;
      }
      return [latitude, longitude] as LatLngExpression;
    })
    .filter((entry): entry is LatLngExpression => entry !== null);
};

const MapView: React.FC = () => {
  ensureLeafletIcons();

  const { t } = useTranslation();
  const structuralData = useStereonetStore(selectStructuralData);
  const layers = useStereonetStore(selectLayers);
  const addPlane = useStereonetStore((state) => state.addPlane);
  const addLine = useStereonetStore((state) => state.addLine);
  const resolveLayerId = useLayerResolver('map');
  const selectedOrientationId = useStereonetStore(selectSelectedOrientationId);
  const setSelectedOrientationId = useStereonetStore((state) => state.setSelectedOrientationId);

  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<ImportFeedback>(initialFeedback);
  const [localFeatures, setLocalFeatures] = useState<OrientationGeoJsonFeature[]>([]);
  const [hasUserAdjustedView, setHasUserAdjustedView] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const lastSelectedRef = useRef<number | string | null>(null);
  const isAutoFittingRef = useRef(false);
  const autoFitSignatureRef = useRef<string | null>(null);
  const selectedFitSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const visibleLayerIds = useMemo(
    () => new Set(layers.filter((layer) => layer.visible).map((layer) => layer.id)),
    [layers]
  );

  const visibleStructuralData = useMemo(
    () => structuralData.filter((item) => item.layerId === null || visibleLayerIds.has(item.layerId)),
    [structuralData, visibleLayerIds]
  );

  const orientationMarkers = useMemo(() => {
    return visibleStructuralData.map((item) => {
      const [latitude, longitude] = orientationToLeafletLatLng(item);
      const lonLat = orientationToLonLat(item);
      const layerColor = item.layerColor ?? '#1f2937';
      const layerOpacity = item.layerOpacity ?? 1;
      const hasCoords = orientationHasCoordinates(item);
      const position: LatLngExpression = [latitude, longitude];
      const label =
        item.type === 'plane'
          ? t('map.orientations.planeTooltip', {
              dipDirection: item.dipDirection,
              dip: item.dip,
              longitude: lonLat[0],
              latitude: lonLat[1],
              layer: item.layerName ?? t('map.layers.unknown'),
              status: hasCoords ? t('map.status.georeferenced') : t('map.status.placeholder'),
            })
          : t('map.orientations.lineTooltip', {
              trend: item.trend,
              plunge: item.plunge,
              longitude: lonLat[0],
              latitude: lonLat[1],
              layer: item.layerName ?? t('map.layers.unknown'),
              status: hasCoords ? t('map.status.georeferenced') : t('map.status.placeholder'),
            });

      return {
        id: item.id,
        type: item.type,
        position,
        label,
        data: item,
        color: layerColor,
        opacity: layerOpacity,
        hasCoordinates: hasCoords,
      };
    });
  }, [visibleStructuralData, t]);

  const missingCoordinateCount = useMemo(
    () => orientationMarkers.filter((marker) => !marker.hasCoordinates).length,
    [orientationMarkers]
  );

  const applyAutoFit = useCallback(
    (targets: FitTarget[], options?: { animate?: boolean }) => {
      const map = mapRef.current;
      if (!map || targets.length === 0) {
        return;
      }

      const animate = options?.animate ?? true;
      const finalize = () => {
        isAutoFittingRef.current = false;
        setHasUserAdjustedView(false);
      };

      const scheduleFinalize = () => {
        if (!animate) {
          finalize();
          return;
        }

        map.once('moveend', finalize);
        window.setTimeout(() => {
          if (isAutoFittingRef.current) {
            finalize();
          }
        }, 600);
      };

      const latLngs = targets.map(([lat, lng]) => L.latLng(lat, lng));
      if (latLngs.length === 1) {
        isAutoFittingRef.current = true;
        const { lat, lng } = latLngs[0];
        const targetZoom = Math.max(map.getZoom(), 7);
        map.flyTo([lat, lng], targetZoom, { animate });
        scheduleFinalize();
        return;
      }

      const bounds = L.latLngBounds(latLngs);
      if (!bounds.isValid()) {
        finalize();
        return;
      }

      const padding = L.point(48, 48);
      const computedZoom = map.getBoundsZoom(bounds, false, padding);
      isAutoFittingRef.current = true;

      if (computedZoom >= 7) {
        const targetZoom = Math.min(
          Math.max(computedZoom, 7),
          map.getMaxZoom() ?? computedZoom
        );
        map.flyTo(bounds.getCenter(), targetZoom, { animate });
        scheduleFinalize();
        return;
      }

      map.fitBounds(bounds, {
        padding,
        animate,
      });
      scheduleFinalize();
    },
    []
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const markAdjusted = () => {
      if (!isAutoFittingRef.current) {
        setHasUserAdjustedView(true);
      }
    };
    map.on('dragstart', markAdjusted);
    map.on('zoomstart', markAdjusted);
    return () => {
      map.off('dragstart', markAdjusted);
      map.off('zoomstart', markAdjusted);
    };
  }, []);

  const overlayLines = useMemo(() => {
    return localFeatures
      .filter((feature) => feature.geometry.type === 'LineString')
      .map((feature, index) => ({
        id: feature.id ?? `line-${index}`,
        positions: toPolyline(feature.geometry.coordinates),
      }))
      .filter((entry) => entry.positions.length > 0);
  }, [localFeatures]);

  const overlayPoints = useMemo(() => {
    return localFeatures
      .filter((feature) => {
        if (feature.geometry.type !== 'Point') {
          return false;
        }
        const properties = feature.properties ?? {};
        const rawType = typeof properties.type === 'string' ? properties.type.toLowerCase() : undefined;
        return rawType !== 'plane' && rawType !== 'line';
      })
      .map((feature, index) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        return {
          id: feature.id ?? `point-${index}`,
          position: [latitude, longitude] as LatLngExpression,
        };
      });
  }, [localFeatures]);

  const selectedIdString = useMemo(
    () => (selectedOrientationId !== null ? String(selectedOrientationId) : null),
    [selectedOrientationId]
  );

  const orientationFitTargets = useMemo<FitTarget[]>(
    () =>
      orientationMarkers
        .filter((marker) => marker.hasCoordinates)
        .map((marker) => marker.position as FitTarget),
    [orientationMarkers]
  );

  const overlayPointTargets = useMemo<FitTarget[]>(
    () => overlayPoints.map((point) => point.position as FitTarget),
    [overlayPoints]
  );

  const overlayLineTargets = useMemo<FitTarget[]>(
    () =>
      overlayLines.flatMap((line) =>
        line.positions.map((position) => position as FitTarget)
      ),
    [overlayLines]
  );

  const autoFitTargets = useMemo<FitTarget[]>(
    () => [...orientationFitTargets, ...overlayPointTargets, ...overlayLineTargets],
    [orientationFitTargets, overlayPointTargets, overlayLineTargets]
  );

  const selectedFitTargets = useMemo<FitTarget[]>(
    () =>
      selectedIdString === null
        ? []
        : orientationMarkers
            .filter(
              (marker) =>
                marker.hasCoordinates &&
                String(marker.id) === selectedIdString
            )
            .map((marker) => marker.position as FitTarget),
    [orientationMarkers, selectedIdString]
  );

  useEffect(() => {
    if (autoFitTargets.length === 0) {
      autoFitSignatureRef.current = null;
      return;
    }
    if (hasUserAdjustedView) {
      return;
    }
    const signature = buildSignature(autoFitTargets);
    if (signature === autoFitSignatureRef.current) {
      return;
    }
    applyAutoFit(autoFitTargets, { animate: true });
    autoFitSignatureRef.current = signature;
  }, [autoFitTargets, hasUserAdjustedView, applyAutoFit]);

  useEffect(() => {
    if (selectedOrientationId === null) {
      lastSelectedRef.current = null;
      selectedFitSignatureRef.current = null;
      return;
    }

    if (selectedFitTargets.length === 0) {
      selectedFitSignatureRef.current = null;
      lastSelectedRef.current = selectedOrientationId;
      return;
    }

    const signature = buildSignature(selectedFitTargets);
    if (
      lastSelectedRef.current === selectedOrientationId &&
      signature === selectedFitSignatureRef.current
    ) {
      return;
    }

    applyAutoFit(selectedFitTargets, { animate: true });
    selectedFitSignatureRef.current = signature;
    lastSelectedRef.current = selectedOrientationId;
  }, [applyAutoFit, selectedFitTargets, selectedOrientationId]);

  const recenter = useCallback(
    (scope: 'selected' | 'all') => {
      const targets =
        scope === 'selected' && selectedFitTargets.length > 0
          ? selectedFitTargets
          : autoFitTargets;

      if (targets.length === 0) {
        return;
      }

      if (scope === 'selected' && selectedFitTargets.length > 0) {
        selectedFitSignatureRef.current = buildSignature(selectedFitTargets);
      } else {
        autoFitSignatureRef.current = buildSignature(targets);
      }

      applyAutoFit(targets, { animate: true });
    },
    [applyAutoFit, autoFitTargets, selectedFitTargets]
  );

  const handleCsvImport = useCallback(
    async (text: string) => {
      const result = validateCsv(text);

      if (result.planes.length > 0) {
        for (const plane of result.planes) {
          const layerId = await resolveLayerId(plane);
          await addPlane({
            dipDirection: plane.dipDirection,
            dip: plane.dip,
            latitude: plane.latitude,
            longitude: plane.longitude,
            layerId: layerId ?? undefined,
          });
        }
      }
      if (result.lines.length > 0) {
        for (const line of result.lines) {
          const layerId = await resolveLayerId(line);
          await addLine({
            trend: line.trend,
            plunge: line.plunge,
            latitude: line.latitude,
            longitude: line.longitude,
            layerId: layerId ?? undefined,
          });
        }
      }

      setFeedback({
        imported:
          result.planes.length > 0 || result.lines.length > 0
            ? { planes: result.planes.length, lines: result.lines.length }
            : null,
        errors: result.errors,
        warnings: result.warnings,
      });
    },
    [addLine, addPlane, resolveLayerId]
  );

  const handleGeoJsonImport = useCallback(
    async (input: string) => {
      const parsed = validateGeoJson(input);
      setLocalFeatures(parsed.features);

      if (parsed.errors.length > 0) {
        setFeedback({
          imported: null,
          errors: parsed.errors,
          warnings: parsed.warnings,
        });
        return;
      }

      const { planes, lines, warnings } = extractOrientationsFromGeoJson(parsed.features);

      if (planes.length > 0) {
        for (const plane of planes) {
          const layerId = await resolveLayerId(plane);
          await addPlane({
            dipDirection: plane.dipDirection,
            dip: plane.dip,
            latitude: plane.latitude,
            longitude: plane.longitude,
            layerId: layerId ?? undefined,
          });
        }
      }
      if (lines.length > 0) {
        for (const line of lines) {
          const layerId = await resolveLayerId(line);
          await addLine({
            trend: line.trend,
            plunge: line.plunge,
            latitude: line.latitude,
            longitude: line.longitude,
            layerId: layerId ?? undefined,
          });
        }
      }

      setFeedback({
        imported: planes.length > 0 || lines.length > 0 ? { planes: planes.length, lines: lines.length } : null,
        errors: [],
        warnings: [...parsed.warnings, ...warnings],
      });
    },
    [addLine, addPlane, resolveLayerId]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      try {
        const text = await file.text();
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'csv') {
          await handleCsvImport(text);
        } else {
          await handleGeoJsonImport(text);
        }
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [handleCsvImport, handleGeoJsonImport]
  );

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files || files.length === 0) {
      return;
    }
    void handleFile(files[0]);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-gray-700">{t('map.title')}</h3>
        <p className="text-sm text-gray-500">{t('map.subtitle')}</p>
      </header>
      <div className="relative flex-1 min-h-[260px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          style={{ minHeight: '260px' }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          {/* OSM tiles work offline only if cached; surface notice for offline testing (RFC-2025-10). */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {orientationMarkers.map((marker) => {
            const isSelected =
              selectedIdString !== null && String(marker.id) === selectedIdString;
            return (
              <CircleMarker
                key={`orientation-${marker.id}`}
                center={marker.position}
                pathOptions={{
                  color: marker.color,
                  fillColor: marker.color,
                  fillOpacity: 0.6 * marker.opacity,
                  weight: isSelected ? 4 : 2,
                  opacity: isSelected ? 0.95 : 0.75 * marker.opacity,
                }}
                radius={marker.type === 'plane' ? 6 : 5}
                eventHandlers={{
                  click: () => setSelectedOrientationId(marker.id),
                }}
              >
                <Tooltip direction="top">{marker.label}</Tooltip>
              </CircleMarker>
            );
          })}

          {overlayLines.map((feature) => (
            <Polyline
              key={`overlay-line-${feature.id}`}
              positions={feature.positions}
              pathOptions={{ color: '#64748b', weight: 3, opacity: 0.65 }}
            />
          ))}

          {overlayPoints.map((feature) => (
            <CircleMarker
              key={`overlay-point-${feature.id}`}
              center={feature.position}
              radius={4}
              pathOptions={{
                color: '#475569',
                fillColor: '#94a3b8',
                fillOpacity: 0.8,
                weight: 2,
              }}
            />
          ))}
        </MapContainer>

        {!isOnline ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/70 p-4 text-center text-sm text-slate-100">
            {t('map.offlineNotice')}
          </div>
        ) : null}

        {missingCoordinateCount > 0 ? (
          <div className="pointer-events-none absolute bottom-3 left-1/2 w-[90%] -translate-x-1/2 rounded-md bg-amber-500/90 px-4 py-2 text-center text-xs font-medium text-white shadow-lg sm:w-auto">
            {t('map.warnings.missingCoordinates', { count: missingCoordinateCount })}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">{t('map.layers.legend')}</span>
        {layers.map((layer) => (
          <span
            key={layer.id}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
              layer.visible ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50 text-slate-400'
            }`}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: layer.color, opacity: layer.opacity }}
              aria-hidden
            />
            <span>{layer.name}</span>
          </span>
        ))}
        <button
          type="button"
          onClick={() => recenter(selectedFitTargets.length > 0 ? 'selected' : 'all')}
          className="ml-auto rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
        >
          {selectedFitTargets.length > 0
            ? t('map.controls.recenterSelected')
            : t('map.controls.recenterAll')}
        </button>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-medium text-gray-700">{t('map.import.title')}</h4>
            <p className="text-xs text-gray-500">{t('map.import.description')}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,application/geo+json,.json,.csv,text/csv"
              className="hidden"
              onChange={onFileChange}
            />
            <button
              type="button"
              onClick={openFileDialog}
              disabled={isProcessing}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isProcessing ? t('map.import.status.processing') : t('map.import.cta')}
            </button>
          </div>
        </div>
        {feedback.imported ? (
          <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {t('map.import.status.success', {
              planes: feedback.imported.planes,
              lines: feedback.imported.lines,
            })}
          </p>
        ) : null}
        {feedback.errors.length > 0 ? (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <p className="font-semibold">{t('map.import.status.errorsTitle')}</p>
            <ul className="mt-1 list-disc pl-5">
              {feedback.errors.map((error, index) => (
                <li key={`${error.key}-${index}`}>{t(error.key, error.context)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {feedback.warnings.length > 0 ? (
          <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
            <p className="font-semibold">{t('map.import.status.warningsTitle')}</p>
            <ul className="mt-1 list-disc pl-5">
              {feedback.warnings.map((warning, index) => (
                <li key={`${warning.key}-${index}`}>{t(warning.key, warning.context)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default MapView;
