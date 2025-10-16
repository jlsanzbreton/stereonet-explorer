import React from 'react';
import { Layer, DEFAULT_LAYER_STYLE } from './model/layerTypes';

const placeholderLayers: Layer[] = [
  {
    id: 'stereonet-default',
    name: 'Stereonet data',
    kind: 'stereonet',
    style: DEFAULT_LAYER_STYLE,
  },
];

const LayerManager: React.FC = () => {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
      {/* TODO(rfc-2025-11): Replace placeholder with interactive layer controls. */}
      <h2 className="text-base font-semibold text-slate-700">Layer Manager (stub)</h2>
      <p className="mt-2">
        This placeholder lists the layers that will be synchronized between the stereonet, the map
        and analysis modules in RFC-2025-11.
      </p>
      <ul className="mt-3 space-y-2">
        {placeholderLayers.map((layer) => (
          <li key={layer.id} className="rounded-md border border-dashed border-slate-300 p-2">
            <span className="font-medium text-slate-800">{layer.name}</span>
            <span className="ml-2 text-xs uppercase tracking-wide text-slate-400">{layer.kind}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default LayerManager;
