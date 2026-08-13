import { normalizeAuthEmail } from '../contracts';

describe('authentication contract', () => {
  it('normalizes an email identity before any authentication flow uses it', () => {
    expect(normalizeAuthEmail('  Viewer@Example.COM  ')).toBe('viewer@example.com');
  });
});
