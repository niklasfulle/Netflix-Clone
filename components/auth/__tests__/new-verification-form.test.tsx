import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('NewVerificationForm contract', () => {
  const source = readFileSync(join(__dirname, '..', 'new-verification-form.tsx'), 'utf8');

  it('automatically verifies the token and handles missing links', () => {
    expect(source).toContain('searchParams.get("token")');
    expect(source).toContain('newVerification(token)');
    expect(source).toContain("setError(t('Missing token!'))");
    expect(source).toContain('useEffect(() =>');
    expect(source).toContain('onSubmit();');
  });

  it('uses an accessible, reduced-motion loading status', () => {
    expect(source).toContain('<output');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('motion-reduce:animate-none');
    expect(source).toContain("t('Checking link…')");
  });

  it('renders localized outcomes and login navigation', () => {
    expect(source).toContain('<FormSuccess message={success} />');
    expect(source).toContain('<FormError message={error} />');
    expect(source).toContain('backButtonHref="/auth/login"');
    expect(source).toContain("backButtonLabel={t('Back to login')}");
  });
});
