'use client';

import { useId } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { CATEGORY_COLOR_PALETTE } from '@/lib/category-color';

export function CategoryColorPicker({ value, onChange, suggested, disabled }: Readonly<{
  value: string; onChange: (color: string) => void; suggested: string; disabled: boolean;
}>) {
  const { t } = useLanguage();
  const id = useId();
  return <fieldset disabled={disabled} className="min-w-0 space-y-3 rounded-xl border border-zinc-700 bg-zinc-950/50 p-4">
    <legend className="px-1 text-sm font-medium text-zinc-200">{t('Category color')}</legend>
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor={id} className="sr-only">{t('Custom color')}</label>
      <input id={id} type="color" value={value} onChange={event => onChange(event.target.value.toUpperCase())} className="h-11 w-14 cursor-pointer rounded-lg border border-zinc-600 bg-zinc-900 p-1 disabled:cursor-not-allowed" />
      <span className="font-mono text-sm text-zinc-300">{value}</span>
      <button type="button" onClick={() => onChange(suggested)} className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs text-zinc-300 hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-40"><RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />{t('Use suggested color')}</button>
    </div>
    <div className="flex flex-wrap gap-1" aria-label={t('Color palette')}>
      {CATEGORY_COLOR_PALETTE.map(color => <button key={color} type="button" aria-label={`${t('Choose color')} ${color}`} aria-pressed={value === color} onClick={() => onChange(color)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent hover:border-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-40">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-black" style={{ backgroundColor: color }}>{value === color && <Check aria-hidden="true" className="h-4 w-4" />}</span>
      </button>)}
    </div>
    <p className="text-xs leading-5 text-zinc-400">{t('This color is used in the player timeline.')}</p>
  </fieldset>;
}
