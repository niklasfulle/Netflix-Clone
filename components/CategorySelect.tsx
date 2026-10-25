"use client";

import Link from 'next/link';
import { MultiSelect } from '@/components/ui/multi-select';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useCategories } from '@/hooks/useCategories';
import { categoryLabel } from '@/lib/category-label';

export function CategorySelect({ value, onChange, disabled }: Readonly<{
  value: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
}>) {
  const { t, locale } = useLanguage();
  const { categories, error, isLoading, refresh } = useCategories();
  return (
    <div className="space-y-2">
      <MultiSelect options={categories.map(category => ({ value: category.id, label: categoryLabel(category, locale) })).sort((a, b) => a.label.localeCompare(b.label, locale))} value={value} onChange={onChange}
        disabled={disabled || isLoading || Boolean(error)} placeholder={t(isLoading ? 'Loading categories...' : 'Select categories')} />
      {error && <p role="alert" className="text-sm text-red-300">{t('Categories could not be loaded.')}</p>}
      {!isLoading && !error && categories.length === 0 && <p className="text-sm text-zinc-400">{t('No categories yet. Create your first category in management.')}</p>}
      <div className="flex flex-wrap gap-4 text-xs">
        <Link href="/admin/categories" target="_blank" rel="noopener noreferrer" className="text-zinc-300 underline hover:text-white">{t('Manage categories')}</Link>
        <button type="button" disabled={disabled || isLoading} onClick={() => { void refresh(undefined, { throwOnError: false }); }} className="text-zinc-300 underline hover:text-white disabled:opacity-50">{t('Refresh categories')}</button>
      </div>
    </div>
  );
}
