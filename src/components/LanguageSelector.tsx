import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../lib/translations';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const languages: Language[] = ['en', 'es', 'nl'];

  const getFlagEmoji = (lang: Language): string => {
    const flags = {
      en: '🇬🇧',
      nl: '🇳🇱',
      es: '🇪🇸'
    };
    return flags[lang];
  };

  const cycleLanguage = () => {
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  return (
    <button
      onClick={cycleLanguage}
      className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95 shadow-sm"
      aria-label="Change language"
      title="Change language"
    >
      <span className="text-lg sm:text-xl">{getFlagEmoji(language)}</span>
    </button>
  );
};
