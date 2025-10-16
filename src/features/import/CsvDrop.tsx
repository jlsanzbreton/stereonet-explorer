import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStereonetStore } from '@/state/store';
import {
  validateCsv,
  ValidationMessage,
  PlaneImport,
  LineImport,
} from '@/services/validation';

interface ImportFeedback {
  imported: {
    planes: number;
    lines: number;
  } | null;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

const initialFeedback: ImportFeedback = {
  imported: null,
  errors: [],
  warnings: [],
};

const CsvDrop: React.FC = () => {
  const { t } = useTranslation();
  const addPlane = useStereonetStore((state) => state.addPlane);
  const addLine = useStereonetStore((state) => state.addLine);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<ImportFeedback>(initialFeedback);

  const persistPlanes = useCallback(
    async (planes: PlaneImport[]) => {
      for (const plane of planes) {
        await addPlane(plane);
      }
    },
    [addPlane]
  );

  const persistLines = useCallback(
    async (lines: LineImport[]) => {
      for (const line of lines) {
        await addLine(line);
      }
    },
    [addLine]
  );

  const handleResult = useCallback(
    async (text: string) => {
      setIsProcessing(true);
      try {
        const result = validateCsv(text);

        if (result.planes.length > 0) {
          await persistPlanes(result.planes);
        }
        if (result.lines.length > 0) {
          await persistLines(result.lines);
        }

        setFeedback({
          imported:
            result.planes.length > 0 || result.lines.length > 0
              ? {
                  planes: result.planes.length,
                  lines: result.lines.length,
                }
              : null,
          errors: result.errors,
          warnings: result.warnings,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [persistLines, persistPlanes]
  );

  const handleFileList = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }
      const [file] = files;
      const text = await file.text();
      await handleResult(text);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleResult]
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    await handleFileList(event.dataTransfer.files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="space-y-3">
      <header>
        <h3 className="text-lg font-semibold text-gray-700">
          {t('csvDrop.title')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{t('csvDrop.description')}</p>
      </header>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400'
        } ${isProcessing ? 'opacity-70' : ''}`}
        role="button"
        tabIndex={0}
        onClick={openFileDialog}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFileDialog();
          }
        }}
        aria-busy={isProcessing}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => handleFileList(event.target.files)}
        />
        <span className="text-sm font-medium text-blue-600">
          {isProcessing ? t('csvDrop.status.processing') : t('csvDrop.cta')}
        </span>
        <span className="mt-2 text-xs text-gray-500">
          {t('csvDrop.hint')}
        </span>
      </div>
      {feedback.imported ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t('csvDrop.status.success', {
            planes: feedback.imported.planes,
            lines: feedback.imported.lines,
          })}
        </div>
      ) : null}

      {feedback.errors.length > 0 ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p className="font-semibold">{t('csvDrop.status.errorsTitle')}</p>
          <ul className="mt-1 list-disc pl-5">
            {feedback.errors.map((error, index) => (
              <li key={`${error.key}-${index}`}>
                {t(error.key, error.context)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {feedback.warnings.length > 0 ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
          <p className="font-semibold">{t('csvDrop.status.warningsTitle')}</p>
          <ul className="mt-1 list-disc pl-5">
            {feedback.warnings.map((warning, index) => (
              <li key={`${warning.key}-${index}`}>
                {t(warning.key, warning.context)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};

export default CsvDrop;
