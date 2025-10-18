import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitch from './LanguageSwitch';
import EduTour from '@/features/edu/components/EduTour';

const TopNav: React.FC = () => {
  const { t } = useTranslation();
  const navItems = [
    { key: 'nav.explore' },
    { key: 'nav.classroom' },
    { key: 'nav.settings' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l1.414 1.414a1 1 0 01-1.414 1.414l-1.414-1.414a1 1 0 011.414-1.414zm10 0l-1.414 1.414a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 1.414zM12 6a6 6 0 100 12 6 6 0 000-12z"
            />
          </svg>
          <h1 className="text-lg font-semibold text-gray-800 sm:text-xl">
            {t('app.title')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <nav
            aria-label={t('nav.primary')}
            className="hidden items-center gap-4 text-sm font-medium text-gray-600 md:flex"
          >
            {navItems.map(({ key }) => (
              <button
                key={key}
                type="button"
                className="rounded-md px-2 py-1 transition hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                {t(key)}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <EduTour />
            <LanguageSwitch />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
