"use client";

import { Download, Eye, Lock, Search, Shield, ShieldCheck, Unlock, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import useCurrentUser from "@/hooks/useCurrentUser";

type Profile = { id: string; name: string; image?: string; inUse: boolean; createdAt: string };
type ManagedUser = {
  id: string;
  name: string;
  email?: string;
  image?: string;
  role: "ADMIN" | "USER";
  isBlocked: boolean;
  blockedAt?: string;
  blockedUntil?: string;
  blockedReason?: string;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  profiles: Profile[];
};

const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Benutzer konnten nicht geladen werden.");
  return data;
});

export default function AdminUsersPage() {
  const { user: currentUser } = useCurrentUser();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [twoFactor, setTwoFactor] = useState("all");
  const [sort, setSort] = useState("createdAt");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailUser, setDetailUser] = useState<ManagedUser | null>(null);
  const [blockUser, setBlockUser] = useState<ManagedUser | null>(null);
  const [reason, setReason] = useState("");
  const [blockedUntil, setBlockedUntil] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const params = useMemo(() => new URLSearchParams({
    page: String(page), pageSize: String(pageSize), search, role, status, twoFactor, sort, direction,
  }).toString(), [page, pageSize, search, role, status, twoFactor, sort, direction]);
  const { data, error, isLoading, mutate } = useSWR(`/api/admin/users?${params}`, fetcher, { keepPreviousData: true });

  const toggleBlock = async (user: ManagedUser, block: boolean, options?: { reason: string; blockedUntil: string }) => {
    const response = await fetch("/api/admin/users/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, block, ...options }),
    });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error);
    setBlockUser(null); setReason(""); setBlockedUntil("");
    setMessage(block ? "Benutzer wurde gesperrt." : "Benutzer wurde entsperrt.");
    await mutate();
  };

  const changeRole = async (user: ManagedUser, nextRole: "ADMIN" | "USER") => {
    if (!globalThis.confirm(`${user.name} wirklich die Rolle ${nextRole} zuweisen?`)) return;
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role: nextRole }),
    });
    const result = await response.json();
    setMessage(response.ok ? "Rolle wurde aktualisiert." : result.error);
    if (response.ok) await mutate();
  };

  const exportCsv = () => {
    const rows = [["Name", "E-Mail", "Rolle", "Status", "2FA", "Registriert"], ...(data?.users || []).map((user: ManagedUser) => [
      user.name, user.email || "", user.role, user.isBlocked ? "Gesperrt" : "Aktiv", user.isTwoFactorEnabled ? "Ja" : "Nein", user.createdAt,
    ])];
    const csv = rows.map((row: string[]) => row.map((value: string) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "benutzer.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <AdminPageHeader
        title="Benutzer"
        description="Konten, Profile, Sicherheitsstatus und Berechtigungen zentral verwalten."
        actions={<button type="button" onClick={exportCsv} disabled={!data?.users?.length} className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"><Download className="h-4 w-4" /> CSV exportieren</button>}
      />

      {data?.counts && (
        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <AdminMetricCard label="Aktive Konten" value={data.counts.active} icon={ShieldCheck} tone="green" />
          <AdminMetricCard label="Gesperrte Konten" value={data.counts.blocked} icon={Lock} tone="amber" />
          <AdminMetricCard label="Administratoren" value={data.counts.admins} icon={Shield} tone="red" />
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <div className="grid gap-3 border-b border-zinc-800 p-4 lg:grid-cols-[minmax(260px,1fr)_repeat(4,minmax(130px,auto))]">
          <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" /><span className="sr-only">Benutzer suchen</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Name oder E-Mail suchen …" className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-9 pr-3 text-sm text-white outline-none focus:border-red-500" /></label>
          <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"><option value="all">Alle Rollen</option><option value="ADMIN">Admins</option><option value="USER">Benutzer</option></select>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"><option value="all">Alle Status</option><option value="active">Aktiv</option><option value="blocked">Gesperrt</option></select>
          <select value={twoFactor} onChange={(event) => { setTwoFactor(event.target.value); setPage(1); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"><option value="all">2FA beliebig</option><option value="enabled">2FA aktiv</option><option value="disabled">2FA inaktiv</option></select>
          <select value={`${sort}:${direction}`} onChange={(event) => { const [key, dir] = event.target.value.split(":"); setSort(key); setDirection(dir as "asc" | "desc"); }} className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200"><option value="createdAt:desc">Neueste zuerst</option><option value="createdAt:asc">Älteste zuerst</option><option value="name:asc">Name A–Z</option><option value="name:desc">Name Z–A</option></select>
        </div>
        {message && <output className={`block border-b border-zinc-800 px-4 py-3 text-sm ${message.includes("wurde") ? "text-emerald-400" : "text-red-400"}`}>{message}</output>}
        {error && <p role="alert" className="p-5 text-red-400">{error.message}</p>}
        {isLoading && <div className="h-80 animate-pulse bg-zinc-900" aria-label="Benutzer werden geladen" />}
        {data && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-950/70 text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-5 py-3">Benutzer</th><th className="px-3 py-3">Rolle</th><th className="px-3 py-3">Profile</th><th className="px-3 py-3">2FA</th><th className="px-3 py-3">Registriert</th><th className="px-3 py-3">Status</th><th className="px-5 py-3 text-right">Aktionen</th></tr></thead>
                <tbody className="divide-y divide-zinc-800">
                  {data.users.length === 0 && <tr><td colSpan={7} className="p-14 text-center text-zinc-500">Keine Benutzer gefunden.</td></tr>}
                  {data.users.map((user: ManagedUser) => (
                    <tr key={user.id} className="hover:bg-zinc-800/50">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-zinc-800 font-bold text-zinc-300">{user.name?.slice(0, 1).toUpperCase()}</div><div><p className="font-semibold text-white">{user.name}</p><p className="text-xs text-zinc-500">{user.email || "Keine E-Mail"}</p></div></div></td>
                      <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.role === "ADMIN" ? "bg-red-500/10 text-red-300" : "bg-zinc-800 text-zinc-300"}`}>{user.role === "ADMIN" ? "Admin" : "Benutzer"}</span></td>
                      <td className="px-3 py-4 text-zinc-300">{user.profiles.length}</td>
                      <td className="px-3 py-4 text-zinc-300">{user.isTwoFactorEnabled ? "Aktiv" : "Inaktiv"}</td>
                      <td className="px-3 py-4 text-zinc-400">{new Date(user.createdAt).toLocaleDateString("de-DE")}</td>
                      <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.isBlocked ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"}`}>{user.isBlocked ? "Gesperrt" : "Aktiv"}</span></td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-1">
                        <button type="button" onClick={() => setDetailUser(user)} aria-label={`${user.name} anzeigen`} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-700 hover:text-white"><Eye className="h-4 w-4" /></button>
                        {currentUser?.id !== user.id && (user.isBlocked
                          ? <button type="button" onClick={() => toggleBlock(user, false)} aria-label={`${user.name} entsperren`} className="rounded-lg p-2 text-emerald-500 hover:bg-emerald-500/10"><Unlock className="h-4 w-4" /></button>
                          : <button type="button" onClick={() => setBlockUser(user)} aria-label={`${user.name} sperren`} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Lock className="h-4 w-4" /></button>)}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination page={page} totalPages={data.totalPages} total={data.total} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
          </>
        )}
      </section>

      {detailUser && (
        <dialog
          open
          aria-modal="true"
          aria-label={`Benutzerdetails ${detailUser.name}`}
          className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none justify-end border-0 bg-black/70 p-0 text-inherit"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailUser(null);
          }}
        >
          <aside className="h-full w-full max-w-lg overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-6">
            <div className="flex justify-between"><div><p className="text-xs uppercase tracking-widest text-red-400">Benutzerkonto</p><h2 className="mt-2 text-2xl font-bold">{detailUser.name}</h2><p className="text-sm text-zinc-500">{detailUser.email}</p></div><button type="button" onClick={() => setDetailUser(null)} aria-label="Details schließen" className="p-2 text-zinc-500"><X className="h-5 w-5" /></button></div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-zinc-800 p-3"><p className="text-zinc-500">Rolle</p><p className="mt-1 font-semibold">{detailUser.role}</p></div>
              <div className="rounded-xl border border-zinc-800 p-3"><p className="text-zinc-500">Zwei-Faktor</p><p className="mt-1 font-semibold">{detailUser.isTwoFactorEnabled ? "Aktiv" : "Inaktiv"}</p></div>
            </div>
            {detailUser.blockedReason && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4"><p className="text-xs text-red-400">Sperrgrund</p><p className="mt-1 text-sm text-zinc-300">{detailUser.blockedReason}</p>{detailUser.blockedUntil && <p className="mt-2 text-xs text-zinc-500">Bis {new Date(detailUser.blockedUntil).toLocaleString("de-DE")}</p>}</div>}
            <h3 className="mt-8 font-semibold">Profile</h3>
            <div className="mt-3 space-y-2">{detailUser.profiles.length === 0 && <p className="text-sm text-zinc-500">Keine Profile vorhanden.</p>}{detailUser.profiles.map((profile) => <div key={profile.id} className="flex items-center justify-between rounded-xl border border-zinc-800 p-3"><span className="text-sm text-zinc-200">{profile.name}</span>{profile.inUse && <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">Aktiv</span>}</div>)}</div>
            {currentUser?.id !== detailUser.id && <div className="mt-8"><p className="mb-2 text-sm font-medium text-zinc-300">Rolle ändern</p><div className="flex gap-2"><button type="button" onClick={() => changeRole(detailUser, "USER")} disabled={detailUser.role === "USER"} className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm disabled:opacity-40">Benutzer</button><button type="button" onClick={() => changeRole(detailUser, "ADMIN")} disabled={detailUser.role === "ADMIN"} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold disabled:opacity-40">Administrator</button></div></div>}
          </aside>
        </dialog>
      )}

      {blockUser && (
        <dialog open className="fixed inset-0 z-50 m-0 grid h-full max-h-none w-full max-w-none place-items-center border-0 bg-black/75 p-4 text-inherit" aria-modal="true" aria-label="Benutzer sperren">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex justify-between"><div><p className="text-xs uppercase tracking-widest text-red-400">Konto sperren</p><h2 className="mt-2 text-xl font-bold">{blockUser.name}</h2></div><button type="button" onClick={() => setBlockUser(null)} aria-label="Dialog schließen" className="p-2 text-zinc-500"><X className="h-5 w-5" /></button></div>
            <label className="mt-5 block text-sm text-zinc-300">Sperrgrund<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-white outline-none focus:border-red-500" placeholder="Grund für die Sperre …" /></label>
            <label className="mt-4 block text-sm text-zinc-300">Optionales Ablaufdatum<input type="datetime-local" value={blockedUntil} onChange={(event) => setBlockedUntil(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-white" /></label>
            <button type="button" onClick={() => toggleBlock(blockUser, true, { reason, blockedUntil })} className="mt-5 w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white">Konto sperren</button>
          </div>
        </dialog>
      )}
    </div>
  );
}
