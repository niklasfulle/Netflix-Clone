"use client";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Mail } from 'lucide-react';

import { login } from '@/actions/login';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthPasswordInput } from '@/components/auth/auth-password-input';
import { getAuthResultMessageKey } from '@/components/auth/auth-result';
import { CardWrapper } from '@/components/auth/card-wrapper';
import { MfaChallenge } from '@/components/auth/mfa-challenge';
import { PasskeyLogin } from '@/components/auth/passkey-login';
import { QrDeviceLogin } from '@/components/auth/qr-device-login';
import { useAuthFormReady } from '@/components/auth/use-auth-form-ready';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { Button } from '@/components/ui/button';
import type { AuthResult } from '@/lib/authentication/contracts';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { createLoginSchema, LoginSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';

export const LoginForm = () => {
  const { t } = useLanguage();
  const formReady = useAuthFormReady();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? t('Email already in use!')
      : "";
  const [challenge, setChallenge] = useState<Extract<AuthResult, { status: 'challenge' }> | null>(null);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const localizedLoginSchema = useMemo(() => createLoginSchema({
    emailRequired: t('Email is required.'),
    passwordRequired: t('Password is required.'),
    codeRequired: t('A six-digit code is required.'),
  }), [t]);
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(localizedLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const showUnexpectedError = (caught: unknown) => {
    if (!isRedirectError(caught)) setError(t('Something went wrong!'));
  };

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      login(values)
        .then((result) => {
          const messageKey = getAuthResultMessageKey(result.code);

          if (result.status === 'rejected' || result.status === 'retry') {
            form.reset();
            setError(messageKey ? t(messageKey) : t('Something went wrong!'));
            return;
          }

          if (result.status === 'success' && result.code === 'signed_in') {
            router.replace(DEFAULT_LOGIN_REDIRECT);
            router.refresh();
            return;
          }

          if (result.status === 'success' && messageKey) {
            form.reset();
            setSuccess(t(messageKey));
          }

          if (result.status === 'challenge') setChallenge(result);
        })
        .catch(showUnexpectedError);
    });
  };

  const submitChallenge = (code: string, challengeMethod: 'totp' | 'email_otp') => {
    setError('');
    startTransition(() => {
      login({ ...form.getValues(), code, challengeMethod })
        .then((result) => {
          const messageKey = getAuthResultMessageKey(result.code);
              if (result.status === 'rejected' || result.status === 'retry') {
                setError(messageKey ? t(messageKey) : t('Something went wrong!'));
              } else if (result.status === 'success' && result.code === 'signed_in') {
                router.replace(DEFAULT_LOGIN_REDIRECT);
                router.refresh();
              } else if (result.status === 'challenge') {
            setChallenge(result);
          }
        })
        .catch(showUnexpectedError);
    });
  };

  const requestEmailChallenge = () => {
    setError('');
    startTransition(() => {
      login({ ...form.getValues(), challengeMethod: 'email_otp', code: undefined })
        .then((result) => {
          const messageKey = getAuthResultMessageKey(result.code);
          if (result.status === 'challenge') {
            setChallenge(result);
          } else if (result.status === 'rejected' || result.status === 'retry') {
            setError(messageKey ? t(messageKey) : t('Something went wrong!'));
          }
        })
        .catch(showUnexpectedError);
    });
  };

  if (challenge) {
    return (
      <CardWrapper
        headerLabel={t('Security check')}
        headerDescription={t('Complete the second step to sign in.')}
        backButtonLabel={t("Don't have an account?")}
        backButtonHref="/auth/register"
      >
        <MfaChallenge
          challenge={challenge}
          isPending={isPending}
          error={error}
          onSubmit={submitChallenge}
          onRequestEmail={requestEmailChallenge}
          onResendEmail={requestEmailChallenge}
          onBack={() => {
            setChallenge(null);
            setError('');
          }}
        />
      </CardWrapper>
    );
  }

  const submitLabel = isPending ? t('Signing in…') : t('Login');

  return (
    <CardWrapper
      headerLabel={t('Welcome back')}
      headerDescription={t('Sign in to continue to your library.')}
      backButtonLabel={t("Don't have an account?")}
      backButtonHref="/auth/register"
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
                          autoComplete="current-password"
                          showPasswordLabel={t('Show password')}
                          hidePasswordLabel={t('Hide password')}
                          capsLockMessage={t('Caps Lock is on')}
                        />
                      </FormControl>
                      <FormMessage />
                      <Button
                        size="sm"
                        variant="link_dark"
                        asChild
                        className="mt-1 h-auto px-0 py-1 font-medium text-zinc-400 hover:text-white"
                      >
                        <Link href="/auth/reset">{t('Forgot password?')}</Link>
                      </Button>
                    </FormItem>
                  )}
                />
          </div>
          <FormError message={error ?? urlError} />
          <FormSuccess message={success} />
          <Button
            type="submit"
            disabled={isPending}
            variant="auth"
            size="lg"
            className="mt-2 h-12 rounded-xl bg-red-600 text-base shadow-lg shadow-red-950/30 hover:bg-red-500"
          >
            {submitLabel}
          </Button>
          </fieldset>
        </form>
      </Form>
      <PasskeyLogin />
      <QrDeviceLogin />
    </CardWrapper>
  );
};
