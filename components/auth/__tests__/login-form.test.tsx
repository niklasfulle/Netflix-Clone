import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('LoginForm contract', () => {
  const source = readFileSync(join(__dirname, '..', 'login-form.tsx'), 'utf8');

  it('uses localized validation and accessible input metadata', () => {
    expect(source).toContain('createLoginSchema');
    expect(source).toContain('zodResolver(localizedLoginSchema)');
    expect(source).toContain('autoComplete="email"');
    expect(source).toContain('autoComplete="current-password"');
    expect(source).toContain('<MfaChallenge');
  });

  it('supports password reset and the two-factor challenge', () => {
    expect(source).toContain('href="/auth/reset"');
    expect(source).toContain('setChallenge(result)');
    expect(source).toContain("challengeMethod: 'email_otp'");
    expect(source).toContain('onResendEmail={requestEmailChallenge}');
  });

  it('navigates when credential sign-in succeeds without an Auth.js redirect response', () => {
    expect(source).toContain('useRouter');
    expect(source).toContain("result.status === 'success' && result.code === 'signed_in'");
    expect(source).toContain('router.replace(DEFAULT_LOGIN_REDIRECT)');
    expect(source).toContain('router.refresh()');
    expect(source).toContain('if (!isRedirectError(caught))');
  });

  it('reports pending, success, and error states through shared components', () => {
    expect(source).toContain("isPending ? t('Signing in…') : t('Login')");
    expect(source).toContain('<FormError message={error ?? urlError} />');
    expect(source).toContain('<FormSuccess message={success} />');
    expect(source).toContain('disabled={isPending}');
  });

  it('uses the shared responsive auth surface', () => {
    expect(source).toContain('<CardWrapper');
    expect(source).toContain('<AuthInput');
    expect(source).toContain("headerLabel={t('Welcome back')}");
    expect(source).toContain('backButtonHref="/auth/register"');
    expect(source).toContain('<PasskeyLogin />');
  });
});
