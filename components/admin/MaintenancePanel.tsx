"use client";

import { useEffect, useState } from 'react';

export default function MaintenancePanel() {
  const [heading, setHeading] = useState('');
  const [message, setMessage] = useState('');
  const [bannerEnabled, setBanner] = useState(false);
  const [loginLocked, setLocked] = useState(false);
  const [expiresAt, setExpiry] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    let active = true;
    fetch('/api/admin/maintenance', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('Einstellungen konnten nicht geladen werden.');
      const data = await response.json();
      if (!active) return;
      setHeading(data.heading ?? ''); setMessage(data.message); setBanner(data.bannerEnabled); setLocked(data.loginLocked);
      if (data.expiresAt) { const date = new Date(data.expiresAt); setExpiry(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)); }
    }).catch(() => { if (active) setFeedback('Einstellungen konnten nicht geladen werden. Bitte lade die Seite erneut.'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setFeedback('');
    try {
      const response = await fetch('/api/admin/maintenance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ heading, message, bannerEnabled, loginLocked, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Speichern fehlgeschlagen.');
      setFeedback('Gespeichert. Geöffnete Seiten übernehmen den Status innerhalb von etwa 5 Sekunden.');
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Speichern fehlgeschlagen.'); }
    finally { setBusy(false); }
  }
  return <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-white">
    <h2 className="font-semibold">Wartung und Ankündigungen</h2>
    <p className="mt-2 text-sm text-zinc-400">Ein Hinweis für alle Seiten, mit automatischer Endzeit. Admins behalten auch während einer Login-Sperre Zugriff.</p>
    <form onSubmit={save} className="mt-5 space-y-4">
      <label className="flex items-center gap-3"><input type="checkbox" checked={bannerEnabled} onChange={event => setBanner(event.target.checked)} disabled={busy} />Banner aktivieren</label>
      <label className="block text-sm">Banner-Überschrift<input type="text" value={heading} maxLength={120} onChange={event => setHeading(event.target.value)} disabled={busy} placeholder="Ankündigung" className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3" /></label>
      <label className="block text-sm">Bannertext<textarea value={message} maxLength={500} onChange={event => setMessage(event.target.value)} disabled={busy} className="mt-2 min-h-24 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3" /></label>
      <label className="block text-sm">Endzeit (deine lokale Zeitzone)<input type="datetime-local" value={expiresAt} onChange={event => setExpiry(event.target.value)} required={bannerEnabled || loginLocked} disabled={busy} className="mt-2 block rounded-lg border border-zinc-700 bg-zinc-950 p-3" /></label>
      <label className="flex items-start gap-3"><input type="checkbox" checked={loginLocked} onChange={event => setLocked(event.target.checked)} disabled={busy} className="mt-1" /><span>Nicht-Admin-Logins sperren und alle Nicht-Admin-Sitzungen abmelden</span></label>
      <p className="text-sm text-amber-200">Beim Speichern mit aktiver Sperre werden bestehende Nicht-Admin-Sitzungen dauerhaft ungültig. Nach der Endzeit müssen sich diese Nutzer erneut anmelden. Nicht gespeicherte Eingaben können verloren gehen; kündige die Wartung deshalb zuerst nur per Banner an.</p>
      <button type="submit" disabled={busy} className="rounded-lg bg-red-600 px-4 py-2 font-semibold disabled:opacity-50">{busy ? 'Bitte warten …' : 'Wartungseinstellungen speichern'}</button>
      <p role="status" className="text-sm text-zinc-300">{feedback}</p>
    </form>
  </section>;
}
