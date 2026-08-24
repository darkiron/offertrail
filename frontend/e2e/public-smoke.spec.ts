import { expect, test } from '@playwright/test';

test('landing exposes its primary journey without runtime errors', async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/OfferTrail/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page
      .getByRole('link', {
        name: /créer|commencer|start for free|get started/i,
      })
      .first(),
  ).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test('legacy legal URL resolves to its canonical route', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page).toHaveURL(/\/rgpd$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
