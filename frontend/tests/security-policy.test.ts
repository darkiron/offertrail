import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const readProjectFile = (path: string) =>
  readFile(resolve(process.cwd(), path), 'utf8');

test('deployment CSP authorizes only the stable JSON-LD inline script', async () => {
  const [html, deployment] = await Promise.all([
    readProjectFile('index.html'),
    readProjectFile('vercel.json'),
  ]);
  const config = JSON.parse(deployment) as {
    headers: Array<{
      headers: Array<{ key: string; value: string }>;
    }>;
  };
  const csp = config.headers[0]?.headers.find(
    ({ key }) => key === 'Content-Security-Policy',
  )?.value;
  const jsonLd = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  )?.[1];

  expect(csp).toBeDefined();
  expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  expect(jsonLd).toBeDefined();
  const digest = createHash('sha256')
    .update(jsonLd ?? '')
    .digest('base64');
  expect(csp).toContain(`'sha256-${digest}'`);
});

test('API traffic is same-origin and proxied before the SPA fallback', async () => {
  const [deployment, environmentExample] = await Promise.all([
    readProjectFile('vercel.json'),
    readProjectFile('.env.example'),
  ]);
  const config = JSON.parse(deployment) as {
    headers: Array<{
      headers: Array<{ key: string; value: string }>;
    }>;
    rewrites: Array<{ source: string; destination: string }>;
  };
  const csp = config.headers[0]?.headers.find(
    ({ key }) => key === 'Content-Security-Policy',
  )?.value;

  expect(environmentExample).toMatch(/^VITE_API_URL=$/m);
  expect(config.rewrites[0]?.destination).toBe(
    'https://api.offertrail.fr/:endpoint/:path*',
  );
  expect(config.rewrites.at(-1)?.destination).toBe('/index.html');
  expect(csp).toContain("connect-src 'self'");
  expect(csp).not.toContain('https://api.offertrail.fr');
});

test('deployment applies the minimum browser security headers globally', async () => {
  const deployment = await readProjectFile('vercel.json');
  const config = JSON.parse(deployment) as {
    headers: Array<{
      source: string;
      headers: Array<{ key: string; value: string }>;
    }>;
  };
  const globalHeaders = config.headers.find(
    ({ source }) => source === '/(.*)',
  )?.headers;
  const values = new Map(globalHeaders?.map(({ key, value }) => [key, value]));

  expect(values.get('Strict-Transport-Security')).toContain('max-age=63072000');
  expect(values.get('X-Content-Type-Options')).toBe('nosniff');
  expect(values.get('X-Frame-Options')).toBe('DENY');
  expect(values.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  expect(values.get('Permissions-Policy')).toContain('camera=()');
});
