import React, { useCallback, useMemo, useState } from 'react';
import { toPng } from 'html-to-image';
import { useTranslation } from 'react-i18next';
import { ProjectionType } from '../model/types';
import { selectStructuralData, useStereonetStore } from '@/state/store';

interface ToolbarProps {
  stereonetRef: React.RefObject<SVGSVGElement>;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

const Toolbar: React.FC<ToolbarProps> = ({ stereonetRef }) => {
  const { t, i18n } = useTranslation();
  const projection = useStereonetStore((state) => state.projection);
  const setProjection = useStereonetStore((state) => state.setOrientationProjection);
  const showGrid = useStereonetStore((state) => state.showGrid);
  const setShowGrid = useStereonetStore((state) => state.setShowGrid);
  const showPoles = useStereonetStore((state) => state.showPoles);
  const setShowPoles = useStereonetStore((state) => state.setShowPoles);
  const clearAll = useStereonetStore((state) => state.clearAll);
  const loadSample = useStereonetStore((state) => state.loadSample);
  const structuralData = useStereonetStore(selectStructuralData);

  const totals = useMemo(() => {
    return structuralData.reduce(
      (acc, item) => {
        if (item.type === 'plane') {
          acc.planes += 1;
        } else {
          acc.lines += 1;
        }
        return acc;
      },
      { planes: 0, lines: 0 }
    );
  }, [structuralData]);

  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);

  const triggerDownload = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const buildAnnotatedSvg = useCallback(
    (svgNode: SVGSVGElement, formattedDate: string) => {
      const clone = svgNode.cloneNode(true) as SVGSVGElement;
      let width = Number.parseFloat(clone.getAttribute('width') ?? 'NaN');
      let height = Number.parseFloat(clone.getAttribute('height') ?? 'NaN');

      if (!Number.isFinite(width) || !Number.isFinite(height)) {
        const viewBox = clone.getAttribute('viewBox');
        if (viewBox) {
          const [, , vbWidth, vbHeight] = viewBox
            .split(/\s+/)
            .map((value) => Number.parseFloat(value));
          if (Number.isFinite(vbWidth)) {
            width = vbWidth;
          }
          if (Number.isFinite(vbHeight)) {
            height = vbHeight;
          }
        }
      }

      if (!Number.isFinite(width) || width <= 0) {
        width = 600;
      }
      if (!Number.isFinite(height) || height <= 0) {
        height = 600;
      }

      const legendHeight = 110;
      const totalHeight = height + legendHeight;

      clone.setAttribute('width', `${width}`);
      clone.setAttribute('height', `${totalHeight}`);
      clone.setAttribute('viewBox', `0 0 ${width} ${totalHeight}`);
      clone.setAttribute('xmlns', SVG_NS);
      clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

      const background = document.createElementNS(SVG_NS, 'rect');
      background.setAttribute('x', '0');
      background.setAttribute('y', '0');
      background.setAttribute('width', `${width}`);
      background.setAttribute('height', `${totalHeight}`);
      background.setAttribute('fill', '#ffffff');
      clone.insertBefore(background, clone.firstChild);

      const legendGroup = document.createElementNS(SVG_NS, 'g');
      legendGroup.setAttribute('transform', `translate(24, ${height + 24})`);
      legendGroup.setAttribute('font-family', 'Inter, system-ui, sans-serif');

      const title = document.createElementNS(SVG_NS, 'text');
      title.textContent = t('toolbar.export.title');
      title.setAttribute('font-size', '18');
      title.setAttribute('font-weight', '600');
      title.setAttribute('dominant-baseline', 'hanging');
      legendGroup.appendChild(title);

      const dateLine = document.createElementNS(SVG_NS, 'text');
      dateLine.textContent = t('toolbar.export.date', { date: formattedDate });
      dateLine.setAttribute('y', '26');
      dateLine.setAttribute('font-size', '12');
      dateLine.setAttribute('dominant-baseline', 'hanging');
      legendGroup.appendChild(dateLine);

      const summary = document.createElementNS(SVG_NS, 'text');
      summary.textContent = t('toolbar.export.summary', {
        planes: totals.planes,
        lines: totals.lines,
      });
      summary.setAttribute('y', '44');
      summary.setAttribute('font-size', '12');
      summary.setAttribute('dominant-baseline', 'hanging');
      legendGroup.appendChild(summary);

      const note = document.createElementNS(SVG_NS, 'text');
      note.textContent = t('toolbar.export.note');
      note.setAttribute('y', '62');
      note.setAttribute('font-size', '11');
      note.setAttribute('dominant-baseline', 'hanging');
      legendGroup.appendChild(note);

      clone.appendChild(legendGroup);

      return {
        svgElement: clone,
        width: Math.ceil(width),
        height: Math.ceil(totalHeight),
      };
    },
    [t, totals.lines, totals.planes]
  );

  const handleExport = useCallback(
    async (format: 'svg' | 'png') => {
      const svgNode = stereonetRef.current;
      if (!svgNode) {
        setExportStatus({ type: 'error', message: t('toolbar.export.missing') });
        return;
      }

      setIsExporting(true);
      setExportStatus(null);

      const now = new Date();
      const formattedDate = new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(now);
      const stamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const filenameBase = `stereonet-export-${stamp}`;

      try {
        const { svgElement } = buildAnnotatedSvg(svgNode, formattedDate);

        if (format === 'svg') {
          const serializer = new XMLSerializer();
          const svgString = serializer.serializeToString(svgElement);
          const blob = new Blob([svgString], {
            type: 'image/svg+xml;charset=utf-8',
          });
          triggerDownload(blob, `${filenameBase}.svg`);
        } else {
          const container = document.createElement('div');
          container.style.position = 'fixed';
          container.style.left = '-9999px';
          container.style.top = '-9999px';
          container.style.pointerEvents = 'none';
          container.style.opacity = '0';
          container.appendChild(svgElement);
          document.body.appendChild(container);
          try {
            const dataUrl = await toPng(svgElement, {
              cacheBust: true,
              backgroundColor: '#ffffff',
              pixelRatio: 2,
            });
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            triggerDownload(blob, `${filenameBase}.png`);
          } finally {
            document.body.removeChild(container);
          }
        }

        setExportStatus({
          type: 'success',
          message: t('toolbar.export.success', {
            format: format.toUpperCase(),
          }),
        });
      } catch (error) {
        console.error('Stereonet export failed', error);
        setExportStatus({ type: 'error', message: t('toolbar.export.error') });
      } finally {
        setIsExporting(false);
      }
    },
    [stereonetRef, t, triggerDownload, buildAnnotatedSvg, i18n.language]
  );

  const handleLoadSample = () => {
    void loadSample({ force: true });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b p-2">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold">{t('toolbar.projection.label')}</span>
        <div className="flex items-center rounded-md bg-gray-200">
          <button
            onClick={() => setProjection(ProjectionType.Schmidt)}
            className={`px-3 py-1 text-sm transition-colors ${
              projection === ProjectionType.Schmidt
                ? 'rounded-l-md bg-blue-600 text-white'
                : 'rounded-l-md text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('toolbar.projection.equalArea')}
          </button>
          <button
            onClick={() => setProjection(ProjectionType.Wulff)}
            className={`px-3 py-1 text-sm transition-colors ${
              projection === ProjectionType.Wulff
                ? 'rounded-r-md bg-blue-600 text-white'
                : 'rounded-r-md text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('toolbar.projection.equalAngle')}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex cursor-pointer items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(event) => setShowGrid(event.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span>{t('toolbar.options.showGrid')}</span>
        </label>
        <label className="flex cursor-pointer items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={showPoles}
            onChange={(event) => setShowPoles(event.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span>{t('toolbar.options.showPoles')}</span>
        </label>
      </div>

      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('png')}
            disabled={isExporting}
            className="rounded-md border border-blue-500 px-3 py-1 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting
              ? t('toolbar.export.processing')
              : t('toolbar.actions.exportPng')}
          </button>
          <button
            onClick={() => handleExport('svg')}
            disabled={isExporting}
            className="rounded-md border border-blue-500 px-3 py-1 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting
              ? t('toolbar.export.processing')
              : t('toolbar.actions.exportSvg')}
          </button>
          <button
            onClick={handleLoadSample}
            className="rounded-md bg-green-500 px-3 py-1 text-sm text-white transition hover:bg-green-600"
          >
            {t('toolbar.actions.loadSample')}
          </button>
          <button
            onClick={() => {
              void clearAll();
            }}
            className="rounded-md bg-red-500 px-3 py-1 text-sm text-white transition hover:bg-red-600"
          >
            {t('toolbar.actions.clearAll')}
          </button>
        </div>
        {exportStatus ? (
          <p
            className={`text-xs ${
              exportStatus.type === 'success'
                ? 'text-emerald-600'
                : 'text-red-600'
            }`}
            aria-live="polite"
          >
            {exportStatus.message}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default Toolbar;
