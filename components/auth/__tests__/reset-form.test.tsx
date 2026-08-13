import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('ResetForm contract', () => {
  const source = readFileSync(join(__dirname, '..', 'reset-form.tsx'), 'utf8');

  it('uses localized reset validation and an email-specific input', () => {
    expect(source).toContain('createResetPasswordSchema');
    expect(source).toContain('zodResolver(localizedResetSchema)');
    expect(source).toContain('type="email"');
    expect(source).toContain('autoComplete="email"');
    expect(source).toContain('inputMode="email"');
  });

  it('uses the shared auth design and localized navigation', () => {
    expect(source).toContain('<CardWrapper');
    expect(source).toContain('<AuthInput');
    expect(source).toContain("headerLabel={t('Forgot your password?')}");
    expect(source).toContain('backButtonHref="/auth/login"');
  });

  it('shows pending and result feedback', () => {
    expect(source).toContain("t('Sending email…')");
    expect(source).toContain('<FormError message={error} />');
    expect(source).toContain('<AuthEmailSent');
    expect(source).toContain('setSubmittedEmail');
    expect(source).toContain('disabled={isPending}');
  });
});
