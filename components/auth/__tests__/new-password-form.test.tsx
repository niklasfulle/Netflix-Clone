import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('NewPasswordForm contract', () => {
  const source = readFileSync(join(__dirname, '..', 'new-password-form.tsx'), 'utf8');

  it('uses token-based submission and localized password validation', () => {
    expect(source).toContain('searchParams.get("token")');
    expect(source).toContain('setNewPassword(values, token)');
    expect(source).toContain('createNewPasswordSchema');
    expect(source).toContain('zodResolver(localizedPasswordSchema)');
  });

  it('configures the password manager metadata', () => {
    expect(source).toContain('autoComplete="new-password"');
    expect(source).toContain('<AuthPasswordInput');
    expect(source).toContain('<PasswordChecklist');
  });

  it('provides localized pending, success, error, and back states', () => {
    expect(source).toContain("t('Saving password…')");
    expect(source).toContain('<FormError message={error} />');
    expect(source).toContain('<FormSuccess message={success} />');
    expect(source).toContain('backButtonHref="/auth/login"');
  });
});
