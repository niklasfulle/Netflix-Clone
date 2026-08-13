"use client";
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

import { newVerification } from '@/actions/new-verification';
import { CardWrapper } from '@/components/auth/card-wrapper';
import { getAuthResultMessageKey } from '@/components/auth/auth-result';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';

export const NewVerificationForm = () => {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const onSubmit = useCallback(() => {
    if (success || error) return;

    if (!token) {
      setError(t('Missing token!'));
      return;
    }

    newVerification(token)
      .then((result) => {
        const messageKey = getAuthResultMessageKey(result.code);
        const message = messageKey ? t(messageKey) : t('Something went wrong!');
        if (result.status === 'rejected' || result.status === 'retry') {
          setError(message);
          return;
        }
        setSuccess(message);
      })
      .catch(() => {
        setError(t('Something went wrong!'));
      });
  }, [token, success, error, t]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <CardWrapper
      headerLabel={t('Confirming your email')}
      headerDescription={t('We are checking your verification link.')}
      backButtonHref="/auth/login"
      backButtonLabel={t('Back to login')}
    >
      <div className="flex min-h-24 w-full flex-col items-center justify-center">
        {!success && !error ? (
          <output className="flex items-center gap-3 text-sm text-zinc-300" aria-live="polite">
            <LoaderCircle className="h-5 w-5 animate-spin text-red-400 motion-reduce:animate-none" aria-hidden="true" />
            <span>{t('Checking link…')}</span>
          </output>
        ) : null}

        <FormSuccess message={success} />
        {error ? <FormError message={error} /> : null}
      </div>
    </CardWrapper>
  );
};
