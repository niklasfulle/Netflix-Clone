import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('favicon route', () => {
  it('provides the conventional favicon.ico endpoint for browsers', () => {
    expect(existsSync(join(process.cwd(), 'app', 'favicon.ico'))).toBe(true);
  });
});
