import type { StructuralData } from '@/features/stereonet/model/types';

export type LonLatTuple = [number, number];
export type LatLngTuple = [number, number];

export const wrapLongitude = (value: number): number => {
  const normalized = ((value % 360) + 540) % 360;
  return normalized - 180;
};

export const clampLatitude = (value: number): number => {
  return Math.max(-90, Math.min(90, value));
};

export const orientationToLonLat = (orientation: StructuralData): LonLatTuple => {
  if (orientation.type === 'plane') {
    // TODO(rfc-2025-11): Swap placeholder mapping once metadata includes true geographic coordinates.
    return [wrapLongitude(orientation.dipDirection), clampLatitude(orientation.dip)];
  }

  return [wrapLongitude(orientation.trend), clampLatitude(orientation.plunge)];
};

export const orientationToLeafletLatLng = (orientation: StructuralData): LatLngTuple => {
  const [longitude, latitude] = orientationToLonLat(orientation);
  return [latitude, longitude];
};
