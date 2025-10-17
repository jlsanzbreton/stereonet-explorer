import React from 'react';

export interface OrientationFeature {
  id: string;
  orientationId: number;
  geometry: {
    type: 'Point' | 'LineString';
    coordinates: number[] | number[][];
  };
  properties?: Record<string, unknown>;
}

const MapView: React.FC = () => {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      {/* TODO(rfc-2025-11): Integrate Leaflet/react-leaflet map synced with stereonet orientations. */}
      MapView placeholder — Leaflet integration scheduled for RFC-2025-11.
    </div>
  );
};

export default MapView;
