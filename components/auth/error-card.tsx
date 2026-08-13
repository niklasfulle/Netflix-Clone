"use client";

import { CardWrapper } from '@/components/auth/card-wrapper';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { TriangleAlert } from 'lucide-react';

export const ErrorCard = () => {
  const { t } = useLanguage();

  return (
    <CardWrapper
      headerLabel={t('Oops! Something went wrong!')}
      headerDescription={t('Return to sign in and try again.')}
      backButtonHref="/auth/login"
      backButtonLabel={t('Back to Login')}
    >
      <div className="flex w-full items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 py-8">
        <TriangleAlert className="h-9 w-9 text-red-400" aria-hidden="true" />
      </div>
    </CardWrapper>
  );
};
