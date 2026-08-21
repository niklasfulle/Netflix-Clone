"use client";

import { useLanguage } from '@/components/providers/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n/translations';

export default function LocalizedText({ text }: Readonly<{ text: TranslationKey }>) {
  const { t } = useLanguage();

  return t(text);
}
