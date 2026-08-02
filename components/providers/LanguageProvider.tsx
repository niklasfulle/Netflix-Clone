"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  DEFAULT_LOCALE,
  germanTranslations,
  LOCALE_STORAGE_KEY,
  messages,
  type Locale,
  type MessageKey,
  type MessageParams,
  type TranslationKey,
} from '@/lib/i18n/translations';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  message: <K extends MessageKey>(key: K, params: MessageParams[K]) => string;
}

const defaultContext: LanguageContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (key) => key,
  message: (key, params) => messages[DEFAULT_LOCALE][key](params),
};

const LanguageContext = createContext<LanguageContextValue>(defaultContext);

export function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: Readonly<{ children: React.ReactNode; initialLocale?: Locale }>) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const changeLocale = useCallback((nextLocale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    document.cookie = `${LOCALE_STORAGE_KEY}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLocale;
    setLocale(nextLocale);
  }, []);

  const t = useCallback((key: TranslationKey) => (
    locale === 'de' ? germanTranslations[key] : key
  ), [locale]);

  const message = useCallback(<K extends MessageKey>(key: K, params: MessageParams[K]) => (
    messages[locale][key](params)
  ), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale: changeLocale, t, message }),
    [locale, changeLocale, t, message],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
