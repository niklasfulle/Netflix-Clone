"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { signOut } from 'next-auth/react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function MaintenanceNotice() {
  const [mode, setMode] = useState<'announce' | 'update' | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [customHeading, setCustomHeading] = useState('');
  const banner = useRef<HTMLDivElement>(null);
  const { locale } = useLanguage();

  useEffect(() => {
    let active = true;
    let checking = false;
    let signingOut = false;
    async function check() {
      if (checking || document.visibilityState === 'hidden') return;
      checking = true;
      try {
        const response = await fetch('/api/maintenance', { cache: 'no-store', signal: AbortSignal.timeout(4000) });
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;
        setCustomHeading(typeof data.heading === 'string' ? data.heading : '');
        setCustomMessage(data.message || (data.loginLocked ? (locale === 'de' ? 'Wartungsarbeiten: Anmeldung derzeit nur für Admins möglich.' : 'Maintenance: sign-in is currently available to admins only.') : ''));
        if (data.logoutRequired && !signingOut) {
          signingOut = true;
          try { await signOut({ callbackUrl: '/auth/login?maintenance=1' }); }
          catch { signingOut = false; }
        }
      } catch { /* Retry on the next interval. */ }
      finally { checking = false; }
    }
    void check();
    const interval = setInterval(check, 5000);
    const visible = () => { void check(); };
    document.addEventListener('visibilitychange', visible);
    return () => { active = false; clearInterval(interval); document.removeEventListener('visibilitychange', visible); };
  }, [locale]);

  useEffect(() => {
    let active = true;
    let checking = false;
    const controller = new AbortController();
    async function check() {
      if (checking || document.visibilityState === 'hidden') return;
      checking = true;
      try {
        const response = await fetch('/__maintenance', { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(4000)]) });
        if (!response.ok) return;
        const data = await response.json();
        const modified = Date.parse(response.headers.get('Last-Modified') || '');
        if (active) setMode(Number.isFinite(modified) && Date.now() - modified < 7200000
          && (data.mode === 'announce' || data.mode === 'update') ? data.mode : null);
      } catch { /* Keep the current notice during temporary network failures. */ }
      finally { checking = false; }
    }
    const onVisibility = () => { void check(); };
    void check();
    const interval = setInterval(check, 5000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { active = false; controller.abort(); clearInterval(interval); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  useEffect(() => {
    if (!mode && !customMessage) return;
    globalThis.dispatchEvent(new Event('netflix:maintenance'));
    const show = () => { banner.current?.hidePopover?.(); banner.current?.showPopover?.(); };
    const onDialog = (event: Event) => { if ((event.target as Element)?.tagName === 'DIALOG') show(); };
    show();
    document.addEventListener('fullscreenchange', show);
    document.addEventListener('toggle', onDialog, true);
    return () => { document.removeEventListener('fullscreenchange', show); document.removeEventListener('toggle', onDialog, true); };
  }, [mode, customMessage]);
  if (!mode && !customMessage) return null;
  const german = locale === 'de';
  const title = mode === 'announce'
    ? (german ? 'Ein Update wird vorbereitet' : 'An update is being prepared')
    : (german ? 'Das Update wird jetzt installiert' : 'The update is being installed');
  const description = german
    ? (mode === 'announce' ? 'Bitte speichere offene Änderungen. Die Anwendung wird in Kürze neu gestartet.' : 'Speichern ist vorübergehend nicht möglich. Bitte lasse diese Seite mit offenen Änderungen geöffnet.')
    : (mode === 'announce' ? 'Please save your changes. The application will restart shortly.' : 'Saving is temporarily unavailable. Please keep this page open if you have unsaved changes.');
  return createPortal(
    <div ref={banner} popover="manual" role="status" aria-live="polite" className="fixed inset-x-0 top-0 bottom-auto z-[2147483647] m-0 block w-full border-0 border-b border-amber-400/40 bg-zinc-950/95 px-4 py-3 text-center text-white shadow-lg backdrop-blur">
      <strong className="block text-sm text-amber-300">{mode ? title : (customHeading || (german ? 'Ankündigung' : 'Announcement'))}</strong>
      <span className="block text-sm">{mode ? description : customMessage}</span>
    </div>, document.body,
  );
}
