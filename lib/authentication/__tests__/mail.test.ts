import {
  createAuthMailer,
  readAuthMailConfig,
  type AuthMailEnvelope,
} from '../mail';

describe('authentication mail module', () => {
  it('delivers a bilingual-capable verification message through the mail port', async () => {
    const delivered: AuthMailEnvelope[] = [];
    const mailer = createAuthMailer({
      sender: 'Netflix Clone <auth@example.com>',
      publicBaseUrl: new URL('https://netflix.example.com'),
      locale: 'de',
    }, {
      send: async (message) => {
        delivered.push(message);
      },
    });

    await mailer.sendVerification({
      email: 'viewer@example.com',
      token: 'verification-token',
    });

    expect(delivered).toEqual([expect.objectContaining({
      from: 'Netflix Clone <auth@example.com>',
      to: 'viewer@example.com',
      subject: 'E-Mail-Adresse bestätigen',
    })]);
    expect(delivered[0]?.text).toContain(
      'https://netflix.example.com/auth/new-verification?token=verification-token',
    );
  });

  it('validates SMTP and public URL configuration without exposing credentials', () => {
    expect(readAuthMailConfig({
      AUTH_PUBLIC_URL: 'https://netflix.example.com',
      AUTH_MAIL_HOST: 'smtp.example.com',
      AUTH_MAIL_PORT: '587',
      AUTH_MAIL_SECURE: 'false',
      AUTH_MAIL_USER: 'mailer',
      AUTH_MAIL_PASSWORD: 'password',
      AUTH_MAIL_FROM: 'auth@example.com',
      AUTH_MAIL_LOCALE: 'en',
    })).toEqual({
      publicBaseUrl: new URL('https://netflix.example.com'),
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: 'mailer',
      password: 'password',
      sender: 'auth@example.com',
      locale: 'en',
    });
  });
});
