import type { FeatureCollection, Point as GeoJsonPoint } from 'geojson';
import type { StructuralData } from '@/features/stereonet/model/types';
import {
  orientationHasCoordinates,
  orientationToLonLat,
} from '@/features/map/orientationMapping';

export interface OrientationGeoJsonProperties {
  id: string;
  type: 'plane' | 'line';
  source: 'stereonet';
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;
  layerId?: string | number | null;
  layerName?: string | null;
  placeholderCoordinates?: boolean;
  dipDirection?: number;
  dip?: number;
  trend?: number;
  plunge?: number;
}

const CSV_HEADERS = [
  'id',
  'type',
  'dipDirection',
  'dip',
  'trend',
  'plunge',
  'latitude',
  'longitude',
  'layerId',
  'layerName',
] as const;

const sanitize = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }
  return String(value);
};

export const orientationsToCsv = (data: StructuralData[]): string => {
  const headerLine = CSV_HEADERS.join(',');
  if (data.length === 0) {
    return `${headerLine}\n`;
  }

  const rows = data.map((item) => {
    const cells: string[] = [
      sanitize(item.id),
      item.type,
      item.type === 'plane' ? sanitize(item.dipDirection) : '',
      item.type === 'plane' ? sanitize(item.dip) : '',
      item.type === 'line' ? sanitize(item.trend) : '',
      item.type === 'line' ? sanitize(item.plunge) : '',
      sanitize(item.latitude ?? null),
      sanitize(item.longitude ?? null),
      sanitize(item.layerId ?? null),
      sanitize(item.layerName ?? null),
    ];
    return cells.join(',');
  });

  return [headerLine, ...rows].join('\n').concat('\n');
};

export const orientationsToGeoJson = (
  data: StructuralData[]
): FeatureCollection<GeoJsonPoint, OrientationGeoJsonProperties> => {
  const exportedAt = new Date().toISOString();

  return {
    type: 'FeatureCollection',
    features: data.map((item) => {
      const hasRealCoordinates = orientationHasCoordinates(item);
      const [fallbackLongitude, fallbackLatitude] = orientationToLonLat(item);
      const longitude = hasRealCoordinates
        ? (item.longitude as number)
        : fallbackLongitude;
      const latitude = hasRealCoordinates
        ? (item.latitude as number)
        : fallbackLatitude;
      const baseProperties: OrientationGeoJsonProperties = {
        id: sanitize(item.id),
        type: item.type,
        source: 'stereonet',
        createdAt: exportedAt,
        latitude: hasRealCoordinates ? (item.latitude as number) : null,
        longitude: hasRealCoordinates ? (item.longitude as number) : null,
        layerId: item.layerId ?? null,
        layerName: item.layerName ?? null,
        placeholderCoordinates: !hasRealCoordinates,
      };

      const properties =
        item.type === 'plane'
          ? {
              ...baseProperties,
              dipDirection: item.dipDirection,
              dip: item.dip,
            }
          : {
              ...baseProperties,
              trend: item.trend,
              plunge: item.plunge,
            };

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        properties,
      };
    }),
  };
};
