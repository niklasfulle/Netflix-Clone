import fs from 'node:fs';
import path from 'node:path';

const playerPages = [
  'app/(protected)/random/page.tsx',
];

// Watch routes render the shared VideoPlayer; its title behavior is tested there.
describe('legacy random catalog title marquee', () => {
  test.each(playerPages)('%s uses the compact marquee title', (playerPage) => {
    const source = fs.readFileSync(path.join(process.cwd(), playerPage), 'utf8');

    expect(source).toContain('player-title-marquee');
    expect(source).toContain('player-title-marquee-track');
    expect(source).toContain('data-title=');
    expect(source).toContain('gap-3 sm:gap-8');
  });

  test('animates only on mobile and respects reduced motion', () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), 'app/globals.css'),
      'utf8'
    );

    expect(css).toContain('@keyframes player-title-marquee');
    expect(css).toContain('@media (max-width: 639px)');
    expect(css).toContain('animation: player-title-marquee 12s linear infinite');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
