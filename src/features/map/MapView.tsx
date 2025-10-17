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
import { COLORS } from '@/features/stereonet/model/transforms';
import {
  orientationToLeafletLatLng,
  orientationToLonLat,
} from '@/features/map/orientationMapping';
import {
  selectSelectedOrientationId,
  selectStructuralData,
  useStereonetStore,
} from '@/state/store';
import {
  LineImport,
  OrientationGeoJsonFeature,
  PlaneImport,
  validateCsv,
  validateGeoJson,
  ValidationMessage,
} from '@/services/validation';

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
        planes.push({ dipDirection, dip });
      } else {
        warnings.push({
          key: 'map.import.errors.invalidPlaneProps',
          context: { feature: rowIndex },
        });
      }
      return;
    }

    if (rawType === 'line') {
      const trend = toNumber(properties.trend as number | string);
      const plunge = toNumber(properties.plunge as number | string);
      if (
        isWithin(trend, EXTRACT_RANGES.trend.min, EXTRACT_RANGES.trend.max) &&
        isWithin(plunge, EXTRACT_RANGES.plunge.min, EXTRACT_RANGES.plunge.max)
      ) {
        lines.push({ trend, plunge });
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
      context: { feature: rowIndex },
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
  const addPlane = useStereonetStore((state) => state.addPlane);
  const addLine = useStereonetStore((state) => state.addLine);
  const selectedOrientationId = useStereonetStore(selectSelectedOrientationId);
  const setSelectedOrientationId = useStereonetStore((state) => state.setSelectedOrientationId);

  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<ImportFeedback>(initialFeedback);
  const [localFeatures, setLocalFeatures] = useState<OrientationGeoJsonFeature[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const lastSelectedRef = useRef<number | string | null>(null);

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

  const orientationMarkers = useMemo(() => {
    return structuralData.map((item) => {
      const [latitude, longitude] = orientationToLeafletLatLng(item);
      const lonLat = orientationToLonLat(item);
      const position: LatLngExpression = [latitude, longitude];
      const label =
        item.type === 'plane'
          ? t('map.orientations.planeTooltip', {
              dipDirection: item.dipDirection,
              dip: item.dip,
              longitude: lonLat[0],
              latitude: lonLat[1],
            })
          : t('map.orientations.lineTooltip', {
              trend: item.trend,
              plunge: item.plunge,
              longitude: lonLat[0],
              latitude: lonLat[1],
            });

      return {
        id: item.id,
        type: item.type,
        position,
        label,
        data: item,
      };
    });
  }, [structuralData, t]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    if (selectedOrientationId === null) {
      lastSelectedRef.current = null;
      return;
    }
    if (lastSelectedRef.current === selectedOrientationId) {
      return;
    }
    const marker = orientationMarkers.find(
      (entry) => String(entry.id) === String(selectedOrientationId)
    );
    if (marker) {
      mapRef.current.setView(marker.position, Math.max(mapRef.current.getZoom(), 4), {
        animate: true,
      });
      lastSelectedRef.current = selectedOrientationId;
    }
  }, [orientationMarkers, selectedOrientationId]);

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

  const handleCsvImport = useCallback(
    async (text: string) => {
      const result = validateCsv(text);

      if (result.planes.length > 0) {
        for (const plane of result.planes) {
          await addPlane(plane);
        }
      }
      if (result.lines.length > 0) {
        for (const line of result.lines) {
          await addLine(line);
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
    [addLine, addPlane]
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
          await addPlane(plane);
        }
      }
      if (lines.length > 0) {
        for (const line of lines) {
          await addLine(line);
        }
      }

      setFeedback({
        imported: planes.length > 0 || lines.length > 0 ? { planes: planes.length, lines: lines.length } : null,
        errors: [],
        warnings: [...parsed.warnings, ...warnings],
      });
    },
    [addLine, addPlane]
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

  const selectedIdString = selectedOrientationId !== null ? String(selectedOrientationId) : null;

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
            const color = marker.type === 'plane' ? COLORS.PLANE : COLORS.LINE;
            return (
              <CircleMarker
                key={`orientation-${marker.id}`}
                center={marker.position}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.7,
                  weight: isSelected ? 4 : 2,
                  opacity: isSelected ? 0.9 : 0.75,
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
