import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('the primary product destinations stay mounted and navigable', async () => {
  const [app, layout] = await Promise.all([
    readSource('../src/App.tsx'),
    readSource('../src/templates/AppLayout.tsx'),
  ]);

  for (const destination of [
    '/app/candidatures',
    '/app/etablissements',
    '/app/contacts',
    '/app/import',
    '/app/mon-compte',
  ]) {
    assert.match(`${app}\n${layout}`, new RegExp(destination));
  }
});

test('landing navigation hashes target sections rendered by the landing page', async () => {
  const [layout, ...landingParts] = await Promise.all([
    readSource('../src/templates/LandingLayout.tsx'),
    readSource('../src/pages/LandingPage.tsx'),
    readSource('../src/components/landing/organisms/LandingHero.tsx'),
    readSource('../src/components/landing/organisms/LandingWorkflow.tsx'),
    readSource('../src/components/landing/organisms/LandingPricing.tsx'),
    readSource('../src/components/landing/organisms/LandingFaq.tsx'),
  ]);
  const landing = landingParts.join('\n');

  const hashes = [...layout.matchAll(/href: '\/#([^']+)'/g)].map(
    ([, hash]) => hash,
  );
  assert.ok(hashes.length > 0, 'expected public navigation hashes');

  for (const hash of hashes) {
    assert.match(landing, new RegExp(`id=["']${hash}["']`));
  }
});

test('both application shells expose a keyboard skip link and target', async () => {
  const layouts = await Promise.all([
    readSource('../src/templates/AppLayout.tsx'),
    readSource('../src/templates/LandingLayout.tsx'),
  ]);

  for (const layout of layouts) {
    const target = layout.match(
      /className=\{classes\.skipLink\} href="#([^"]+)"/,
    );
    assert.ok(target, 'expected a skip link');
    assert.match(layout, new RegExp(`id=["']${target[1]}["']`));
  }
});
