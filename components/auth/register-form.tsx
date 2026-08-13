"use client";
import { useMemo, useState, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { Mail, UserRound } from 'lucide-react';

import { register } from '@/actions/register';
import { resendVerificationEmail } from '@/actions/resend-verification';
import { AuthEmailSent } from '@/components/auth/auth-email-sent';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthPasswordInput } from '@/components/auth/auth-password-input';
import { getAuthResultMessageKey } from '@/components/auth/auth-result';
import { PasswordChecklist } from '@/components/auth/password-checklist';
import { CardWrapper } from '@/components/auth/card-wrapper';
import { useAuthFormReady } from '@/components/auth/use-auth-form-ready';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { createRegisterSchema, RegisterSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';

export const RegisterForm = () => {
  const { t } = useLanguage();
  const formReady = useAuthFormReady();
  const [error, setError] = useState<string | undefined>("");
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const localizedRegisterSchema = useMemo(() => createRegisterSchema({
    emailRequired: t('Email is required.'),
    passwordLength: t('Minimum 12 characters required'),
    nameRequired: t('Name is required.'),
    passwordsMismatch: t("Passwords don't match."),
  }), [t]);
  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(localizedRegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirm: "",
      name: "",
    },
  });
  const [password = '', confirmation = ''] = useWatch({
    control: form.control,
    name: ['password', 'confirm'],
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");

    startTransition(() => {
      register(values)
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
        headerLabel={t('Create an Account')}
        headerDescription={t('Create your personal account to start watching.')}
        backButtonLabel={t('Back to login')}
        backButtonHref="/auth/login"
      >
        <AuthEmailSent
          email={submittedEmail}
          title={t('Check your email')}
          description={t('We sent a confirmation link to your email address.')}
          expiryHint={t('The link expires in one hour.')}
          resendLabel={t('Send again')}
          resendingLabel={t('Sending again…')}
          resendAvailableLabel={t('Resend available in')}
          resentLabel={t('Email sent again.')}
          errorLabel={t('Unable to resend. Please try again.')}
          onResend={() => resendVerificationEmail({ email: submittedEmail })}
        />
      </CardWrapper>
    );
  }

  return (
    <CardWrapper
      headerLabel={t('Create an Account')}
      headerDescription={t('Create your personal account to start watching.')}
      backButtonLabel={t('Already have an account?')}
      backButtonHref="/auth/login"
    >
      <Form {...form}>
        <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <fieldset disabled={!formReady || isPending} className="contents">
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-zinc-200">{t('Full name')}</FormLabel>
                  <FormControl>
                    <AuthInput
                      icon={UserRound}
                      {...field}
                      disabled={isPending}
                      placeholder="John Doe"
                      type="text"
                      autoComplete="name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-zinc-200">{t('Password')}</FormLabel>
                  <FormControl>
                    <AuthPasswordInput
                      {...field}
                      disabled={isPending}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      showPasswordLabel={t('Show password')}
                      hidePasswordLabel={t('Hide password')}
                      capsLockMessage={t('Caps Lock is on')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-zinc-200">{t('Confirm password')}</FormLabel>
                  <FormControl>
                    <AuthPasswordInput
                      {...field}
                      disabled={isPending}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      showPasswordLabel={t('Show password')}
                      hidePasswordLabel={t('Hide password')}
                      capsLockMessage={t('Caps Lock is on')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PasswordChecklist
              password={password}
              confirmation={confirmation}
              lengthLabel={t('At least 12 characters')}
              matchLabel={t('Passwords match')}
              ariaLabel={t('Password requirements')}
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
            {isPending ? t('Creating account…') : t('Register')}
          </Button>
          </fieldset>
        </form>
      </Form>
    </CardWrapper>
  );
};
