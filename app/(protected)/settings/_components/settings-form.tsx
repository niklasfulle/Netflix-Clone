"use client";

import { UserRole } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  LoaderCircle,
  LockKeyhole,
  Mail,
  RotateCcw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

import { settings } from "@/actions/settings";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SettingsSchema } from "@/schemas";

interface SettingsAccount {
  name?: string | null;
  email?: string | null;
  role?: UserRole;
  isOAuth?: boolean;
  isTwoFactorEnabled?: boolean;
}

interface SettingsFormProps {
  user: {
    data?: {
      user?: SettingsAccount;
    };
  };
}

const panelClassName =
  "scroll-mt-28 rounded-3xl border border-white/10 bg-[#111116]/95 p-5 shadow-2xl shadow-black/20 sm:p-7";
const inputClassName =
  "h-12 rounded-xl border-white/10 bg-black/30 px-4 text-white placeholder:text-zinc-600 focus-visible:border-red-500/60 focus-visible:ring-red-500/20";

const getPasswordStrength = (password: string) => {
  if (!password) {
    return { score: 0, label: "Enter a new password", color: "bg-zinc-700" };
  }

  const checks = [
    password.length >= 6,
    password.length >= 10,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  if (score <= 2) {
    return { score: 1, label: "Basic password", color: "bg-amber-500" };
  }
  if (score <= 4) {
    return { score: 3, label: "Good password", color: "bg-sky-500" };
  }
  return { score: 4, label: "Strong password", color: "bg-emerald-500" };
};

export const SettingsForm = ({ user }: SettingsFormProps) => {
  const account = user.data?.user;
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      name: account?.name ?? "",
      email: account?.email ?? "",
      password: "",
      newPassword: "",
      role: account?.role ?? UserRole.USER,
      isTwoFactorEnabled: account?.isTwoFactorEnabled ?? false,
    },
  });
  const newPassword =
    useWatch({
      control: form.control,
      name: "newPassword",
    }) ?? "";

  if (!account) {
    return null;
  }

  const passwordStrength = getPasswordStrength(newPassword);
  const isOAuth = account.isOAuth === true;

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    startTransition(() => {
      settings(values)
        .then(async (data) => {
          if ("error" in data) {
            toast.error(data.error);
            return;
          }

          if ("success" in data) {
            await update();
            toast.success(data.success);
            form.reset({
              ...values,
              password: "",
              newPassword: "",
            });
          }
        })
        .catch(() => toast.error("Something went wrong!"));
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <section id="account" className={panelClassName}>
          <div className="mb-7 flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Personal information</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Keep your account details current and recognizable.
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-zinc-400">
              {account.role === UserRole.ADMIN ? "Administrator" : "Member"}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-zinc-200">
                    <UserRound className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                    Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="John Doe"
                      autoComplete="name"
                      className={inputClassName}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-zinc-600">
                    This name is used for your account.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-zinc-200">
                    <Mail className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      readOnly={isOAuth}
                      type="email"
                      placeholder="john.doe@example.com"
                      autoComplete="email"
                      className={`${inputClassName} ${
                        isOAuth ? "cursor-not-allowed text-zinc-500" : ""
                      }`}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-zinc-600">
                    {isOAuth
                      ? "Managed by your connected sign-in provider."
                      : "A new address must be confirmed by email."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {isOAuth ? "Connected account" : "Email and password account"}
              </p>
              <p className="mt-0.5 text-xs text-zinc-600">
                {isOAuth
                  ? "Password and email changes are handled by your provider."
                  : "You can manage all sign-in options directly here."}
              </p>
            </div>
          </div>
        </section>

        <section id="security" className={panelClassName}>
          <div className="mb-7 flex gap-3 border-b border-white/10 pb-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Sign-in & security</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Protect your account with a strong password and a second factor.
              </p>
            </div>
          </div>

          {isOAuth ? (
            <div className="flex gap-4 rounded-2xl border border-sky-500/15 bg-sky-500/[0.06] p-5">
              <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" aria-hidden="true" />
              <div>
                <p className="font-medium text-sky-100">Security managed externally</p>
                <p className="mt-1 text-sm leading-6 text-sky-200/60">
                  Change your password and two-factor settings with your connected
                  sign-in provider.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-zinc-200">
                        <KeyRound className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                        Current password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            autoComplete="current-password"
                            className={`${inputClassName} pr-12`}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((visible) => !visible)}
                          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-zinc-500 transition hover:text-white"
                          aria-label={
                            showCurrentPassword
                              ? "Hide current password"
                              : "Show current password"
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-zinc-200">
                        <LockKeyhole className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                        New password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            type={showNewPassword ? "text" : "password"}
                            placeholder="At least 6 characters"
                            autoComplete="new-password"
                            className={`${inputClassName} pr-12`}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((visible) => !visible)}
                          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-zinc-500 transition hover:text-white"
                          aria-label={
                            showNewPassword ? "Hide new password" : "Show new password"
                          }
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div aria-live="polite">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-600">Password strength</span>
                  <span className="font-medium text-zinc-400">
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full ${
                        step <= passwordStrength.score
                          ? passwordStrength.color
                          : "bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="isTwoFactorEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                        <ShieldCheck className="h-4 w-4 text-violet-400" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <FormLabel className="text-sm font-medium text-zinc-200">
                          Two-factor authentication
                        </FormLabel>
                        <FormDescription className="max-w-lg text-xs leading-5 text-zinc-600">
                          Require an additional email code when signing in.
                        </FormDescription>
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        disabled={isPending}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Two-factor authentication"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
        </section>

        <section id="preferences" className={panelClassName}>
          <div className="mb-7 flex gap-3 border-b border-white/10 pb-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <Languages className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Language & display</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Choose the language used throughout Netflix.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Interface language</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                Your selection is saved automatically on this device.
              </p>
            </div>
            <LanguageSwitcher />
          </div>
        </section>

        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#16161c]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500" aria-live="polite">
            {form.formState.isDirty
              ? "You have unsaved changes."
              : "All account changes are saved."}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending || !form.formState.isDirty}
              onClick={() => form.reset()}
              className="h-11 flex-1 gap-2 rounded-xl border-white/10 bg-transparent text-zinc-300 hover:bg-white/[0.06] hover:text-white sm:flex-none"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
              className="h-11 flex-1 gap-2 rounded-xl bg-red-600 px-5 text-white hover:bg-red-500 sm:flex-none"
            >
              {isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
