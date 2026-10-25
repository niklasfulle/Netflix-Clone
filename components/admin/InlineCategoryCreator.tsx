"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { CategorySummary } from '@/lib/category-validation';
import type { ExampleVerdict } from '@/lib/video-examples/types';
import type { TranslationKey } from '@/lib/i18n/translations';

const errors: readonly TranslationKey[] = ['This category already exists.', 'Use a category name between 1 and 80 characters.'];
export function InlineCategoryCreator({ suggestedName, onCreated, onBusyChange, disabled }: Readonly<{
  suggestedName: string;
  onCreated: (category: CategorySummary, verdict: ExampleVerdict) => Promise<void>;
  onBusyChange: (busy: boolean) => void;
  disabled: boolean;
}>) {
  const { t, locale } = useLanguage();
  const [name, setName] = useState(locale === 'de' ? suggestedName.slice(0, 80) : '');
  const [nameEn, setNameEn] = useState(locale === 'en' ? suggestedName.slice(0, 80) : '');
  const [verdict, setVerdict] = useState<ExampleVerdict>('PRESENT');
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  async function create() {
    if (pending || disabled || !name.trim() || !nameEn.trim()) return;
    setPending(true); onBusyChange(true); setFailure('');
    try {
      const response = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), nameEn: nameEn.trim() }) });
      const result = await response.json();
      if (!response.ok) { setFailure(t(errors.find(message => message === result?.error?.message) ?? 'Category could not be saved.')); return; }
      if (typeof result.id !== 'string' || typeof result.name !== 'string' || typeof result.nameEn !== 'string') throw new Error('Invalid category response');
      await onCreated({ id: result.id, name: result.name, nameEn: result.nameEn, contentCount: 0 }, verdict);
    } catch { setFailure(t('Category could not be saved.')); }
    finally { setPending(false); onBusyChange(false); }
  }
  return <form onSubmit={event => { event.preventDefault(); void create(); }} className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950/60 p-4">
    <h3 className="text-sm font-semibold">{t('Create category')}</h3>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">{t('Category name (German)')}<input value={name} onChange={event => setName(event.target.value)} maxLength={80} required disabled={disabled || pending} className="mt-2 h-11 w-full rounded border border-zinc-700 bg-zinc-950 px-3" /></label>
      <label className="text-sm">{t('Category name (English)')}<input value={nameEn} onChange={event => setNameEn(event.target.value)} maxLength={80} required disabled={disabled || pending} className="mt-2 h-11 w-full rounded border border-zinc-700 bg-zinc-950 px-3" /></label>
    </div>
    <label className="block text-sm">{t('Category verdict')}<select value={verdict} onChange={event => setVerdict(event.target.value as ExampleVerdict)} disabled={disabled || pending} className="ml-3 h-10 rounded border border-zinc-700 bg-zinc-950 px-2"><option value="PRESENT">{t('Present in this segment')}</option><option value="ABSENT">{t('Absent from this segment')}</option><option value="UNCERTAIN">{t('Uncertain in this segment')}</option></select></label>
    <Button type="submit" disabled={disabled || pending || !name.trim() || !nameEn.trim()}>{t('Create category')}</Button>
    {failure && <p role="alert" className="text-sm text-red-300">{failure}</p>}
  </form>;
}
