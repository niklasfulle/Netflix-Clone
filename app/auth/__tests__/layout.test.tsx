import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('AuthLayout', () => {
  const source = readFileSync(join(__dirname, '..', 'layout.tsx'), 'utf8');

  it('uses a responsive viewport-height layout with a mobile-safe content width', () => {
    expect(source).toContain('min-h-dvh');
    expect(source).toContain('w-full max-w-7xl');
    expect(source).toContain('lg:grid-cols-');
    expect(source).not.toContain('w-[400px]');
  });

  it('keeps the brand image proportional and prioritizes above-the-fold media', () => {
    expect(source).toContain('className="h-9 w-auto sm:h-11"');
    expect(source).toContain('width={256}');
    expect(source).toContain('height={78}');
    expect(source).toMatch(/<Image[\s\S]*?priority[\s\S]*?\/>/);
    expect(source).toMatch(
      /src="\/images\/hero\.jpg"[\s\S]*?loading="eager"[\s\S]*?\/>/
    );
  });

  it('provides language switching, a skip link, and the desktop showcase', () => {
    expect(source).toContain('href="#auth-content"');
    expect(source).toContain('<LanguageSwitcher');
    expect(source).toContain('<AuthShowcase />');
  });
});
