import { test, expect, APP_URL } from './fixtures';
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
    await expect(page).toHaveURL(/\/\?app=1$/);
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
    await page.goto(APP_URL);
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
    // Load the app once so it writes its key, then wipe storage from the
    // landing page instead of the app. The landing page never writes the key
    // itself, so the clear cannot race an app effect putting it straight back.
    await page.goto(APP_URL);
    await expect
      .poll(async () =>
        page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
      )
      .not.toBeNull();
    await page.goto('/landing.html?preview=1');
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

test.describe('Landing page as the site root', () => {
  test('sends a first-time visitor at / to the landing page', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/landing\.html$/);
    await expect(
      page.getByRole('heading', { name: /actually ready/ }),
    ).toBeVisible();
  });

  test('leaves a returning visitor at / on the app', async ({
    page,
    setupApp,
  }) => {
    await setupApp();
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('v2-nav-home')).toBeVisible();
  });

  test('does not bounce a first-time visitor who clicked through from the pitch', async ({
    page,
  }) => {
    await page.goto('/landing.html');
    await page.getByRole('link', { name: 'Start tracking →' }).click();

    // The visitor still has no stored data at this point, so without the
    // ?app=1 bypass the root gate would send them straight back and the two
    // redirects would loop forever. They land in onboarding, not the
    // dashboard, since this is still their first visit.
    await expect(page).toHaveURL(/\/\?app=1$/);
    await expect(page.getByText(/STEP 01 \/ 06/)).toBeVisible();
  });

  test('carries ?lang=fi through to the landing page', async ({ page }) => {
    await page.goto('/?lang=fi');
    await expect(page).toHaveURL(/\/landing\.html\?lang=fi$/);
    await expect(
      page.getByRole('heading', { name: /oikeasti valmis/ }),
    ).toBeVisible();
  });
});
