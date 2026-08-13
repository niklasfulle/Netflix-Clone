import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('RegisterForm contract', () => {
  const source = readFileSync(join(__dirname, '..', 'register-form.tsx'), 'utf8');

  it('uses localized registration validation including password confirmation', () => {
    expect(source).toContain('createRegisterSchema');
    expect(source).toContain('zodResolver(localizedRegisterSchema)');
    expect(source).toContain("passwordsMismatch: t(\"Passwords don't match.\")");
  });

  it.each([
    ['name', 'name'],
    ['email', 'email'],
    ['password', 'new-password'],
    ['confirm', 'new-password'],
  ])('configures the %s field with %s autocomplete', (field, autocomplete) => {
    expect(source).toMatch(
      new RegExp(`name="${field}"[\\s\\S]*?autoComplete="${autocomplete}"`),
    );
  });

  it('uses localized navigation and pending feedback', () => {
    expect(source).toContain("headerLabel={t('Create an Account')}");
    expect(source).toContain("backButtonLabel={t('Already have an account?')}");
    expect(source).toContain('backButtonHref="/auth/login"');
    expect(source).toContain("t('Creating account…')");
  });

  it('renders shared inputs and status messages', () => {
    expect(source.match(/<AuthInput/g)).toHaveLength(2);
    expect(source.match(/<AuthPasswordInput/g)).toHaveLength(2);
    expect(source).toContain('<PasswordChecklist');
    expect(source).toContain('<FormError message={error} />');
    expect(source).toContain('<AuthEmailSent');
    expect(source).toContain('setSubmittedEmail');
  });
});
