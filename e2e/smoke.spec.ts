import { test, expect } from '@playwright/test';

test.describe('Anahata smoke', () => {
  test('loads with the wordmark and transport', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Anahata/);
    await expect(page.getByRole('heading', { level: 1, name: /Anahata/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();

    // Durable rendered evidence at the shipped size, uploaded by CI.
    await page.screenshot({ path: 'test-results/anahata-load.png', fullPage: true });
  });

  test('Alpha Waves preset applies a true beat pair and unlinks channels', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Alpha Waves').click();

    // The mixer shows the 200/210 carrier pair, not a 10 Hz carrier.
    const spinboxes = page.getByRole('spinbutton');
    await expect(spinboxes.nth(0)).toHaveValue('200');
    await expect(spinboxes.nth(1)).toHaveValue('210');
    await expect(page.getByRole('button', { name: /Independent/ })).toBeVisible();
  });

  test('transport plays and pauses', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  });

  test('natural end returns the transport to Play and stays there', async ({ page }) => {
    await page.goto('/');

    // Shorten the session via the transport's labelled duration input.
    await page.getByLabel('Session duration (ms)').fill('3000');

    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();

    // The engine stops itself at 3s; the transport shows Play again.
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible({
      timeout: 8000,
    });
  });

  test('session and settings survive a reload (localStorage)', async ({ page }) => {
    await page.goto('/');

    await page.getByText('Alpha Waves').click();
    await expect(page.getByRole('spinbutton').nth(1)).toHaveValue('210');

    // Let the debounced autosave flush before reloading.
    await page.waitForTimeout(700);
    await page.reload();

    await expect(page.getByRole('spinbutton').nth(0)).toHaveValue('200');
    await expect(page.getByRole('spinbutton').nth(1)).toHaveValue('210');
  });

  test('offline: service worker serves the shell without a network', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /Anahata/ })).toBeVisible();

    // Let the service worker finish caching the shell.
    await page.evaluate(() => navigator.serviceWorker.ready);

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('heading', { level: 1, name: /Anahata/ })).toBeVisible();
  });
});
