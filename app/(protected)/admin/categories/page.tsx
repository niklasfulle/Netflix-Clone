"use client";

import { useState } from 'react';
import { Pencil, Plus, Search, Tags, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useCategories } from '@/hooks/useCategories';
import type { TranslationKey } from '@/lib/i18n/translations';
import { categoryLabel } from '@/lib/category-label';
import { CategoryTransfer } from '@/components/admin/CategoryTransfer';

const CATEGORY_ERROR_MESSAGES: readonly TranslationKey[] = [
  'This category already exists.',
  'Category not found.',
  'Use a category name between 1 and 80 characters.',
];

export default function CategoriesPage() {
  const { t, locale } = useLanguage();
  const { categories, error: loadError, isLoading, refresh } = useCategories();
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [draftEn, setDraftEn] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function changeCategory(method: 'POST' | 'PATCH' | 'DELETE', values: { id?: string; name?: string; nameEn?: string }) {
    if (pending) return;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const url = method === 'DELETE' ? `/api/categories?id=${encodeURIComponent(values.id!)}` : '/api/categories';
      const response = await fetch(url, {
        method,
        ...(method !== 'DELETE' && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'Category could not be saved.');
      if (method === 'POST') { setName(''); setNameEn(''); }
      setEditing(null);
      setDeleting(null);
      setNotice(t(method === 'DELETE' ? 'Category deleted.' : 'Category saved.'));
      await refresh(undefined, { throwOnError: false });
    } catch (failure) {
      const knownMessage = failure instanceof Error && CATEGORY_ERROR_MESSAGES.find(message => message === failure.message);
      setError(t(knownMessage || 'Category could not be saved.'));
    } finally {
      setPending(false);
    }
  }

  const filtered = categories.filter(category => `${category.name} ${category.nameEn ?? ''}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => categoryLabel(a, locale).localeCompare(categoryLabel(b, locale), locale));
  return (
    <div className="space-y-6">
      <AdminPageHeader title={t('Categories')} description={t('Create categories and assign multiple categories to movies and series.')} />
      <CategoryTransfer categories={categories} disabled={pending || isLoading || Boolean(loadError)} onBusyChange={setPending} onImported={async () => { await refresh(undefined, { throwOnError: false }); }} />
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Tags aria-hidden="true" className="h-5 w-5 text-red-400" />{t('Create category')}</h2>
        <form onSubmit={event => { event.preventDefault(); void changeCategory('POST', { name, nameEn }); }} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="new-category-name" className="mb-2 block text-sm text-zinc-300">{t('Category name (German)')}</label>
            <input id="new-category-name" value={name} onChange={event => setName(event.target.value)} required maxLength={80} disabled={pending} className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:border-red-500 focus:outline-none" />
          </div>
          <div className="flex-1"><label htmlFor="new-category-name-en" className="mb-2 block text-sm text-zinc-300">{t('Category name (English)')}</label><input id="new-category-name-en" value={nameEn} onChange={event => setNameEn(event.target.value)} required maxLength={80} disabled={pending} className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:border-red-500 focus:outline-none" /></div>
          <Button type="submit" disabled={pending || !name.trim() || !nameEn.trim()} className="h-11 bg-red-600 text-white hover:bg-red-500"><Plus aria-hidden="true" className="mr-2 h-4 w-4" />{t('Create category')}</Button>
        </form>
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        {notice && <output className="mt-4 block text-sm text-emerald-300">{notice}</output>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <label className="m-5 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3">
          <Search aria-hidden="true" className="h-4 w-4 text-zinc-500" />
          <span className="sr-only">{t('Search categories')}</span>
          <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={t('Search categories')} className="h-10 w-full bg-transparent text-sm text-white outline-none" />
        </label>
        {isLoading && <output className="block p-5 text-zinc-400">{t('Loading...')}</output>}
        {loadError && <div className="p-5"><p role="alert" className="text-red-300">{t('Categories could not be loaded.')}</p><Button type="button" className="mt-3" onClick={() => { void refresh(undefined, { throwOnError: false }); }}>{t('Try again')}</Button></div>}
        {!isLoading && !loadError && filtered.length === 0 && <p className="p-5 text-sm text-zinc-400">{t('No categories found.')}</p>}
        <ul className="divide-y divide-zinc-800">
          {filtered.map(category => (
            <li key={category.id} className="p-5">
              {editing === category.id ? (
                <form onSubmit={event => { event.preventDefault(); void changeCategory('PATCH', { id: category.id, name: draft, nameEn: draftEn }); }} className="flex flex-wrap items-center gap-3">
                  <label className="flex-1 text-sm text-zinc-300">{t('Category name (German)')}<input value={draft} onChange={event => setDraft(event.target.value)} required maxLength={80} disabled={pending} className="mt-2 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white" /></label>
                  <label className="flex-1 text-sm text-zinc-300">{t('Category name (English)')}<input value={draftEn} onChange={event => setDraftEn(event.target.value)} required maxLength={80} disabled={pending} className="mt-2 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white" /></label>
                  <Button type="submit" disabled={pending || !draft.trim() || !draftEn.trim()}>{t('Save')}</Button>
                  <Button type="button" disabled={pending} onClick={() => setEditing(null)}>{t('Cancel')}</Button>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0"><h2 className="break-words font-medium text-white">{categoryLabel(category, locale)}</h2><p className="mt-1 text-xs text-zinc-400">DE: {category.name} · EN: {category.nameEn || '—'}</p><p className="mt-1 text-xs text-zinc-400">{t('Linked titles')}: {category.contentCount}</p></div>
                  <div className="flex gap-2">
                    <Button type="button" disabled={pending} aria-label={`${t('Rename category')}: ${categoryLabel(category, locale)}`} onClick={() => { setEditing(category.id); setDraft(category.name); setDraftEn(category.nameEn ?? ''); setDeleting(null); }} className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700"><Pencil aria-hidden="true" className="mr-2 h-4 w-4" />{t('Rename category')}</Button>
                    <Button type="button" disabled={pending} aria-label={`${t('Delete category')}: ${categoryLabel(category, locale)}`} onClick={() => setDeleting(category.id)} className="bg-transparent text-red-300 hover:bg-red-500/10"><Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />{t('Delete')}</Button>
                  </div>
                </div>
              )}
              {deleting === category.id && <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-sm text-red-100">{t('Remove this category and all its assignments? Videos will be kept.')}</p>
                <div className="mt-3 flex gap-2"><Button type="button" disabled={pending} onClick={() => { void changeCategory('DELETE', { id: category.id }); }} className="bg-red-600 text-white">{t('Delete category')}</Button><Button type="button" disabled={pending} onClick={() => setDeleting(null)}>{t('Cancel')}</Button></div>
              </div>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
