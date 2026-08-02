"use client";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { login } from '@/actions/login';
import { CardWrapper } from '@/components/auth/card-wrapper';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { Button } from '@/components/ui/button';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createLoginSchema, LoginSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';

export const LoginForm = () => {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already in use with different provider!"
      : "";
  const [showTwoFactor, setShowTwoFactor] = useState<boolean>(false);
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

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      login(values)
        .then((data: any) => {
          if (data?.error) {
            form.reset();
            setError(data?.error);
          }

          if (data?.success) {
            form.reset();
            setSuccess(data?.success);
          }

          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  };

  return (
    <CardWrapper
      headerLabel={t('Welcome back')}
      backButtonLabel={t("Don't have an account?")}
      backButtonHref="/auth/register"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {showTwoFactor && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">{t('2FA Code')}</FormLabel>
                    <FormControl>
                      <Input
                        className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
                        {...field}
                        disabled={isPending}
                        placeholder="123456"
                        type="text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {!showTwoFactor && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">{t('Email')}</FormLabel>
                      <FormControl>
                        <Input
                          className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
                          {...field}
                          disabled={isPending}
                          placeholder="john.doe@example.com"
                          type="email"
                          autoComplete="email"
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
                      <FormLabel className="text-white">{t('Password')}</FormLabel>
                      <FormControl>
                        <Input
                          className="text-white bg-zinc-800 h-10 placeholder:text-gray-300 pt-2 border-gray-500"
                          {...field}
                          disabled={isPending}
                          placeholder="******"
                          type="password"
                          autoComplete="current-password"
                        />
                      </FormControl>
                      <FormMessage />
                      <Button
                        size="sm"
                        variant="link_dark"
                        asChild
                        className="px-0 font-normal"
                      >
                        <Link href="/auth/reset">{t('Forgot password?')}</Link>
                      </Button>
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          <FormError message={error ?? urlError} />
          <FormSuccess message={success} />
          <Button type="submit" disabled={isPending} variant="auth" size="lg">
            {showTwoFactor ? t('Confirm') : t('Login')}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};
