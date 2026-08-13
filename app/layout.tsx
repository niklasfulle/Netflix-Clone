import './globals.css';
import { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { UserRole } from '@prisma/client';
import { cookies } from 'next/headers';

import { auth } from '@/auth';
import DebugPanel from '@/components/DebugPanel';
import EnvironmentBadge from '@/components/EnvironmentBadge';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type Locale } from '@/lib/i18n/translations';

export const metadata: Metadata = {
  title: "Netflix - Home",
  description: "Browse and stream movies and series from your personal media library.",
  icons: {
    icon: "/icon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const cookieStore = await cookies();
  const storedLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
  const locale: Locale = storedLocale === 'de' || storedLocale === 'en'
    ? storedLocale
    : DEFAULT_LOCALE;
  const deploymentEnvironment = process.env.DEPLOYMENT_ENVIRONMENT?.trim().toLowerCase();

  return (
    <html lang={locale} data-environment={deploymentEnvironment}>
      <body
        className={`antialiased bg-zinc-900 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:bg-neutral-500`}
      >
        <EnvironmentBadge environment={deploymentEnvironment} />
        <SessionProvider session={session}>
          <LanguageProvider initialLocale={locale}>
            {children}
          </LanguageProvider>
          <DebugPanel adminAllowed={session?.user?.role === UserRole.ADMIN} />
          <Toaster position="bottom-right" gutter={5} />
        </SessionProvider>
      </body>
    </html>
  );
}
