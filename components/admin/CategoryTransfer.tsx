"use client";

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { CategorySummary } from '@/lib/category-validation';
import type { CategoryImportDocument } from '@/lib/category-transfer';
import type { TranslationKey } from '@/lib/i18n/translations';

const errors: Record<string, TranslationKey> = {
  INVALID_CATEGORY_IMPORT: 'Invalid category file. Use the exported JSON format.',
  DUPLICATE_CATEGORY_NAMES: 'The file contains duplicate category names.',
  CATEGORY_IMPORT_TOO_LARGE: 'The category file must be at most 1 MB.',
  CATEGORY_IMPORT_CONFLICT: 'Categories changed during import. Refresh and try again.',
};
type Preview = { created: number; updated: number; unchanged: number; total: number };

export function CategoryTransfer({ categories, disabled, onImported, onBusyChange }: Readonly<{
  categories: CategorySummary[]; disabled: boolean;
  onImported: () => Promise<void>; onBusyChange: (busy: boolean) => void;
}>) {
  const { t } = useLanguage();
  const fileInput = useRef<HTMLInputElement>(null);
  const [document, setDocument] = useState<CategoryImportDocument | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pending, setPending] = useState(false);
  const [reading, setReading] = useState(false);
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');
  const exportable = categories.length > 0 && categories.every(category => category.nameEn?.trim());
  function exportFile() {
    if (!exportable) return;
    const data = { schemaVersion: 1, categories: categories.map(({ name, nameEn }) => ({ name, nameEn })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const anchor = globalThis.document.createElement('a'); anchor.href = url; anchor.download = 'categories-export.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function selectFile(file?: File) {
    setFailure(''); setNotice(''); setDocument(null); setPreview(null);
    if (!file) return;
    setReading(true);
    try {
      const { CategoryImportSchema, MAX_CATEGORY_IMPORT_BYTES, categoryImportPreview } = await import('@/lib/category-transfer');
      if (file.size > MAX_CATEGORY_IMPORT_BYTES) { setFailure(t('The category file must be at most 1 MB.')); return; }
      const parsed = CategoryImportSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success) { setFailure(t(parsed.error.issues.some(issue => issue.message === 'DUPLICATE_NAMES') ? 'The file contains duplicate category names.' : 'Invalid category file. Use the exported JSON format.')); return; }
      setDocument(parsed.data); setPreview(categoryImportPreview(parsed.data, categories));
    } catch { setFailure(t('Invalid category file. Use the exported JSON format.')); }
    finally { setReading(false); if (fileInput.current) fileInput.current.value = ''; }
  }
  async function applyImport() {
    if (!document || pending || disabled) return;
    setPending(true); onBusyChange(true); setFailure(''); setNotice('');
    try {
      const response = await fetch('/api/categories/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(document) });
      const result = await response.json();
      if (!response.ok) { setFailure(t(errors[result.error] ?? 'Categories could not be imported.')); return; }
      setDocument(null); setPreview(null);
      setNotice(`${t('Categories imported.')} ${t('New categories')}: ${result.created} · ${t('Updated categories')}: ${result.updated} · ${t('Unchanged categories')}: ${result.unchanged}`);
      await onImported();
    } catch { setFailure(t('Categories could not be imported.')); }
    finally { setPending(false); onBusyChange(false); }
  }
  return <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
    <h2 className="font-semibold">{t('Import and export categories')}</h2>
    <p className="text-sm text-zinc-400">{t('JSON contains German and English names. Imports merge categories and preserve existing IDs and assignments.')}</p>
    <div className="flex flex-wrap gap-3"><Button type="button" disabled={disabled || pending || reading || !exportable} onClick={exportFile}>{t('Export categories')}</Button>
      <label className="flex flex-wrap items-center gap-3 text-sm">{t('Import categories')}<input ref={fileInput} type="file" accept=".json,application/json" disabled={disabled || pending || reading} onChange={event => { void selectFile(event.target.files?.[0]); }} className="max-w-full rounded border border-zinc-700 bg-zinc-950 p-2" /></label>
    </div>
    {categories.some(category => !category.nameEn?.trim()) && <p className="text-xs text-amber-300">{t('Complete both language names before exporting.')}</p>}
    {reading && <output>{t('Loading...')}</output>}
    {preview && <div className="space-y-3 rounded border border-zinc-700 p-4">
      <p className="text-sm">{t('Import preview')}: {preview.total} · {t('New categories')}: {preview.created} · {t('Updated categories')}: {preview.updated} · {t('Unchanged categories')}: {preview.unchanged}</p>
      <p className="text-xs text-zinc-400">{t('Existing translations may be updated. No categories or assignments are deleted.')}</p>
      <ul className="max-h-40 overflow-y-auto text-xs text-zinc-300">{document?.categories.slice(0, 20).map(category => <li key={category.name}>DE: {category.name} · EN: {category.nameEn}</li>)}</ul>
      <div className="flex gap-3"><Button type="button" disabled={disabled || pending} onClick={() => { void applyImport(); }}>{t('Confirm category import')}</Button><Button type="button" disabled={pending} onClick={() => { setDocument(null); setPreview(null); }}>{t('Cancel')}</Button></div>
    </div>}
    {failure && <p role="alert" className="text-sm text-red-300">{failure}</p>}
    {notice && <output className="block text-sm text-emerald-300">{notice}</output>}
  </section>;
}
