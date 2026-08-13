"use client";
import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { setNewPassword } from '@/actions/new-password';
import { AuthPasswordInput } from '@/components/auth/auth-password-input';
import { getAuthResultMessageKey } from '@/components/auth/auth-result';
import { PasswordChecklist } from '@/components/auth/password-checklist';
import { CardWrapper } from '@/components/auth/card-wrapper';
import { useAuthFormReady } from '@/components/auth/use-auth-form-ready';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { Button } from '@/components/ui/button';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { createNewPasswordSchema, NewPasswordSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';

export const NewPasswordForm = () => {
  const { t } = useLanguage();
  const formReady = useAuthFormReady();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();
  const localizedPasswordSchema = useMemo(
    () => createNewPasswordSchema(
      t('Minimum 12 characters required'),
      t("Passwords don't match."),
    ),
    [t],
  );
  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(localizedPasswordSchema),
    defaultValues: {
      password: "",
      confirm: "",
    },
  });
  const [password = '', confirmation = ''] = useWatch({
    control: form.control,
    name: ['password', 'confirm'],
  });

  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      setNewPassword(values, token)
        .then((result) => {
          const messageKey = getAuthResultMessageKey(result.code);
          if (result.status === 'rejected' || result.status === 'retry') {
            setError(messageKey ? t(messageKey) : t('Something went wrong!'));
            return;
          }
          setSuccess(messageKey ? t(messageKey) : t('Something went wrong!'));
        })
        .catch(() => setError(t('Something went wrong!')));
    });
  };

  return (
    <CardWrapper
      headerLabel={t('Enter a new password')}
      headerDescription={t('Choose a new password with at least 12 characters.')}
      backButtonHref="/auth/login"
      backButtonLabel={t('Back to login')}
    >
      <Form {...form}>
        <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <fieldset disabled={!formReady || isPending} className="contents">
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-zinc-200">{t('New Password')}</FormLabel>
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
                  <FormLabel className="text-sm font-medium text-zinc-200">
                    {t('Confirm password')}
                  </FormLabel>
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
          <FormSuccess message={success} />
          <Button
            type="submit"
            disabled={isPending}
            variant="auth"
            size="lg"
            className="mt-2 h-12 rounded-xl bg-red-600 text-base shadow-lg shadow-red-950/30 hover:bg-red-500"
          >
            {isPending ? t('Saving password…') : t('Set Password')}
          </Button>
          </fieldset>
        </form>
      </Form>
    </CardWrapper>
  );
};
