import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const publicAuthForms = [
  'login-form.tsx',
  'register-form.tsx',
  'reset-form.tsx',
  'new-password-form.tsx',
];

describe.each(publicAuthForms)('%s pre-hydration protection', (fileName) => {
  const source = readFileSync(join(__dirname, '..', fileName), 'utf8');

  it('never falls back to a native GET submission with authentication fields', () => {
    expect(source).toContain('method="post"');
  });

  it('keeps controls disabled until the client submit handler is ready', () => {
    expect(source).toContain('useAuthFormReady()');
    expect(source).toContain('disabled={!formReady || isPending}');
  });
});
