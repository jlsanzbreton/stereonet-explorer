import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { StructuralData } from '@/features/stereonet/model/types';
import { orientationsToCsv, orientationsToGeoJson } from '../exporters';
import { validateGeoJson } from '../validation';

describe('orientations exporters', () => {
  const sampleData: StructuralData[] = [
    { id: 1, type: 'plane', dipDirection: 120, dip: 45 },
    { id: 'line-a', type: 'line', trend: 210, plunge: 12 },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-02T03:04:05Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('converts orientations to CSV with headers', () => {
    const csv = orientationsToCsv(sampleData);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('id,type,dipDirection,dip,trend,plunge');
    expect(lines[1]).toBe('1,plane,120,45,,');
    expect(lines[2]).toBe('line-a,line,,,210,12');
  });

  it('builds a GeoJSON FeatureCollection with placeholder coordinates', () => {
    const geoJson = orientationsToGeoJson(sampleData);
    expect(geoJson.type).toBe('FeatureCollection');
    expect(geoJson.features).toHaveLength(2);

    const planeFeature = geoJson.features[0];
    expect(planeFeature.geometry.type).toBe('Point');
    expect(planeFeature.properties?.type).toBe('plane');
    expect(planeFeature.properties?.createdAt).toBe('2025-01-02T03:04:05.000Z');
    expect(planeFeature.properties?.dipDirection).toBe(120);
    expect(planeFeature.geometry).toEqual({
      type: 'Point',
      coordinates: [120, 45],
    });

    const lineFeature = geoJson.features[1];
    expect(lineFeature.properties?.type).toBe('line');
    expect(lineFeature.geometry).toEqual({
      type: 'Point',
      coordinates: [-150, 12],
    });
  });
});

describe('validateGeoJson', () => {
  it('accepts FeatureCollection with Point and LineString geometries', () => {
    const payload = JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [120, 45] },
          properties: { type: 'plane' },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
          properties: { type: 'line' },
        },
      ],
    });

    const result = validateGeoJson(payload);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.features).toHaveLength(2);
  });

  it('flags unsupported geometries and malformed features', () => {
    const payload = {
      type: 'FeatureCollection',
      features: [
        null,
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [] },
          properties: {},
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [45] },
          properties: {},
        },
      ],
    };
    const result = validateGeoJson(payload);
    expect(result.features).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.map((warning) => warning.key)).toEqual([
      'geo.validation.emptyFeature',
      'geo.validation.unsupportedGeometry',
      'geo.validation.invalidPoint',
    ]);
  });

  it('returns parse errors for invalid JSON strings', () => {
    const result = validateGeoJson('{"type":');
    expect(result.features).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.key).toBe('geo.validation.parseError');
  });
});
