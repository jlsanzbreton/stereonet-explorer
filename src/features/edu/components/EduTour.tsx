import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'stereonet-explorer:edu-tour/v1';

interface TourStep {
  key: string;
  title: string;
  body: string;
}

const EduTour: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setHasCompleted(stored === 'done');
  }, []);

  const steps: TourStep[] = useMemo(
    () => [
      {
        key: 'welcome',
        title: t('eduTour.steps.welcome.title'),
        body: t('eduTour.steps.welcome.body'),
      },
      {
        key: 'input',
        title: t('eduTour.steps.input.title'),
        body: t('eduTour.steps.input.body'),
      },
      {
        key: 'canvas',
        title: t('eduTour.steps.canvas.title'),
        body: t('eduTour.steps.canvas.body'),
      },
      {
        key: 'data',
        title: t('eduTour.steps.data.title'),
        body: t('eduTour.steps.data.body'),
      },
    ],
    [t]
  );

  const persistCompletion = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, 'done');
    setHasCompleted(true);
  }, []);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setIsOpen(true);
  }, []);

  const closeTour = useCallback(
    (markCompleted = false) => {
      setIsOpen(false);
      if (markCompleted) {
        persistCompletion();
      }
    },
    [persistCompletion]
  );

  const goNext = useCallback(() => {
    setStepIndex((index) => {
      if (index >= steps.length - 1) {
        closeTour(true);
        return steps.length - 1;
      }
      return index + 1;
    });
  }, [closeTour, steps.length]);

  const goPrevious = useCallback(() => {
    setStepIndex((index) => Math.max(index - 1, 0));
  }, []);

  const resetTour = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setHasCompleted(false);
    setStepIndex(0);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTour();
      }
      if (event.key === 'ArrowRight') {
        goNext();
      }
      if (event.key === 'ArrowLeft') {
        goPrevious();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeTour, goNext, goPrevious]);

  const currentStep = steps[stepIndex];

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={startTour}
          className="inline-flex items-center rounded-md border border-blue-500 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {hasCompleted ? t('eduTour.actions.review') : t('eduTour.actions.start')}
        </button>
        {hasCompleted ? (
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
            {t('eduTour.labels.completed')}
          </span>
        ) : (
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
            {t('eduTour.labels.new')}
          </span>
        )}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 px-4 py-6">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <header className="mb-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {t('eduTour.labels.progress', { current: stepIndex + 1, total: steps.length })}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-800">{currentStep.title}</h2>
            </header>
            <p className="text-sm text-slate-600">{currentStep.body}</p>

            <footer className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => closeTour(true)}
                  className="rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100"
                >
                  {t('eduTour.actions.skip')}
                </button>
                <button
                  type="button"
                  onClick={resetTour}
                  className="rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100"
                >
                  {t('eduTour.actions.reset')}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrevious}
                  disabled={stepIndex === 0}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 transition enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t('eduTour.actions.back')}
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {stepIndex === steps.length - 1
                    ? t('eduTour.actions.finish')
                    : t('eduTour.actions.next')}
                </button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default EduTour;
