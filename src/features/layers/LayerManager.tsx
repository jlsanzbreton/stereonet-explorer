import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  selectDefaultLayerId,
  selectLayers,
  selectStructuralData,
  useStereonetStore,
} from '@/state/store';
import type { Layer, LayerKind } from './model/layerTypes';

type EditingState = {
  [layerId: number]: string;
};

const layerKindOptions: { value: LayerKind; i18n: string }[] = [
  { value: 'stereonet', i18n: 'layers.kind.stereonet' },
  { value: 'map', i18n: 'layers.kind.map' },
  { value: 'analysis', i18n: 'layers.kind.analysis' },
];

const LayerManager: React.FC = () => {
  const { t } = useTranslation();
  const layers = useStereonetStore(selectLayers);
  const structuralData = useStereonetStore(selectStructuralData);
  const defaultLayerId = useStereonetStore(selectDefaultLayerId);
  const addLayer = useStereonetStore((state) => state.addLayer);
  const updateLayerStyle = useStereonetStore((state) => state.updateLayerStyle);
  const toggleLayerVisibility = useStereonetStore((state) => state.toggleLayerVisibility);
  const deleteLayer = useStereonetStore((state) => state.deleteLayer);

  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerKind, setNewLayerKind] = useState<LayerKind>('map');
  const [editingNames, setEditingNames] = useState<EditingState>({});

  const countsByLayer = useMemo(() => {
    const counts = new Map<number, number>();
    structuralData.forEach((item) => {
      const key = typeof item.layerId === 'number' ? item.layerId : null;
      if (key === null) {
        return;
      }
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [structuralData]);

  const startEditing = (layer: Layer) => {
    setEditingNames((prev) => ({
      ...prev,
      [layer.id]: layer.name,
    }));
  };

  const commitEditing = async (layer: Layer) => {
    const pendingName = editingNames[layer.id];
    if (typeof pendingName !== 'string' || pendingName.trim() === '') {
      setEditingNames((prev) => {
        const next = { ...prev };
        delete next[layer.id];
        return next;
      });
      return;
    }
    await updateLayerStyle(layer.id, { name: pendingName.trim() });
    setEditingNames((prev) => {
      const next = { ...prev };
      delete next[layer.id];
      return next;
    });
  };

  const handleAddLayer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newLayerName.trim() === '') {
      return;
    }
    await addLayer({ name: newLayerName.trim(), kind: newLayerKind });
    setNewLayerName('');
  };

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
      <header>
        <h2 className="text-lg font-semibold text-slate-700">
          {t('layers.title')}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t('layers.subtitle')}
        </p>
      </header>

      <form onSubmit={handleAddLayer} className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label htmlFor="new-layer-name" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('layers.new.name')}
            </label>
            <input
              id="new-layer-name"
              type="text"
              value={newLayerName}
              onChange={(event) => setNewLayerName(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('layers.new.placeholder')}
            />
          </div>
          <div className="sm:w-48">
            <label htmlFor="new-layer-kind" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('layers.new.kind')}
            </label>
            <select
              id="new-layer-kind"
              value={newLayerKind}
              onChange={(event) => setNewLayerKind(event.target.value as LayerKind)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {layerKindOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.i18n)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          {t('layers.new.cta')}
        </button>
      </form>

      <ul className="space-y-3">
        {layers.map((layer) => {
          const isDefault = layer.id === defaultLayerId;
          const pendingName = editingNames[layer.id];
          const orientationCount = countsByLayer.get(layer.id) ?? 0;

          return (
            <li
              key={layer.id}
              className={`rounded-md border p-3 transition ${
                layer.visible ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-3">
                    {pendingName !== undefined ? (
                      <input
                        value={pendingName}
                        onChange={(event) =>
                          setEditingNames((prev) => ({
                            ...prev,
                            [layer.id]: event.target.value,
                          }))
                        }
                        ref={(node) => {
                          if (node) {
                            node.focus();
                            node.select();
                          }
                        }}
                        onBlur={() => {
                          void commitEditing(layer);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void commitEditing(layer);
                          }
                          if (event.key === 'Escape') {
                            setEditingNames((prev) => {
                              const next = { ...prev };
                              delete next[layer.id];
                              return next;
                            });
                          }
                        }}
                        className="w-full max-w-xs rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={t('layers.editName.label')}
                      />
                    ) : (
                      <button
                        type="button"
                        className="text-left text-sm font-semibold text-slate-700 hover:text-blue-600"
                        onClick={() => startEditing(layer)}
                        aria-label={t('layers.editName.button', { name: layer.name })}
                      >
                        {layer.name}
                      </button>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t(`layers.kind.${layer.kind}`)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {t('layers.count', { count: orientationCount })}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <label className="flex items-center gap-2">
                      <span>{t('layers.fields.color')}</span>
                      <input
                        type="color"
                        value={layer.color}
                        onChange={(event) =>
                          void updateLayerStyle(layer.id, { color: event.target.value })
                        }
                        aria-label={t('layers.fields.color')}
                        className="h-8 w-8 cursor-pointer rounded border border-slate-300"
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <span>{t('layers.fields.opacity')}</span>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={layer.opacity}
                        onChange={(event) =>
                          void updateLayerStyle(layer.id, {
                            opacity: Number.parseFloat(event.target.value),
                          })
                        }
                        aria-label={t('layers.fields.opacity')}
                      />
                      <span className="w-10 text-right text-xs text-slate-600">
                        {layer.opacity.toFixed(2)}
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={layer.visible}
                        onChange={() => {
                          void toggleLayerVisibility(layer.id);
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{t('layers.fields.visible')}</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(layer)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
                  >
                    {t('layers.actions.rename')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isDefault) {
                        void deleteLayer(layer.id);
                      }
                    }}
                    className="rounded-md border border-red-400 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isDefault}
                  >
                    {t('layers.actions.delete')}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default LayerManager;
