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

function translateDynamicText(text: string, locale: Locale): string {
  if (locale === 'de') {
    const randomPlay = /^Play (.+) in random order$/.exec(text);
    if (randomPlay) return `${randomPlay[1]} in zufälliger Reihenfolge abspielen`;

    const randomTitle = /^Random (.+):$/.exec(text);
    if (randomTitle) return `${randomTitle[1]} – zufällige Wiedergabe:`;

    const editContent = /^Edit (.+)$/.exec(text);
    if (editContent) return `${editContent[1]} bearbeiten`;

    const viewContent = /^View (.+)$/.exec(text);
    if (viewContent) return `${viewContent[1]} ansehen`;

    const page = /^Page (\d+) of (\d+)$/.exec(text);
    if (page) return `Seite ${page[1]} von ${page[2]}`;

    const updatedItems = /^(\d+) items were updated\.$/.exec(text);
    if (updatedItems) return `${updatedItems[1]} Inhalte wurden aktualisiert.`;

    const createdActor = /^(.+) was created and selected\.$/.exec(text);
    if (createdActor) return `${createdActor[1]} wurde angelegt und ausgewählt.`;

    const newUsers = /^\+(\d+) in 30 days$/.exec(text);
    if (newUsers) return `+${newUsers[1]} in 30 Tagen`;

    const newContent = /^(\d+) new items?$/.exec(text);
    if (newContent) {
      return newContent[1] === '1'
        ? '1 neuer Inhalt'
        : `${newContent[1]} neue Inhalte`;
    }

    if (text === '1 neue Inhalte') return '1 neuer Inhalt';

    const views = /^(\d+) Views$/.exec(text);
    if (views) return `${views[1]} Aufrufe`;

    const pageSize = /^(\d+) \/ page$/.exec(text);
    if (pageSize) return `${pageSize[1]} / Seite`;

    const currentValue = /^Current: (.+)$/.exec(text);
    if (currentValue) return `Aktuell: ${currentValue[1]}`;

    const uploadProgress = /^Uploading\.\.\. (\d+)%$/.exec(text);
    if (uploadProgress) return `Wird hochgeladen... ${uploadProgress[1]} %`;

    const timeLeft = /^~(.+) left$/.exec(text);
    if (timeLeft) return `~${timeLeft[1]} verbleibend`;
  } else {
    const randomPlay = /^(.+) in zufälliger Reihenfolge abspielen$/.exec(text);
    if (randomPlay) return `Play ${randomPlay[1]} in random order`;

    const randomTitle = /^(.+) – zufällige Wiedergabe:$/.exec(text);
    if (randomTitle) return `Random ${randomTitle[1]}:`;

    const editContent = /^(.+) bearbeiten$/.exec(text);
    if (editContent) return `Edit ${editContent[1]}`;

    const viewContent = /^(.+) ansehen$/.exec(text);
    if (viewContent) return `View ${viewContent[1]}`;

    const page = /^Seite (\d+) von (\d+)$/.exec(text);
    if (page) return `Page ${page[1]} of ${page[2]}`;

    const updatedItems = /^(\d+) Inhalte wurden aktualisiert\.$/.exec(text);
    if (updatedItems) return `${updatedItems[1]} items were updated.`;

    const createdActor = /^(.+) wurde angelegt und ausgewählt\.$/.exec(text);
    if (createdActor) return `${createdActor[1]} was created and selected.`;

    const newUsers = /^\+(\d+) in 30 Tagen$/.exec(text);
    if (newUsers) return `+${newUsers[1]} in 30 days`;

    const newContent = /^(\d+) neue Inhalte$/.exec(text);
    if (newContent) {
      return newContent[1] === '1'
        ? '1 new item'
        : `${newContent[1]} new items`;
    }

    if (text === '1 neuer Inhalt' || text === '1 neue Inhalte') {
      return '1 new item';
    }

    const views = /^(\d+) Aufrufe$/.exec(text);
    if (views) return `${views[1]} Views`;

    const pageSize = /^(\d+) \/ Seite$/.exec(text);
    if (pageSize) return `${pageSize[1]} / page`;

    const currentValue = /^Aktuell: (.+)$/.exec(text);
    if (currentValue) return `Current: ${currentValue[1]}`;

    const uploadProgress = /^Wird hochgeladen\.\.\. (\d+) %$/.exec(text);
    if (uploadProgress) return `Uploading... ${uploadProgress[1]}%`;

    const timeLeft = /^~(.+) verbleibend$/.exec(text);
    if (timeLeft) return `~${timeLeft[1]} left`;

    const accountCount = /^von (\d+) Konten$/.exec(text);
    if (accountCount) return `of ${accountCount[1]} accounts`;

    const blockedUntil = /^Bis (.+)$/.exec(text);
    if (blockedUntil) return `Until ${blockedUntil[1]}`;
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
