export type AuthMailLocale = 'de' | 'en';

export interface AuthMailEnvelope {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface AuthMailTransport {
  send(message: AuthMailEnvelope): Promise<void>;
}

export interface AuthMailConfig {
  sender: string;
  publicBaseUrl: URL;
  locale: AuthMailLocale;
}

export interface AuthSmtpConfig extends AuthMailConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
}

type TokenMessage = { email: string; token: string };
type SecurityMessage = { email: string; event: string };

const templates = {
  de: {
    verificationSubject: 'E-Mail-Adresse bestätigen',
    verificationText: (link: string) => `Bestätige deine E-Mail-Adresse: ${link}`,
    verificationHtml: (link: string) => `<p>Bestätige deine E-Mail-Adresse: <a href="${link}">E-Mail bestätigen</a></p>`,
    resetSubject: 'Passwort zurücksetzen',
    resetText: (link: string) => `Setze dein Passwort zurück: ${link}`,
    resetHtml: (link: string) => `<p>Setze dein Passwort zurück: <a href="${link}">Passwort zurücksetzen</a></p>`,
    twoFactorSubject: 'Dein Anmeldecode',
    twoFactorText: (token: string) => `Dein einmaliger Anmeldecode lautet: ${token}`,
    twoFactorHtml: (token: string) => `<p>Dein einmaliger Anmeldecode lautet: <strong>${token}</strong></p>`,
    securitySubject: 'Sicherheitsmitteilung',
    securityText: (event: string) => `Sicherheitsereignis für dein Konto: ${event}`,
    securityHtml: (event: string) => `<p>Sicherheitsereignis für dein Konto: ${event}</p>`,
  },
  en: {
    verificationSubject: 'Confirm your email address',
    verificationText: (link: string) => `Confirm your email address: ${link}`,
    verificationHtml: (link: string) => `<p>Confirm your email address: <a href="${link}">Confirm email</a></p>`,
    resetSubject: 'Reset your password',
    resetText: (link: string) => `Reset your password: ${link}`,
    resetHtml: (link: string) => `<p>Reset your password: <a href="${link}">Reset password</a></p>`,
    twoFactorSubject: 'Your sign-in code',
    twoFactorText: (token: string) => `Your one-time sign-in code is: ${token}`,
    twoFactorHtml: (token: string) => `<p>Your one-time sign-in code is: <strong>${token}</strong></p>`,
    securitySubject: 'Security notification',
    securityText: (event: string) => `Security event for your account: ${event}`,
    securityHtml: (event: string) => `<p>Security event for your account: ${event}</p>`,
  },
} as const;

function requireValue(environment: Record<string, string | undefined>, key: string): string {
  const value = environment[key]?.trim();
  if (!value) throw new Error(`Missing authentication mail configuration: ${key}`);
  return value;
}

function readBoolean(value: string, key: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Invalid authentication mail configuration: ${key}`);
}

export function readAuthMailConfig(
  environment: Record<string, string | undefined> = process.env,
): AuthSmtpConfig {
  const publicBaseUrl = new URL(requireValue(environment, 'AUTH_PUBLIC_URL'));
  if (!['http:', 'https:'].includes(publicBaseUrl.protocol)) {
    throw new Error('Invalid authentication mail configuration: AUTH_PUBLIC_URL');
  }
  const port = Number(requireValue(environment, 'AUTH_MAIL_PORT'));
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('Invalid authentication mail configuration: AUTH_MAIL_PORT');
  }
  const localeValue = environment.AUTH_MAIL_LOCALE?.trim() || 'en';
  if (localeValue !== 'de' && localeValue !== 'en') {
    throw new Error('Invalid authentication mail configuration: AUTH_MAIL_LOCALE');
  }
  const user = environment.AUTH_MAIL_USER?.trim() || undefined;
  const password = environment.AUTH_MAIL_PASSWORD || undefined;
  if (Boolean(user) !== Boolean(password)) {
    throw new Error('Invalid authentication mail configuration: SMTP credentials');
  }

  return {
    publicBaseUrl,
    host: requireValue(environment, 'AUTH_MAIL_HOST'),
    port,
    secure: readBoolean(requireValue(environment, 'AUTH_MAIL_SECURE'), 'AUTH_MAIL_SECURE'),
    user,
    password,
    sender: requireValue(environment, 'AUTH_MAIL_FROM'),
    locale: localeValue,
  };
}

function createTokenLink(baseUrl: URL, path: string, token: string): string {
  const url = new URL(path, baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function createAuthMailer(config: AuthMailConfig, transport: AuthMailTransport) {
  const template = templates[config.locale];
  const deliver = (message: Omit<AuthMailEnvelope, 'from'>) => transport.send({
    from: config.sender,
    ...message,
  });

  return {
    sendVerification: ({ email, token }: TokenMessage) => {
      const link = createTokenLink(config.publicBaseUrl, '/auth/new-verification', token);
      return deliver({
        to: email,
        subject: template.verificationSubject,
        text: template.verificationText(link),
        html: template.verificationHtml(escapeHtml(link)),
      });
    },
    sendPasswordReset: ({ email, token }: TokenMessage) => {
      const link = createTokenLink(config.publicBaseUrl, '/auth/new-password', token);
      return deliver({
        to: email,
        subject: template.resetSubject,
        text: template.resetText(link),
        html: template.resetHtml(escapeHtml(link)),
      });
    },
    sendTwoFactor: ({ email, token }: TokenMessage) => deliver({
      to: email,
      subject: template.twoFactorSubject,
      text: template.twoFactorText(token),
      html: template.twoFactorHtml(escapeHtml(token)),
    }),
    sendSecurityNotice: ({ email, event }: SecurityMessage) => deliver({
      to: email,
      subject: template.securitySubject,
      text: template.securityText(event),
      html: template.securityHtml(escapeHtml(event)),
    }),
  };
}
