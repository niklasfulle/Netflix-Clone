import React from 'react';
import AdminNav from '@/components/AdminNav';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Netflix - Admin",
  icons: {
    icon: "/icon.ico",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
        <div className="min-h-screen flex flex-col bg-zinc-900">
        <AdminNav />
        <div className="pt-20 max-w-6xl w-full mx-auto px-4">
            <main className="py-4">
            {children}
            </main>
        </div>
        </div>
        <Footer />
    </>
  );
}
import AccountMenu from '@/components/AccountMenu';import Footer from '@/components/Footer';


