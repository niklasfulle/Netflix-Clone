import { createLoginSchema } from '@/schemas';

describe('createLoginSchema', () => {
  it('uses corrected English validation messages by default', () => {
    const result = createLoginSchema().safeParse({ email: '', password: '' });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.flatten().fieldErrors).toMatchObject({
      email: ['Email is required.'],
      password: ['Password is required.'],
    });
  });

  it('accepts localized validation messages', () => {
    const result = createLoginSchema({
      emailRequired: 'E-Mail ist erforderlich.',
      passwordRequired: 'Passwort ist erforderlich.',
      codeRequired: 'Ein sechsstelliger Code ist erforderlich.',
    }).safeParse({ email: '', password: '' });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.flatten().fieldErrors).toMatchObject({
      email: ['E-Mail ist erforderlich.'],
      password: ['Passwort ist erforderlich.'],
    });
  });
});
