'use client';

import { AlertTriangle, Check, Copy, Download, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import useSWR from 'swr';

import { useLanguage } from '@/components/providers/LanguageProvider';
import type { PublicCertificateMetadata } from '@/lib/public-ca';
import type { Locale, TranslationKey } from '@/lib/i18n/translations';

const endpoint = '/api/security/certificates';

async function certificateFetcher(): Promise<{ certificates: PublicCertificateMetadata[] }> {
  const response = await fetch(endpoint, { cache: 'no-store' });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || 'Public CA certificate is unavailable.');
  return body;
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

function CertificateCard({
  certificate,
  onCopy,
  locale,
  t,
}: Readonly<{
  certificate: PublicCertificateMetadata;
  onCopy(certificate: PublicCertificateMetadata): void;
  locale: Locale;
  t(key: TranslationKey): string;
}>) {
  const label = certificate.id === 'current' ? t('Current root') : t('Previous root (rotation overlap)');
  return (
    <article className="min-w-0 max-w-full break-words rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-white">{label}</h3>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
          {certificate.environment.toUpperCase()}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div><dt className="text-zinc-500">{t('Subject')}</dt><dd className="mt-1 break-all text-zinc-300">{certificate.subject}</dd></div>
        <div><dt className="text-zinc-500">{t('Issuer')}</dt><dd className="mt-1 break-all text-zinc-300">{certificate.issuer}</dd></div>
        <div><dt className="text-zinc-500">{t('Serial')}</dt><dd className="mt-1 break-all font-mono text-zinc-300">{certificate.serialNumber}</dd></div>
        <div><dt className="text-zinc-500">{t('Valid through')}</dt><dd className="mt-1 text-zinc-300">{formatDate(certificate.validTo, locale)}</dd></div>
      </dl>
      {certificate.isExpiringSoon ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-amber-300">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {t('Certificate expires within 30 days.')}
        </p>
      ) : null}
      <div className="mt-4 rounded-xl bg-zinc-950/70 p-3">
        <p className="text-xs text-zinc-500">{t('SHA-256 fingerprint')}</p>
        <p className="mt-1 break-all font-mono text-xs text-zinc-200">
          {certificate.fingerprintSha256}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`/api/security/certificates/${certificate.id}?format=pem`}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 text-sm font-medium text-white hover:bg-white/15"
          aria-label={`${t('Download')} ${certificate.id} PEM`}
        >
          <Download className="h-4 w-4" aria-hidden="true" /> PEM
        </a>
        <a
          href={`/api/security/certificates/${certificate.id}?format=der`}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-3 text-sm font-medium text-white hover:bg-white/15"
          aria-label={`${t('Download')} ${certificate.id} CER`}
        >
          <Download className="h-4 w-4" aria-hidden="true" /> CER
        </a>
        <button
          type="button"
          onClick={() => onCopy(certificate)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-zinc-200 hover:bg-white/5"
          aria-label={`${t('Copy')} ${certificate.id} ${t('fingerprint')}`}
        >
          <Copy className="h-4 w-4" aria-hidden="true" /> {t('Copy fingerprint')}
        </button>
      </div>
      {certificate.id === 'current' ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-fit rounded-xl bg-white p-3">
            <QRCodeSVG
              value={certificate.fingerprintSha256}
              size={132}
              level="M"
              title={t('QR code for the current certificate fingerprint')}
            />
          </div>
          <p className="max-w-sm text-xs leading-5 text-zinc-500">
            {t('This QR contains only the public SHA-256 fingerprint. It is not a certificate, session, account identifier, or installation profile.')}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function CertificateTrustPanel() {
  const { locale, t } = useLanguage();
  const { data, error, isLoading } = useSWR(endpoint, certificateFetcher, {
    revalidateOnFocus: false,
  });
  const [copyMessage, setCopyMessage] = useState('');

  const copyFingerprint = async (certificate: PublicCertificateMetadata) => {
    try {
      await navigator.clipboard.writeText(certificate.fingerprintSha256);
      setCopyMessage(certificate.id === 'current'
        ? t('Current fingerprint copied.')
        : t('Previous fingerprint copied.'));
    } catch {
      setCopyMessage(t('Fingerprint could not be copied. Select it manually.'));
    }
  };

  return (
    <section id="https-trust" className="mt-6 min-w-0 max-w-full break-words rounded-3xl border border-white/10 bg-white/[0.045] p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-sky-500/10 p-2.5 text-sky-300">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-white">{t('LAN HTTPS certificate trust')}</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            {t('Download only the public root certificate used by this deployment and verify its fingerprint through a separate trusted channel.')}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {isLoading ? <p className="text-sm text-zinc-500">{t('Loading certificate metadata…')}</p> : null}
        {error ? (
          <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error.message}
          </div>
        ) : null}
        {data?.certificates.map((certificate) => (
          <CertificateCard
            key={certificate.id}
            certificate={certificate}
            onCopy={copyFingerprint}
            locale={locale}
            t={t}
          />
        ))}
        {copyMessage ? (
          <output className="flex items-center gap-2 text-sm text-emerald-300">
            <Check className="h-4 w-4" aria-hidden="true" /> {copyMessage}
          </output>
        ) : null}
      </div>

      <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm leading-6 text-amber-100/80">
        {t('A fingerprint shown over a connection your device does not yet trust is not proof by itself. Compare it with an administrator through a separate trusted channel. The first trusted device may need the certificate transferred offline.')}
      </div>

      <div className="mt-6 space-y-2">
        <h3 className="font-semibold text-white">{t('Installation and removal')}</h3>
        {([
          ['Windows', t('Import the CER into Trusted Root Certification Authorities for the current user or managed device, then remove it from the same store when retired.')],
          ['macOS', t('Add the PEM to Keychain Access, set explicit trust for SSL, and remove the root from the login or system keychain when retired.')],
          ['iOS / iPadOS', t('Transfer the certificate through a trusted channel, install the profile, then explicitly enable full trust under Certificate Trust Settings.')],
          ['Android', t('Install the CA certificate for Wi-Fi and apps that honor user roots. Some applications ignore user-installed roots. Remove it under trusted credentials.')],
          ['Linux', t('Copy the PEM into the distribution trust-anchor directory and run the distribution CA update command. Remove the file and update the store to uninstall.')],
        ] as const).map(([platform, instructions]) => (
          <details key={platform} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <summary className="cursor-pointer font-medium text-zinc-200">{platform}</summary>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{instructions}</p>
          </details>
        ))}
      </div>

      <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm leading-6 text-red-100/75">
        {t('webOS does not support this private-root installation path. LG TVs require a certificate chaining to a root already trusted by the device unless a separately verified management mechanism exists. A real domain can still resolve only through internal DNS without exposing this application publicly.')}
      </p>
    </section>
  );
}
