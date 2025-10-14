import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY } from '@/i18n';

const LanguageSwitch: React.FC = () => {
  const { i18n, t } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;

  const handleChange = (nextLanguage: string) => {
    if (activeLanguage === nextLanguage) {
      return;
    }
    i18n.changeLanguage(nextLanguage);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      } catch {
        // Ignore storage failures (e.g., private mode).
      }
    }
  };

  const languageOptions = [
    { code: 'en', label: t('language.en') },
    { code: 'es', label: t('language.es') },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">{t('language.label')}:</span>
      <div className="flex items-center gap-1">
        {languageOptions.map(({ code, label }) => {
          const isActive = activeLanguage === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => handleChange(code)}
              className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
              aria-pressed={isActive}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageSwitch;
