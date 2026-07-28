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
  'Serie': 'Series',
  'PUBLISHED': 'Published',
  'DRAFT': 'Draft',
  'ARCHIVED': 'Archived',
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
  'Movie': 'Film',
  'PUBLISHED': 'Veröffentlicht',
  'DRAFT': 'Entwurf',
  'ARCHIVED': 'Archiviert',
};

const defaultContext: LanguageContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (text) => text,
};

const LanguageContext = createContext<LanguageContextValue>(defaultContext);

type DynamicTranslationRule = readonly [
  pattern: RegExp,
  translate: (match: RegExpExecArray) => string,
];

const germanDynamicTranslations: readonly DynamicTranslationRule[] = [
  [/^Play (.+) in random order$/, (match) => `${match[1]} in zufälliger Reihenfolge abspielen`],
  [/^Random (.+):$/, (match) => `${match[1]} – zufällige Wiedergabe:`],
  [/^Edit (.+)$/, (match) => `${match[1]} bearbeiten`],
  [/^View (.+)$/, (match) => `${match[1]} ansehen`],
  [/^Page (\d+) of (\d+)$/, (match) => `Seite ${match[1]} von ${match[2]}`],
  [/^(\d+) items were updated\.$/, (match) => `${match[1]} Inhalte wurden aktualisiert.`],
  [/^(.+) was created and selected\.$/, (match) => `${match[1]} wurde angelegt und ausgewählt.`],
  [/^\+(\d+) in 30 days$/, (match) => `+${match[1]} in 30 Tagen`],
  [
    /^(\d+) new items?$/,
    (match) => match[1] === '1' ? '1 neuer Inhalt' : `${match[1]} neue Inhalte`,
  ],
  [/^1 neue Inhalte$/, () => '1 neuer Inhalt'],
  [/^(\d+) Views$/, (match) => `${match[1]} Aufrufe`],
  [/^(\d+) \/ page$/, (match) => `${match[1]} / Seite`],
  [/^Current: (.+)$/, (match) => `Aktuell: ${match[1]}`],
  [/^Uploading\.\.\. (\d+)%$/, (match) => `Wird hochgeladen... ${match[1]} %`],
  [/^~(.+) left$/, (match) => `~${match[1]} verbleibend`],
];

const englishDynamicTranslations: readonly DynamicTranslationRule[] = [
  [/^(.+) in zufälliger Reihenfolge abspielen$/, (match) => `Play ${match[1]} in random order`],
  [/^(.+) – zufällige Wiedergabe:$/, (match) => `Random ${match[1]}:`],
  [/^(.+) bearbeiten$/, (match) => `Edit ${match[1]}`],
  [/^(.+) ansehen$/, (match) => `View ${match[1]}`],
  [/^Seite (\d+) von (\d+)$/, (match) => `Page ${match[1]} of ${match[2]}`],
  [/^(\d+) Inhalte wurden aktualisiert\.$/, (match) => `${match[1]} items were updated.`],
  [/^(.+) wurde angelegt und ausgewählt\.$/, (match) => `${match[1]} was created and selected.`],
  [/^\+(\d+) in 30 Tagen$/, (match) => `+${match[1]} in 30 days`],
  [
    /^(\d+) neue Inhalte$/,
    (match) => match[1] === '1' ? '1 new item' : `${match[1]} new items`,
  ],
  [/^1 (?:neuer Inhalt|neue Inhalte)$/, () => '1 new item'],
  [/^(\d+) Aufrufe$/, (match) => `${match[1]} Views`],
  [/^(\d+) \/ Seite$/, (match) => `${match[1]} / page`],
  [/^Aktuell: (.+)$/, (match) => `Current: ${match[1]}`],
  [/^Wird hochgeladen\.\.\. (\d+) %$/, (match) => `Uploading... ${match[1]}%`],
  [/^~(.+) verbleibend$/, (match) => `~${match[1]} left`],
  [/^von (\d+) Konten$/, (match) => `of ${match[1]} accounts`],
  [/^Bis (.+)$/, (match) => `Until ${match[1]}`],
];

function applyDynamicTranslations(
  text: string,
  rules: readonly DynamicTranslationRule[],
): string {
  for (const [pattern, translate] of rules) {
    const match = pattern.exec(text);
    if (match) return translate(match);
  }
  return text;
}

function translateDynamicText(text: string, locale: Locale): string {
  const rules = locale === 'de'
    ? germanDynamicTranslations
    : englishDynamicTranslations;
  return applyDynamicTranslations(text, rules);
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

export function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (storedLocale === 'de' || storedLocale === 'en') {
      setLocale(storedLocale);
    }
  }, []);

  const changeLocale = useCallback((nextLocale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    setLocale(nextLocale);
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
    () => ({ locale, setLocale: changeLocale, t }),
    [locale, changeLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
