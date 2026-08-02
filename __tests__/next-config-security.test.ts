/** @jest-environment node */

const nextConfig = require('../next.config.js');

describe('Next.js security headers', () => {
  it('sets the browser security baseline for every route', async () => {
    const rules = await nextConfig.headers();
    const globalRule = rules.find((rule: { source: string }) => rule.source === '/(.*)');
    const headers = new Map(
      globalRule.headers.map((header: { key: string; value: string }) => [header.key, header.value]),
    );

    expect(headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('Permissions-Policy')).toContain('camera=()');
  });

  it('enables HSTS only when explicitly running behind production TLS', async () => {
    const previous = process.env.ENABLE_HSTS;
    process.env.ENABLE_HSTS = 'true';
    jest.resetModules();
    const productionConfig = require('../next.config.js');
    const rules = await productionConfig.headers();
    expect(rules[0].headers).toContainEqual({
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains',
    });
    process.env.ENABLE_HSTS = previous;
  });
});
