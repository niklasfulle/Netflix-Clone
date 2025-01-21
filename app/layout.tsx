import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import "./globals.css";
import { Metadata } from "next";
import { Toaster } from "react-hot-toast";

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
          {children}
          <Toaster position="bottom-right" gutter={5} />
        </body>
      </html>
    </SessionProvider>
  );
}
