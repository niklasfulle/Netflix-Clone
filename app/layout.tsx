import './globals.css';
import { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { UserRole } from '@prisma/client';

import { auth } from '@/auth';
import DebugPanel from '@/components/DebugPanel';
import { LanguageProvider } from '@/components/providers/LanguageProvider';

export const metadata: Metadata = {
  title: "Netflix - Home",
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

  return (
    <SessionProvider session={session}>
      <html lang="en">
        <body
          className={`antialiased bg-zinc-900 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:bg-neutral-500`}
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
          <DebugPanel adminAllowed={session?.user?.role === UserRole.ADMIN} />
          <Toaster position="bottom-right" gutter={5} />
        </body>
      </html>
    </SessionProvider>
  );
}
