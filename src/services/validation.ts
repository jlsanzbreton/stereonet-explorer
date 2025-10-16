import Papa from 'papaparse';

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

export interface GeoJsonValidationResult {
  features: unknown[];
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

export function validateGeoJson(): GeoJsonValidationResult {
  // TODO(rfc-2025-11): Validate GeoJSON structure for MapView layers.
  return {
    features: [],
    errors: [{ key: 'geo.validation.pending' }],
    warnings: [],
  };
}
