"use client";

import { LoaderCircle } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function WatchState({ loading, message, onBack }: Readonly<{
  loading?: boolean; message?: string; onBack: () => void;
}>) {
  const { t } = useLanguage();
  return <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-black p-6 text-center text-white">
    {loading ? <output><LoaderCircle className="mx-auto mb-3 h-8 w-8 animate-spin text-red-500" aria-hidden="true" />{t('Loading...')}</output> : <>
      <h1 className="text-2xl font-semibold">{message || t('Not found')}</h1>
      <button type="button" onClick={onBack} className="min-h-11 rounded-lg bg-red-600 px-6 font-semibold hover:bg-red-500">{t('Back')}</button>
    </>}
  </div>;
}
