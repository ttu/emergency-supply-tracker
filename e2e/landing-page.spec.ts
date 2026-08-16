import { test, expect } from './fixtures';
import { STORAGE_KEY } from '../src/shared/utils/storage/localStorage';

test.describe('Landing page', () => {
  test('shows the pitch to a visitor with no stored data', async ({ page }) => {
    await page.goto('/landing.html');
    await expect(
      page.getByRole('heading', { name: /actually ready/ }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/landing\.html$/);
  });

  test('CTAs open the app', async ({ page }) => {
    await page.goto('/landing.html');
    await page.getByRole('link', { name: 'Start tracking →' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('shows "get started" CTAs, not "open app", for a first-time visitor', async ({
    page,
  }) => {
    await page.goto('/landing.html');
    await expect(
      page.getByRole('link', { name: 'Start tracking →' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Get started →' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Open the app' }).first(),
    ).toBeHidden();
  });

  test('shows "open app" CTAs, not "get started", for a returning visitor previewing the page', async ({
    page,
    setupApp,
  }) => {
    await setupApp();
    await page.goto('/landing.html?preview=1');
    await expect(
      page.getByRole('link', { name: 'Open the app' }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Start tracking →' }),
    ).toBeHidden();
    await expect(
      page.getByRole('link', { name: 'Get started →' }),
    ).toBeHidden();
  });

  test('redirects a returning visitor straight to the app', async ({
    page,
    setupApp,
  }) => {
    // setupApp seeds localStorage with a completed household, i.e. this
    // browser has "used the app before".
    await setupApp();
    await page.goto('/landing.html');
    await expect(page).toHaveURL(/\/$/);
  });

  test('?preview=1 lets a returning visitor see the pitch without redirecting', async ({
    page,
    setupApp,
  }) => {
    // The in-app Guide screen links back here for visitors who already have
    // a household set up, so the redirect above must not eat that link.
    await setupApp();
    await page.goto('/landing.html?preview=1');
    await expect(
      page.getByRole('heading', { name: /actually ready/ }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/landing\.html\?preview=1$/);
  });

  test('redirects a visitor who has loaded the app before, even without completing onboarding', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    // Loading the app once, even mid-onboarding, writes the storage key.
    await expect
      .poll(async () =>
        page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
      )
      .not.toBeNull();

    await page.goto('/landing.html');
    await expect(page).toHaveURL(/\/$/);
  });

  test('a fresh visitor with cleared storage sees the landing page instead of the app root', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    // A never-visited browser has no storage key at all yet.
    await page.goto('/landing.html');
    await expect(
      page.getByRole('heading', { name: /actually ready/ }),
    ).toBeVisible();
  });

  test('offers a Finnish translation via the language toggle', async ({
    page,
  }) => {
    await page.goto('/landing.html');
    await page.getByRole('link', { name: 'FI', exact: true }).click();
    await expect(page).toHaveURL(/\?lang=fi$/);
    await expect(
      page.getByRole('heading', { name: /oikeasti valmis/ }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/Tiedä, että olet valmis/);

    // Toggling back to English restores the original copy.
    await page.getByRole('link', { name: 'EN', exact: true }).click();
    await expect(page).toHaveURL(/\?lang=en$/);
    await expect(
      page.getByRole('heading', { name: /actually ready/ }),
    ).toBeVisible();
  });

  test('honors ?lang=fi directly, matching the app’s own URL-param priority', async ({
    page,
  }) => {
    await page.goto('/landing.html?lang=fi');
    await expect(
      page.getByRole('heading', { name: /oikeasti valmis/ }),
    ).toBeVisible();
  });
});
