"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  DEFAULT_LOCALE,
  germanTranslations,
  LOCALE_STORAGE_KEY,
  type Locale,
} from '@/lib/i18n/translations';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (text: string) => string;
}

const reverseTranslations = Object.fromEntries(
  Object.entries(germanTranslations).map(([english, german]) => [german, english])
);

const englishSourceAliases: Record<string, string> = {
  'Alle System- und Backend-Logs einsehen': 'View all system and backend logs',
  'Level filtern:': 'Filter level:',
  'Lade Logs...': 'Loading logs...',
  'Keine Logs gefunden.': 'No logs found.',
  'Fehler beim Leeren der Logs.': 'Error clearing logs.',
  'Fehler beim Laden der Logs.': 'Error loading logs.',
  'Fehler beim Laden der Filme.': 'Error loading movies.',
  'Details anzeigen': 'Show details',
  'Zeit': 'Time',
  'Aktion': 'Action',
  'Alle': 'All',
  'Logs leeren': 'Clear logs',
};

const germanSourceAliases: Record<string, string> = {
  'Alle System- und Backend-Logs einsehen': 'Alle System- und Backend-Protokolle einsehen',
  'Level filtern:': 'Stufe filtern:',
  'Lade Logs...': 'Protokolle werden geladen...',
  'Keine Logs gefunden.': 'Keine Protokolle gefunden.',
  'Fehler beim Leeren der Logs.': 'Fehler beim Leeren der Protokolle.',
  'Fehler beim Laden der Logs.': 'Fehler beim Laden der Protokolle.',
  'Details anzeigen': 'Details anzeigen',
  'Logs leeren': 'Protokolle leeren',
};

const defaultContext: LanguageContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (text) => text,
};

const LanguageContext = createContext<LanguageContextValue>(defaultContext);

function translateDynamicText(text: string, locale: Locale): string {
  if (locale === 'de') {
    const randomPlay = /^Play (.+) in random order$/.exec(text);
    if (randomPlay) return `${randomPlay[1]} in zufälliger Reihenfolge abspielen`;

    const randomTitle = /^Random (.+):$/.exec(text);
    if (randomTitle) return `${randomTitle[1]} – zufällige Wiedergabe:`;
  } else {
    const randomPlay = /^(.+) in zufälliger Reihenfolge abspielen$/.exec(text);
    if (randomPlay) return `Play ${randomPlay[1]} in random order`;

    const randomTitle = /^(.+) – zufällige Wiedergabe:$/.exec(text);
    if (randomTitle) return `Random ${randomTitle[1]}:`;
  }

  return text;
}

function translateValue(value: string, locale: Locale): string {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(value);
  if (!match) return value;

  const [, leading, content, trailing] = match;
  const translations = locale === 'de' ? germanTranslations : reverseTranslations;
  const aliases = locale === 'de' ? germanSourceAliases : englishSourceAliases;
  const translated =
    translations[content] ?? aliases[content] ?? translateDynamicText(content, locale);
  return `${leading}${translated}${trailing}`;
}

function translateNode(node: Node, locale: Locale) {
  if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
    const translated = translateValue(node.nodeValue, locale);
    if (translated !== node.nodeValue) node.nodeValue = translated;
    return;
  }

  if (!(node instanceof Element)) return;

  for (const attribute of ['placeholder', 'title', 'aria-label']) {
    const value = node.getAttribute(attribute);
    if (value) {
      const translated = translateValue(value, locale);
      if (translated !== value) node.setAttribute(attribute, translated);
    }
  }

  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode();
  while (textNode) {
    translateNode(textNode, locale);
    textNode = walker.nextNode();
  }

  node.querySelectorAll('[placeholder], [title], [aria-label]').forEach((element) => {
    for (const attribute of ['placeholder', 'title', 'aria-label']) {
      const value = element.getAttribute(attribute);
      if (value) {
        const translated = translateValue(value, locale);
        if (translated !== value) element.setAttribute(attribute, translated);
      }
    }
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (storedLocale === 'de' || storedLocale === 'en') {
      setLocaleState(storedLocale);
    }
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    setLocaleState(nextLocale);
  }, []);

  const t = useCallback(
    (text: string) => translateValue(text, locale),
    [locale]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    translateNode(document.body, locale);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          translateNode(mutation.target, locale);
        } else if (mutation.type === 'attributes') {
          translateNode(mutation.target, locale);
        } else {
          mutation.addedNodes.forEach((node) => translateNode(node, locale));
        }
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
