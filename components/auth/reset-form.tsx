"use client";
import { useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Mail } from 'lucide-react';

import { reset } from '@/actions/reset-password';
import { AuthEmailSent } from '@/components/auth/auth-email-sent';
import { AuthInput } from '@/components/auth/auth-input';
import { getAuthResultMessageKey } from '@/components/auth/auth-result';
import { CardWrapper } from '@/components/auth/card-wrapper';
import { useAuthFormReady } from '@/components/auth/use-auth-form-ready';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { createResetPasswordSchema, ResetPasswordSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';

export const ResetForm = () => {
  const { t } = useLanguage();
  const formReady = useAuthFormReady();
  const [error, setError] = useState<string | undefined>("");
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const localizedResetSchema = useMemo(
    () => createResetPasswordSchema(t('Email is required.')),
    [t],
  );
  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(localizedResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof ResetPasswordSchema>) => {
    setError("");

    startTransition(() => {
      reset(values)
        .then((result) => {
          const messageKey = getAuthResultMessageKey(result.code);
          if (result.status === 'rejected' || result.status === 'retry') {
            setError(messageKey ? t(messageKey) : t('Something went wrong!'));
            return;
          }
          setSubmittedEmail(values.email.trim().toLocaleLowerCase('en'));
        })
        .catch(() => setError(t('Something went wrong!')));
    });
  };

  if (submittedEmail) {
    return (
      <CardWrapper
        headerLabel={t('Forgot your password?')}
        headerDescription={t('Enter your email and we will send you a secure reset link.')}
        backButtonHref="/auth/login"
        backButtonLabel={t('Back to login')}
      >
        <AuthEmailSent
          email={submittedEmail}
          title={t('Check your email')}
          description={t('We sent a password reset link to your email address.')}
          expiryHint={t('The link expires in one hour.')}
          resendLabel={t('Send again')}
          resendingLabel={t('Sending again…')}
          resendAvailableLabel={t('Resend available in')}
          resentLabel={t('Email sent again.')}
          errorLabel={t('Unable to resend. Please try again.')}
          onResend={() => reset({ email: submittedEmail })}
        />
      </CardWrapper>
    );
  }

  return (
    <CardWrapper
      headerLabel={t('Forgot your password?')}
      headerDescription={t('Enter your email and we will send you a secure reset link.')}
      backButtonHref="/auth/login"
      backButtonLabel={t('Back to login')}
    >
      <Form {...form}>
        <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <fieldset disabled={!formReady || isPending} className="contents">
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-zinc-200">{t('Email')}</FormLabel>
                  <FormControl>
                    <AuthInput
                      icon={Mail}
                      {...field}
                      disabled={isPending}
                      placeholder="john.doe@example.com"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error} />
          <Button
            type="submit"
            disabled={isPending}
            variant="auth"
            size="lg"
            className="mt-2 h-12 rounded-xl bg-red-600 text-base shadow-lg shadow-red-950/30 hover:bg-red-500"
          >
            {isPending ? t('Sending email…') : t('Send reset email')}
          </Button>
          </fieldset>
        </form>
      </Form>
    </CardWrapper>
  );
};
