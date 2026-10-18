"use client";

import { CardWrapper } from '@/components/auth/card-wrapper';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { TriangleAlert } from 'lucide-react';
import { logout } from '@/actions/logout';

export const ErrorCard = () => {
  const { t } = useLanguage();

  return (
    <CardWrapper
      headerLabel={t('Oops! Something went wrong!')}
      headerDescription={t('Return to sign in and try again.')}
      backButtonHref="/auth/login"
      backButtonLabel={t('Back to Login')}
      backButtonAction={logout}
      backButtonPendingLabel={t('Returning to sign in...')}
    >
      <div role="alert" className="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-6 text-center">
        <TriangleAlert className="h-9 w-9 text-red-400" aria-hidden="true" />
        <p className="text-sm leading-6 text-red-200">{t('Your current sign-in could not be used. Return to sign in to start a new session.')}</p>
      </div>
    </CardWrapper>
  );
};
