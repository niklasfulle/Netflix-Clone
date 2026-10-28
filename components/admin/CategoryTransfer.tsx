"use client";

import { useRef, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, FileJson, Languages, LoaderCircle, ShieldCheck, TriangleAlert } from 'lucide-react';
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
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const locked = disabled || pending || reading;
  const exportable = categories.length > 0 && categories.every(category => category.nameEn?.trim());
  let fileSelectionLabel: TranslationKey = 'Choose a JSON file';
  if (document) fileSelectionLabel = 'Choose another file';
  if (reading) fileSelectionLabel = 'Reading category file...';
  function exportFile() {
    if (!exportable) return;
    const data = { schemaVersion: 1, categories: categories.map(({ name, nameEn, color }) => ({ name, nameEn, ...(color && { color }) })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const anchor = globalThis.document.createElement('a'); anchor.href = url; anchor.download = 'categories-export.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function selectFile(file?: File) {
    setFailure(''); setNotice(''); setDocument(null); setPreview(null); setFileName('');
    if (!file) return;
    setReading(true);
    try {
      const { CategoryImportSchema, MAX_CATEGORY_IMPORT_BYTES, categoryImportPreview } = await import('@/lib/category-transfer');
      if (file.size > MAX_CATEGORY_IMPORT_BYTES) { setFailure(t('The category file must be at most 1 MB.')); return; }
      const parsed = CategoryImportSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success) { setFailure(t(parsed.error.issues.some(issue => issue.message === 'DUPLICATE_NAMES') ? 'The file contains duplicate category names.' : 'Invalid category file. Use the exported JSON format.')); return; }
      setDocument(parsed.data); setPreview(categoryImportPreview(parsed.data, categories)); setFileName(file.name);
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
      setDocument(null); setPreview(null); setFileName('');
      setNotice(`${t('Categories imported.')} ${t('New categories')}: ${result.created} · ${t('Updated categories')}: ${result.updated} · ${t('Unchanged categories')}: ${result.unchanged}`);
      await onImported();
    } catch { setFailure(t('Categories could not be imported.')); }
    finally { setPending(false); onBusyChange(false); }
  }
  return <section aria-label={t('Import and export categories')} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 px-5 py-5 sm:px-6">
      <div className="min-w-0 space-y-2">
        <h2 className="text-base font-semibold tracking-tight text-zinc-100">{t('Import and export categories')}</h2>
        <p className="max-w-2xl text-sm leading-6 text-zinc-400">{t('Transfer your global category catalog between installations.')}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300"><Languages aria-hidden="true" className="h-3.5 w-3.5" />DE / EN</span>
    </header>
    <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 sm:p-6">
        <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/70 text-zinc-200"><ArrowDownToLine aria-hidden="true" className="h-5 w-5" /></span>
        <h3 className="font-semibold text-zinc-100">{t('Export categories')}</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">{t('Download all categories with their German and English names.')}</p>
        <div className="mb-5 mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-300"><span className="mr-1 font-semibold tabular-nums text-white">{categories.length}</span>{t('Categories')}</span>
          <span className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400">JSON · DE / EN</span>
        </div>
        <Button type="button" disabled={locked || !exportable} onClick={exportFile} className="mt-auto h-11 w-full gap-2 rounded-lg bg-zinc-100 text-zinc-950 shadow-none hover:bg-white focus-visible:ring-red-400"><ArrowDownToLine aria-hidden="true" className="h-4 w-4" />{t('Export categories')}</Button>
        {categories.some(category => !category.nameEn?.trim()) && <p className="mt-3 text-xs leading-5 text-amber-300">{t('Complete both language names before exporting.')}</p>}
      </div>
      <div className="flex min-w-0 flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400"><ArrowUpFromLine aria-hidden="true" className="h-5 w-5" /></span>
          <div className="min-w-0"><h3 className="font-semibold text-zinc-100">{t('Import categories')}</h3><p className="mt-1 text-sm leading-6 text-zinc-400">{t('Choose a file and review the changes before importing.')}</p></div>
        </div>
        <input ref={fileInput} type="file" aria-label={t('Import categories')} accept=".json,application/json" tabIndex={-1} disabled={locked} onChange={event => { void selectFile(event.target.files?.[0]); }} className="sr-only" />
        <button type="button" disabled={locked} onClick={() => fileInput.current?.click()}
          onDragOver={event => { event.preventDefault(); if (!locked) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => {
            event.preventDefault(); setDragging(false); if (locked) return;
            if (event.dataTransfer.files.length !== 1) { setDocument(null); setPreview(null); setFileName(''); setNotice(''); setFailure(t('Choose one JSON file.')); return; }
            void selectFile(event.dataTransfer.files[0]);
          }}
          className={`group flex min-h-40 w-full flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50 ${dragging ? 'border-red-400 bg-red-500/10' : 'border-zinc-700 bg-zinc-900/50 hover:border-red-400/60 hover:bg-zinc-800/60'}`}>
          {reading ? <LoaderCircle aria-hidden="true" className="mb-1 h-6 w-6 animate-spin text-red-400" /> : <FileJson aria-hidden="true" className="mb-1 h-6 w-6 text-zinc-500 transition-colors group-hover:text-red-400" />}
      <span className="text-sm font-medium text-zinc-100">{t(fileSelectionLabel)}</span>
          <span className="text-xs leading-5 text-zinc-500">{t('Or drop it here')} · JSON · {t('Up to 1 MB')}</span>
        </button>
        {fileName && <p className="mt-3 flex min-w-0 items-center gap-2 text-xs text-zinc-400"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-emerald-400" /><span className="truncate" title={fileName}>{fileName}</span></p>}
      </div>
    </div>
    {preview && <section aria-label={t('Import preview')} className="space-y-4 border-t border-zinc-800 bg-zinc-950/30 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-semibold text-zinc-100"><FileJson aria-hidden="true" className="h-4 w-4 text-zinc-400" />{t('Import preview')}</h3><span className="text-xs text-zinc-500">{preview.total} {t('Categories')}</span></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[{ label: 'New categories', value: preview.created, style: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' }, { label: 'Updated categories', value: preview.updated, style: 'border-amber-500/20 bg-amber-500/5 text-amber-300' }, { label: 'Unchanged categories', value: preview.unchanged, style: 'border-zinc-700 bg-zinc-900/70 text-zinc-300' }].map(stat => <div key={stat.label} className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${stat.style}`}><span className="text-xs font-medium">{t(stat.label as TranslationKey)}</span><strong className="text-xl tabular-nums">{stat.value}</strong></div>)}
      </div>
      <p className="flex items-start gap-2 text-xs leading-5 text-zinc-400"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />{t('Existing translations may be updated. No categories or assignments are deleted.')}</p>
      <div className="max-h-56 overflow-auto rounded-xl border border-zinc-800">
        <table className="w-full table-fixed text-left text-sm"><thead className="sticky top-0 bg-zinc-900 text-xs text-zinc-400"><tr><th scope="col" className="w-1/2 px-4 py-3 font-medium">{t('Category name (German)')}</th><th scope="col" className="w-1/2 px-4 py-3 font-medium">{t('Category name (English)')}</th></tr></thead><tbody className="divide-y divide-zinc-800 bg-zinc-950/40">{document?.categories.slice(0, 20).map(category => <tr key={category.name}><td className="break-words px-4 py-3 text-zinc-200">{category.name}</td><td className="break-words px-4 py-3 text-zinc-400">{category.nameEn}</td></tr>)}</tbody></table>
      </div>
      {document && document.categories.length > 20 && <p className="text-xs text-zinc-500">{t('Showing the first 20 categories.')}</p>}
      <div className="flex flex-col gap-3 pt-1 sm:flex-row"><Button type="button" aria-busy={pending} disabled={disabled || pending} onClick={() => { void applyImport(); }} className="h-11 gap-2 rounded-lg bg-red-600 px-5 text-white shadow-none hover:bg-red-500 focus-visible:ring-red-400">{pending && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}{t('Confirm category import')}</Button><Button type="button" disabled={pending} onClick={() => { setDocument(null); setPreview(null); setFileName(''); }} className="h-11 rounded-lg border border-zinc-700 bg-transparent px-5 text-zinc-300 shadow-none hover:bg-zinc-800 hover:text-white">{t('Cancel')}</Button></div>
    </section>}
    {(failure || notice) && <div className="px-5 pb-5 sm:px-6 sm:pb-6">
      {failure && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-200"><TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{failure}</p>}
      {notice && <output className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-200"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span>{notice}</span></output>}
    </div>}
  </section>;
}
