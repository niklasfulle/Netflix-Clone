import { NewPasswordSchema, RegisterSchema, SettingsSchema } from '@/schemas';

const strongPassword = 'correct horse battery staple';

describe('shared password policy', () => {
  it('requires at least 12 characters for registration', () => {
    expect(RegisterSchema.safeParse({
      name: 'Viewer',
      email: 'viewer@example.com',
      password: 'short123',
      confirm: 'short123',
    }).success).toBe(false);
    expect(RegisterSchema.safeParse({
      name: 'Viewer',
      email: 'viewer@example.com',
      password: strongPassword,
      confirm: strongPassword,
    }).success).toBe(true);
  });

  it('requires confirmation when choosing a reset password', () => {
    expect(NewPasswordSchema.safeParse({
      password: strongPassword,
      confirm: 'different password',
    }).success).toBe(false);
    expect(NewPasswordSchema.safeParse({
      password: strongPassword,
      confirm: strongPassword,
    }).success).toBe(true);
  });

  it('uses the same policy for a new settings password without rejecting a legacy current password', () => {
    expect(SettingsSchema.safeParse({
      name: 'Viewer',
      password: 'legacy',
      newPassword: 'short123',
    }).success).toBe(false);
    expect(SettingsSchema.safeParse({
      name: 'Viewer',
      password: 'legacy',
      newPassword: strongPassword,
      confirmNewPassword: strongPassword,
    }).success).toBe(true);
  });

  it('requires matching confirmation for a new settings password', () => {
    expect(SettingsSchema.safeParse({
      name: 'Viewer',
      password: 'legacy',
      newPassword: strongPassword,
      confirmNewPassword: 'different password',
    }).success).toBe(false);
  });
});
