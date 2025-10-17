import { describe, it, expect } from 'vitest';
import { validateCsv } from './validation';

describe('validateCsv', () => {
  it('parses planes and lines when values are valid', () => {
    const csv = `dipDirection,dip,trend,plunge\n110,30,,\n,,200,15`;
    const result = validateCsv(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.planes).toHaveLength(1);
    expect(result.lines).toHaveLength(1);
    expect(result.planes[0]).toEqual({ dipDirection: 110, dip: 30 });
    expect(result.lines[0]).toEqual({ trend: 200, plunge: 15 });
  });

  it('respects type hints when provided', () => {
    const csv = `type,dipDirection,dip,trend,plunge\nplane,90,30,,\nline,,,180,20`;
    const result = validateCsv(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.planes).toHaveLength(1);
    expect(result.lines).toHaveLength(1);
  });

  it('flags out-of-range values', () => {
    const csv = `dipDirection,dip\n999,120`;
    const result = validateCsv(csv);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].key).toBe('csvDrop.errors.invalidNumber');
  });

  it('returns an error for empty files', () => {
    const result = validateCsv('');
    expect(result.errors).toEqual([{ key: 'csvDrop.errors.emptyFile' }]);
  });
});
