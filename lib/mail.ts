import nodemailer from 'nodemailer';

import {
  createAuthMailer,
  readAuthMailConfig,
  type AuthMailEnvelope,
  type AuthMailTransport,
} from '@/lib/authentication/mail';

type AuthMailer = ReturnType<typeof createAuthMailer>;

let cachedMailer: AuthMailer | undefined;

function createSmtpTransport(): { mailer: AuthMailer } {
  const config = readAuthMailConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    ...(config.user && config.password
      ? { auth: { user: config.user, pass: config.password } }
      : {}),
  });
  const transport: AuthMailTransport = {
    send: async (message: AuthMailEnvelope) => {
      await transporter.sendMail(message);
    },
  };
  return { mailer: createAuthMailer(config, transport) };
}

function getAuthMailer(): AuthMailer {
  cachedMailer ??= createSmtpTransport().mailer;
  return cachedMailer;
}

export const sendVerificationEmail = async (email: string, token: string) =>
  getAuthMailer().sendVerification({ email, token });

export const sendResetPasswordEmail = async (email: string, token: string) =>
  getAuthMailer().sendPasswordReset({ email, token });

export const sendTwoFactorEmail = async (email: string, token: string) =>
  getAuthMailer().sendTwoFactor({ email, token });

export const sendSecurityNotificationEmail = async (email: string, event: string) =>
  getAuthMailer().sendSecurityNotice({ email, event });
