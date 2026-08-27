"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Clapperboard,
  DatabaseBackup,
  Home,
  Languages,
  LayoutDashboard,
  ListTodo,
  Menu,
  PlusCircle,
  ScrollText,
  ServerCog,
  ScanSearch,
  ShieldCheck,
  Users,
  UserRoundSearch,
  X,
} from "lucide-react";

import AccountMenu from "@/components/AccountMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import useCurrentProfil from "@/hooks/useCurrentProfil";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import type { TranslationKey } from "@/lib/i18n/translations";

const navigation: { label: TranslationKey; href: string; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Content", href: "/admin/movies", icon: Clapperboard },
  { label: "New Content", href: "/admin/movies/new", icon: PlusCircle },
  { label: "Actors", href: "/admin/actors", icon: UserRoundSearch },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Analytics", href: "/admin/statistics", icon: BarChart3 },
  { label: "System", href: "/admin/system", icon: ServerCog },
  { label: "Media Health", href: "/admin/media-health", icon: ScanSearch },
  { label: "Backups", href: "/admin/backups", icon: DatabaseBackup },
  { label: "Job Operations", href: "/admin/jobs", icon: ListTodo },
  { label: "System Logs", href: "/admin/logs", icon: ScrollText },
  { label: "Audit Log", href: "/admin/audit", icon: ShieldCheck },
];

function NavLinks({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const activeHref = navigation
    .filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  return (
    <nav aria-label={t("Admin Area")} className="space-y-1">
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-red-600 text-white shadow-lg shadow-red-950/30"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {t(label)}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: profil } = useCurrentProfil();
  const pathname = usePathname();
  const { t } = useLanguage();
  const drawerRef = useRef<HTMLDialogElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const previousPathnameRef = useRef(pathname);
  const closeMobileNavigation = useCallback(() => setMobileOpen(false), []);

  useDialogFocus(mobileOpen, drawerRef, closeMobileNavigation, drawerCloseRef);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      setMobileOpen(false);
      previousPathnameRef.current = pathname;
    }
  }, [pathname]);

  const profileImage = profil?.image || "placeholder.png";

  const sidebarContent = (
    <>
      <div className="flex h-20 items-center border-b border-zinc-800 px-6">
        <Link href="/admin" className="flex items-center gap-3" aria-label={t("Netflix Admin Home")}>
          <Image src="/images/Logo.png" alt="Netflix" width={112} height={32} className="h-7 w-auto" priority />
          <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">
            Admin
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Management
        </p>
        <NavLinks onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="border-t border-zinc-800 p-4">
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
          <span className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <Languages className="h-4 w-4" aria-hidden="true" />
            {t("Language")}
          </span>
          <LanguageSwitcher compact />
        </div>
        <Link
          href="/"
          className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          {t("Back to Netflix")}
        </Link>
        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-left hover:border-zinc-700"
            aria-expanded={accountOpen}
          >
            <Image
              src={`/images/profil/${profileImage}`}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-zinc-100">{profil?.name || "Admin"}</span>
              <span className="block text-xs text-zinc-500">{t("Account & Sign out")}</span>
            </span>
          </button>
          <AccountMenu visible={accountOpen} />
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-zinc-800 bg-zinc-950 lg:flex">
        {sidebarContent}
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/images/Logo2.png" alt="Netflix" width={40} height={40} className="h-9 w-auto" priority />
          <span className="text-sm font-bold text-white">Admin</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-lg border border-zinc-800 p-2 text-zinc-200"
            aria-label={mobileOpen ? t("Close navigation") : t("Open navigation")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/70 pt-16 backdrop-blur-sm lg:hidden">
          <dialog
            ref={drawerRef}
            open
            aria-modal="true"
            aria-label={t("Admin Area")}
            tabIndex={-1}
            className="m-0 flex h-full max-h-none w-[min(88vw,320px)] max-w-none flex-col border-y-0 border-l-0 border-r border-zinc-800 bg-zinc-950 p-0 text-white"
          >
            <button
              ref={drawerCloseRef}
              type="button"
              onClick={closeMobileNavigation}
              className="m-4 self-end rounded-lg p-2 text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
              aria-label={t("Close navigation")}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-zinc-800 p-4">
              <Link
                href="/"
                onClick={closeMobileNavigation}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <Home className="h-4 w-4" aria-hidden="true" /> {t("Back to Netflix")}
              </Link>
            </div>
          </dialog>
        </div>
      )}
    </>
  );
}
