import type { FeatureCollection, Point as GeoJsonPoint } from 'geojson';
import type { StructuralData } from '@/features/stereonet/model/types';
import { orientationToLonLat } from '@/features/map/orientationMapping';

export interface OrientationGeoJsonProperties {
  id: string;
  type: 'plane' | 'line';
  source: 'stereonet';
  createdAt: string;
  dipDirection?: number;
  dip?: number;
  trend?: number;
  plunge?: number;
}

const CSV_HEADERS = ['id', 'type', 'dipDirection', 'dip', 'trend', 'plunge'] as const;

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
      const [longitude, latitude] = orientationToLonLat(item);
      const baseProperties: OrientationGeoJsonProperties = {
        id: sanitize(item.id),
        type: item.type,
        source: 'stereonet',
        createdAt: exportedAt,
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
