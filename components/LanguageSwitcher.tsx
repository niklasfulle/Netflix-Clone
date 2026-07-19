"use client";

import { useLanguage } from '@/components/providers/LanguageProvider';

const LanguageSwitcher = () => {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className="flex overflow-hidden text-xs font-semibold text-white bg-black/80 border border-zinc-600 rounded-md shadow-lg"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLocale('de')}
        className={`px-3 py-2 transition-colors ${
          locale === 'de' ? 'bg-red-600' : 'hover:bg-zinc-700'
        }`}
        aria-pressed={locale === 'de'}
      >
        DE
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-3 py-2 transition-colors ${
          locale === 'en' ? 'bg-red-600' : 'hover:bg-zinc-700'
        }`}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
