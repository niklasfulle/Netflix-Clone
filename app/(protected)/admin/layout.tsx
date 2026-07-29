import React from 'react';
import AdminNav from '@/components/AdminNav';
import { Metadata } from 'next';
import { GenreProvider } from '@/components/providers/GenreProvider';
import { getSelectableGenres } from '@/lib/genres';

export const metadata: Metadata = {
  title: "Netflix - Admin",
  icons: {
    icon: "/icon.ico",
  },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const genres = getSelectableGenres();

  return (
    <GenreProvider genres={genres}>
      <div className="min-h-screen bg-[#09090b] text-zinc-100">
        <AdminNav />
        <div className="pt-16 lg:pl-72 lg:pt-0">
          <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </GenreProvider>
  );
}


