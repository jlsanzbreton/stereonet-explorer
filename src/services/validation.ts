import Papa from 'papaparse';
import type {
  Feature,
  FeatureCollection,
  Geometry as GeoJsonGeometry,
  LineString as GeoJsonLineString,
  Point as GeoJsonPoint,
  Position,
} from 'geojson';

export interface PlaneImport {
  dipDirection: number;
  dip: number;
}

export interface LineImport {
  trend: number;
  plunge: number;
}

export interface ValidationMessage {
  key: string;
  context?: Record<string, unknown>;
}

export interface CsvValidationResult {
  planes: PlaneImport[];
  lines: LineImport[];
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

export type SupportedGeoJsonGeometry = GeoJsonPoint | GeoJsonLineString;

export type OrientationGeoJsonFeature = Feature<
  SupportedGeoJsonGeometry,
  Record<string, unknown>
> & {
  geometry: SupportedGeoJsonGeometry;
};

export interface GeoJsonValidationResult {
  features: OrientationGeoJsonFeature[];
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

type TypeHint = 'plane' | 'line' | undefined;

const NUMBER_RANGES = {
  dipDirection: { min: 0, max: 360 },
  dip: { min: 0, max: 90 },
  trend: { min: 0, max: 360 },
  plunge: { min: 0, max: 90 },
} as const;

const NORMALIZED_HEADERS: Record<string, keyof typeof NUMBER_RANGES | 'type'> = {
  dipdirection: 'dipDirection',
  dipdir: 'dipDirection',
  dip: 'dip',
  trend: 'trend',
  plunge: 'plunge',
  lineplunge: 'plunge',
  linedip: 'dip',
  typed: 'type',
  type: 'type',
};

function normalizeHeader(header: string): string {
  return header.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const normalized = String(value).trim();
  if (normalized === '') {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function isWithinRange(
  value: number | null,
  range: { min: number; max: number }
): value is number {
  if (value === null) {
    return false;
  }
  return value >= range.min && value <= range.max;
}

function extractTypeHint(value: unknown): TypeHint {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'plane') {
    return 'plane';
  }
  if (normalized === 'line') {
    return 'line';
  }
  return undefined;
}

export function validateCsv(input: string): CsvValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      planes: [],
      lines: [],
      errors: [{ key: 'csvDrop.errors.emptyFile' }],
      warnings: [],
    };
  }

  const parseResult = Papa.parse<Record<string, unknown>>(trimmed, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];
  const planes: PlaneImport[] = [];
  const lines: LineImport[] = [];

  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach((error) => {
      errors.push({
        key: 'csvDrop.errors.parseError',
        context: {
          message: error.message,
          row: typeof error.row === 'number' ? error.row + 1 : '-',
        },
      });
    });
  }

  parseResult.data.forEach((row, index) => {
    const normalizedEntries = new Map<string, unknown>();
    Object.entries(row ?? {}).forEach(([header, value]) => {
      const normalizedHeader = normalizeHeader(header);
      const mappedHeader = NORMALIZED_HEADERS[normalizedHeader];
      if (mappedHeader) {
        normalizedEntries.set(mappedHeader, value);
      } else {
        normalizedEntries.set(normalizedHeader, value);
      }
    });

    const rowNumber = index + 2; // account for header row
    const typeHint = extractTypeHint(normalizedEntries.get('type'));

    const dipDirection = toNumber(normalizedEntries.get('dipDirection'));
    const dip = toNumber(normalizedEntries.get('dip'));
    const trend = toNumber(normalizedEntries.get('trend'));
    const plunge = toNumber(normalizedEntries.get('plunge'));

    const hasPlaneColumns =
      normalizedEntries.has('dipDirection') || normalizedEntries.has('dip');
    const hasLineColumns =
      normalizedEntries.has('trend') || normalizedEntries.has('plunge');

    const planeCandidateValid =
      isWithinRange(dipDirection, NUMBER_RANGES.dipDirection) &&
      isWithinRange(dip, NUMBER_RANGES.dip);

    const lineCandidateValid =
      isWithinRange(trend, NUMBER_RANGES.trend) &&
      isWithinRange(plunge, NUMBER_RANGES.plunge);

    const recordHasAnyValue =
      [dipDirection, dip, trend, plunge]
        .filter((value) => typeof value === 'number')
        .length > 0;

    const registerPlane = () =>
      planes.push({
        dipDirection: dipDirection as number,
        dip: dip as number,
      });

    const registerLine = () =>
      lines.push({
        trend: trend as number,
        plunge: plunge as number,
      });

    if (typeHint === 'plane') {
      if (planeCandidateValid) {
        registerPlane();
        return;
      }
      errors.push({
        key: hasPlaneColumns
          ? 'csvDrop.errors.invalidPlaneRow'
          : 'csvDrop.errors.missingPlaneColumns',
        context: { row: rowNumber },
      });
      return;
    }

    if (typeHint === 'line') {
      if (lineCandidateValid) {
        registerLine();
        return;
      }
      errors.push({
        key: hasLineColumns
          ? 'csvDrop.errors.invalidLineRow'
          : 'csvDrop.errors.missingLineColumns',
        context: { row: rowNumber },
      });
      return;
    }

    if (planeCandidateValid) {
      registerPlane();
      return;
    }

    if (lineCandidateValid) {
      registerLine();
      return;
    }

    if (!recordHasAnyValue) {
      warnings.push({
        key: 'csvDrop.warnings.emptyRow',
        context: { row: rowNumber },
      });
      return;
    }

    if (hasPlaneColumns || hasLineColumns) {
      errors.push({
        key: 'csvDrop.errors.invalidNumber',
        context: { row: rowNumber },
      });
      return;
    }

    warnings.push({
      key: 'csvDrop.warnings.noRecognizedColumns',
      context: { row: rowNumber },
    });
  });

  if (planes.length === 0 && lines.length === 0 && errors.length === 0) {
    errors.push({ key: 'csvDrop.errors.noValidRows' });
  }

  return { planes, lines, errors, warnings };
}

const isValidPoint = (geometry: GeoJsonPoint | undefined | null): geometry is GeoJsonPoint => {
  if (!geometry) {
    return false;
  }
  if (!Array.isArray(geometry.coordinates)) {
    return false;
  }
  if (geometry.coordinates.length < 2) {
    return false;
  }
  const [longitude, latitude] = geometry.coordinates;
  return Number.isFinite(longitude) && Number.isFinite(latitude);
};

const isValidLineString = (
  geometry: GeoJsonLineString | undefined | null
): geometry is GeoJsonLineString => {
  if (!geometry) {
    return false;
  }
  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
    return false;
  }

  return geometry.coordinates.every((position: Position) => {
    if (!Array.isArray(position) || position.length < 2) {
      return false;
    }
    const [longitude, latitude] = position;
    return Number.isFinite(longitude) && Number.isFinite(latitude);
  });
};

export function validateGeoJson(input: string | object): GeoJsonValidationResult {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];

  let parsed: unknown = input;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      return {
        features: [],
        errors: [{ key: 'geo.validation.emptyInput' }],
        warnings: [],
      };
    }

    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch (error) {
      return {
        features: [],
        errors: [
          {
            key: 'geo.validation.parseError',
            context: {
              message: error instanceof Error ? error.message : String(error),
            },
          },
        ],
        warnings: [],
      };
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      features: [],
      errors: [{ key: 'geo.validation.invalidStructure' }],
      warnings: [],
    };
  }

  const collection = parsed as FeatureCollection;
  if (collection.type !== 'FeatureCollection') {
    return {
      features: [],
      errors: [{ key: 'geo.validation.notFeatureCollection' }],
      warnings: [],
    };
  }

  if (!Array.isArray(collection.features)) {
    return {
      features: [],
      errors: [{ key: 'geo.validation.invalidFeaturesArray' }],
      warnings: [],
    };
  }

  if (collection.features.length === 0) {
    warnings.push({ key: 'geo.validation.noFeatures' });
  }

  const accepted: OrientationGeoJsonFeature[] = [];

  collection.features.forEach((feature, index) => {
    const featureNumber = index + 1;
    if (!feature) {
      warnings.push({
        key: 'geo.validation.emptyFeature',
        context: { index: featureNumber },
      });
      return;
    }

    if (feature.type !== 'Feature') {
      warnings.push({
        key: 'geo.validation.unsupportedFeature',
        context: { index: featureNumber, type: (feature as { type?: unknown }).type ?? 'unknown' },
      });
      return;
    }

    const geometry = feature.geometry as GeoJsonGeometry | null | undefined;

    if (!geometry) {
      warnings.push({
        key: 'geo.validation.missingGeometry',
        context: { index: featureNumber },
      });
      return;
    }

    if (geometry.type === 'Point') {
      const pointGeometry = geometry as GeoJsonPoint;
      if (!isValidPoint(pointGeometry)) {
        warnings.push({
          key: 'geo.validation.invalidPoint',
          context: { index: featureNumber },
        });
        return;
      }
      accepted.push({
        ...feature,
        geometry: pointGeometry,
        properties: feature.properties ?? {},
      });
      return;
    }

    if (geometry.type === 'LineString') {
      const lineGeometry = geometry as GeoJsonLineString;
      if (!isValidLineString(lineGeometry)) {
        warnings.push({
          key: 'geo.validation.invalidLineString',
          context: { index: featureNumber },
        });
        return;
      }
      accepted.push({
        ...feature,
        geometry: lineGeometry,
        properties: feature.properties ?? {},
      });
      return;
    }

    warnings.push({
      key: 'geo.validation.unsupportedGeometry',
      context: { index: featureNumber, type: geometry.type },
    });
  });

  return {
    features: accepted,
    errors,
    warnings,
  };
}
