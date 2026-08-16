import {
  test,
  expect,
  setAppStorage,
  toLocalDateString,
  startAddCustomItem,
  waitForStoredData,
  APP_URL,
} from './fixtures';
import {
  createMockAppData,
  createMockInventoryItem,
} from '../src/shared/utils/test/factories';
import {
  createCategoryId,
  createQuantity,
  createDateOnly,
  createProductTemplateId,
} from '../src/shared/types';
import type { Page } from '@playwright/test';
import type { RootStorage } from '../src/shared/types';

const settings = {
  onboardingCompleted: true as const,
  language: 'en' as const,
  theme: 'cockpit' as const,
  highContrast: false,
  advancedFeatures: {
    calorieTracking: false,
    powerManagement: false,
    waterTracking: false,
  },
};

const day = (o: number) => {
  const d = new Date();
  d.setDate(d.getDate() + o);
  return createDateOnly(toLocalDateString(d));
};

const items = [
  createMockInventoryItem({
    name: 'Bottled water',
    itemType: createProductTemplateId('bottled-water'),
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(20),
    unit: 'liters',
    neverExpires: true,
  }),
  createMockInventoryItem({
    name: 'Canned soup',
    itemType: createProductTemplateId('canned-soup'),
    categoryId: createCategoryId('food'),
    quantity: createQuantity(12),
    unit: 'cans',
    neverExpires: false,
    expirationDate: day(240),
  }),
  createMockInventoryItem({
    name: 'Expired meds',
    itemType: createProductTemplateId('prescription-meds'),
    categoryId: createCategoryId('medical-health'),
    quantity: createQuantity(2),
    unit: 'days',
    neverExpires: false,
    expirationDate: day(-3),
  }),
];

async function boot(page: Page, viewport: 'desktop' | 'mobile' = 'desktop') {
  await page.setViewportSize(
    viewport === 'desktop'
      ? { width: 1440, height: 960 }
      : { width: 390, height: 844 },
  );
  await page.goto(APP_URL);
  await setAppStorage(
    page,
    createMockAppData({ settings, items: [...items], customCategories: [] }),
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
  // The v2 shell is the signal that the app has booted with the seeded data.
  await expect(page.getByTestId('v2-nav-home')).toBeVisible();
}

const storage = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem('emergencySupplyTracker') ?? '{}',
      ) as RootStorage,
  );

const activeSet = async (page: Page) => {
  const root = await storage(page);
  return root.inventorySets[root.activeInventorySetId];
};

/** Poll stored items until `predicate` holds — persistence is asynchronous. */
const expectStoredItems = (
  page: Page,
  predicate: (items: Array<{ name: string; quantity: number }>) => boolean,
) =>
  expect
    .poll(async () => predicate((await activeSet(page)).items ?? []))
    .toBe(true);

// ── OVERVIEW ────────────────────────────────────────────────────────────────

test.describe('Overview actions', () => {
  test('alert banner expands and collapses', async ({ page }) => {
    await boot(page);
    const rows = page.getByTestId('v2-alert-row');
    await expect(rows).toHaveCount(3);

    await page.getByTestId('v2-alert-toggle').click();
    await expect.poll(() => rows.count()).toBeGreaterThan(3);

    await page.getByTestId('v2-alert-toggle').click();
    await expect(rows).toHaveCount(3);
  });

  test('dismissing an alert persists across reload', async ({ page }) => {
    await boot(page);
    const before = await page.getByTestId('v2-alert-row').count();
    await page
      .getByTestId('v2-alert-row')
      .filter({ hasText: /expired/i })
      .getByRole('button', { name: /DISMISS/i })
      .click();
    // The dismissal has to reach localStorage before the reload, or the test
    // races the write and the alert can come back for reasons of timing.
    await waitForStoredData(page, (raw) => raw.includes('dismissedAlertIds'));

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('v2-nav-home')).toBeVisible();
    await expect(
      page.getByTestId('v2-alert-row').filter({ hasText: /expired/i }),
    ).toHaveCount(0);
    await expect
      .poll(() => page.getByTestId('v2-alert-row').count())
      .toBeLessThanOrEqual(before);
  });

  test('resolve on an alert opens that item', async ({ page }) => {
    await boot(page);
    await page
      .getByTestId('v2-alert-row')
      .filter({ hasText: /expired/i })
      .getByRole('button', { name: /RESOLVE/i })
      .click();
    await expect(page.getByText('ITEM RECORD')).toBeVisible();
    await expect(page.getByTestId('v2-nav-inv')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('category tile jumps to that category in inventory', async ({
    page,
  }) => {
    await boot(page);
    await page.getByTestId('v2-category-food').click();
    await expect(page.getByTestId('v2-category-row-food')).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  test('priority queue view-all goes to inventory', async ({ page }) => {
    await boot(page);
    await page.getByRole('button', { name: /VIEW ALL/i }).click();
    await expect(page.getByTestId('v2-nav-inv')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

// ── INVENTORY ───────────────────────────────────────────────────────────────

test.describe('Inventory actions', () => {
  const openInventory = async (page: Page) => {
    await page.getByTestId('v2-nav-inv').click();
  };

  test('search narrows the list', async ({ page }) => {
    await boot(page);
    await openInventory(page);
    await expect(page.getByText('Bottled water')).toBeVisible();

    await page.getByPlaceholder(/SEARCH/i).fill('soup');
    await expect(page.getByText('Canned soup')).toBeVisible();
    await expect(page.getByText('Bottled water')).toHaveCount(0);
  });

  test('status filters narrow the list', async ({ page }) => {
    await boot(page);
    await openInventory(page);

    // The expired item is the only CRIT one.
    await page.getByTestId('v2-status-crit').click();
    await expect(page.getByText('Expired meds')).toBeVisible();
    await expect(page.getByText('Bottled water')).toHaveCount(0);

    await page.getByTestId('v2-status-all').click();
    await expect(page.getByText('Bottled water')).toBeVisible();
  });

  test('category filter narrows the list', async ({ page }) => {
    await boot(page);
    await openInventory(page);
    await page.getByTestId('v2-category-row-food').click();
    // Scoped to the table: picking a category also opens a summary panel that
    // names shortfalls, so a bare getByText matches outside the list too.
    const table = page.getByTestId('v2-inventory-table');
    await expect(table.getByText('Canned soup')).toBeVisible();
    await expect(table.getByText('Bottled water')).toHaveCount(0);
  });

  test('filters survive leaving the list and reloading', async ({ page }) => {
    await boot(page);
    await openInventory(page);

    await page.getByTestId('v2-category-row-food').click();
    await page.getByTestId('v2-status-warn').click();
    await page.getByPlaceholder(/SEARCH/i).fill('soup');

    // Round trip through the dashboard…
    await page.getByTestId('v2-nav-home').click();
    await openInventory(page);
    await expect(page.getByTestId('v2-category-row-food')).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(page.getByPlaceholder(/SEARCH/i)).toHaveValue('soup');

    // …and through a full reload.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await openInventory(page);
    await expect(page.getByTestId('v2-category-row-food')).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(page.getByTestId('v2-status-warn')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByPlaceholder(/SEARCH/i)).toHaveValue('soup');
  });

  test('search and status filters narrow the list on a phone', async ({
    page,
  }) => {
    // MobileInventory renders its own filter chips and search box (no
    // v2-status-* testids, no category rail) — desktop coverage above
    // doesn't exercise any of that.
    await boot(page, 'mobile');
    await openInventory(page);
    await expect(page.getByText('Bottled water')).toBeVisible();

    await page.getByPlaceholder(/SEARCH/i).fill('soup');
    await expect(page.getByText('Canned soup')).toBeVisible();
    await expect(page.getByText('Bottled water')).toHaveCount(0);
    await page.getByPlaceholder(/SEARCH/i).fill('');

    // The expired item is the only CRIT one.
    await page.getByRole('button', { name: 'CRIT' }).click();
    await expect(page.getByText('Expired meds')).toBeVisible();
    await expect(page.getByText('Bottled water')).toHaveCount(0);

    await page.getByRole('button', { name: 'ALL' }).click();
    await expect(page.getByText('Bottled water')).toBeVisible();
  });

  test('add an item and see it persisted', async ({ page }) => {
    await boot(page);
    await openInventory(page);

    await startAddCustomItem(page);
    await page.locator('#name').fill('Sweep test item');
    await page.locator('#quantity').fill('7');
    await page.locator('#categoryId').selectOption('food');
    // Expiration is a required field unless the item never expires.
    await page.getByLabel(/never expires/i).check();
    await page.locator('form button[type="submit"]').click();

    await expectStoredItems(page, (items) =>
      items.some((i) => i.name === 'Sweep test item'),
    );
  });

  test('edit quantity from the item detail persists', async ({ page }) => {
    await boot(page);
    await openInventory(page);
    await page.getByText('Canned soup').first().click();

    await page.locator('#quantity').fill('33');
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expectStoredItems(
      page,
      (items) => items.find((i) => i.name === 'Canned soup')?.quantity === 33,
    );
  });

  test('quantity stepper updates the form and survives a save', async ({
    page,
  }) => {
    await boot(page);
    await openInventory(page);
    await page.getByText('Canned soup').first().click();

    const before = Number(await page.locator('#quantity').inputValue());
    await page.getByRole('button', { name: /^Increase .* by 1$/ }).click();

    // The quick-action writes to storage; the form must follow, otherwise
    // saving afterwards silently reverts the adjustment.
    await expect(page.locator('#quantity')).toHaveValue(String(before + 1));

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expectStoredItems(
      page,
      (items) =>
        items.find((i) => i.name === 'Canned soup')?.quantity === before + 1,
    );
  });

  test('a missing recommended item can be found and added', async ({
    page,
  }) => {
    await boot(page);
    await openInventory(page);

    await page.getByTestId('v2-status-missing').click();
    const rows = page.getByTestId('v2-missing-row');
    await expect(rows.first()).toBeVisible();

    const name = await rows.first().locator('span').nth(1).textContent();

    // Adding pre-fills the form from the product template.
    await rows.first().getByRole('button', { name: /^Add$/i }).click();
    await expect(page.locator('#name')).toHaveValue(name!.trim());
    await expect(page.locator('#unit')).not.toHaveValue('');

    await page.locator('#quantity').fill('5');
    await page.getByLabel(/never expires/i).check();
    await page.locator('form button[type="submit"]').click();

    await expectStoredItems(page, (items) =>
      items.some((i) => i.name === name!.trim()),
    );
  });

  test('the recommended panel expands and its dismissal persists', async ({
    page,
  }) => {
    await boot(page);
    // Pin the household: boot leaves it to faker, and how many recommended
    // items a category falls short of is derived from it.
    await setAppStorage(
      page,
      createMockAppData({
        settings,
        household: {
          adults: 2,
          children: 1,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
        items: [...items],
        customCategories: [],
      }),
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await openInventory(page);
    await page.getByTestId('v2-category-row-water-beverages').click();

    // Collapsed by default: the header states the count, nothing more.
    const toggle = page.getByTestId('v2-recommended-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('v2-recommended-row')).toHaveCount(0);

    await toggle.click();
    const rows = page.getByTestId('v2-recommended-row');
    const before = await rows.count();
    expect(before).toBeGreaterThan(0);

    // Dismissing writes through to the disabled-recommendations list, so the
    // shortage has to stay gone across a reload — the whole point of the
    // action, and the part a jsdom test cannot observe.
    await rows
      .first()
      .getByRole('button', { name: /don't recommend/i })
      .click();
    await expect(rows).toHaveCount(before - 1);

    await expect
      .poll(async () => (await activeSet(page)).disabledRecommendedItems ?? [])
      .not.toHaveLength(0);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await openInventory(page);
    await page.getByTestId('v2-recommended-toggle').click();
    await expect(page.getByTestId('v2-recommended-row')).toHaveCount(
      before - 1,
    );
  });

  test('copy duplicates an item rather than editing it', async ({ page }) => {
    await boot(page);
    await openInventory(page);
    await page.getByText('Canned soup').first().click();

    await page.getByRole('button', { name: /^Copy$/i }).click();
    // The values carry over and the product picker is skipped.
    await expect(page.locator('#name')).toHaveValue('Canned soup');

    await page.locator('#quantity').fill('9');
    await page.locator('form button[type="submit"]').click();

    await expectStoredItems(
      page,
      (items) => items.filter((i) => i.name === 'Canned soup').length === 2,
    );
  });

  test('delete an item removes it', async ({ page }) => {
    await boot(page);
    await openInventory(page);
    await page.getByText('Canned soup').first().click();

    await page
      .getByRole('button', { name: /^Delete$/i })
      .first()
      .click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /DELETE|CONFIRM|OK/i }).click();

    await expectStoredItems(
      page,
      (items) => !items.some((i) => i.name === 'Canned soup'),
    );
  });
});

// ── HELP ────────────────────────────────────────────────────────────────────

test('Help renders its sections', async ({ page }) => {
  await boot(page);
  await page.getByTestId('v2-nav-help').click();
  await expect(page.getByText('§1')).toBeVisible();
  await expect(page.getByText('§6')).toBeVisible();
});

// ── SETTINGS ────────────────────────────────────────────────────────────────

test.describe('Settings', () => {
  const gotoSettings = async (page: Page) => {
    await page.getByTestId('v2-nav-settings').click();
  };

  test('theme switching applies and persists', async ({ page }) => {
    await boot(page);
    await gotoSettings(page);

    // The three theme cards are the leading buttons of §1 Appearance,
    // in THEMES order: cockpit, civil, pantry.
    const cardIndex: Record<string, number> = {
      cockpit: 0,
      civil: 1,
      pantry: 2,
    };
    for (const theme of ['civil', 'pantry', 'cockpit']) {
      await page
        .locator('#sec-appearance button')
        .nth(cardIndex[theme])
        .click();
      // The applied theme attribute is the render-side signal; storage
      // follows it.
      await expect(
        page.locator(`[data-theme="${theme}"]`).first(),
      ).toBeVisible();
      await expect
        .poll(async () => (await storage(page)).settings.theme, {
          message: `theme card ${theme}`,
        })
        .toBe(theme);
    }
  });

  test('language switch changes the UI and persists', async ({ page }) => {
    await boot(page);
    await gotoSettings(page);

    const storedLanguage = () =>
      expect.poll(async () => (await storage(page)).settings.language);

    await page.getByRole('button', { name: /FI\s+Suomi/i }).click();
    await storedLanguage().toBe('fi');

    await page.getByRole('button', { name: /EN\s+English/i }).click();
    await storedLanguage().toBe('en');
  });

  test('every settings toggle flips and persists', async ({ page }) => {
    await boot(page);
    await gotoSettings(page);

    const switches = page.locator('main [role="switch"]');
    const count = await switches.count();
    // Floor, not an inventory: enough to prove the settings page rendered its
    // controls. Dropped from 11 when the dead hygiene-water switch was cut.
    expect(count).toBeGreaterThanOrEqual(10);

    // Snapshot each switch's accessible name up front, then look each one up
    // by name rather than position: nth(i) on the live locator can drift if
    // an earlier toggle changes what else renders.
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      labels.push(
        (await switches.nth(i).getAttribute('aria-label')) ?? `switch-${i}`,
      );
    }

    for (const label of labels) {
      const sw = page.getByRole('switch', { name: label });
      const before = await sw.getAttribute('aria-checked');
      await sw.scrollIntoViewIfNeeded();
      await sw.click();
      await expect
        .poll(() => sw.getAttribute('aria-checked'), {
          message: `toggle "${label}" did not flip`,
        })
        .not.toBe(before);
    }
  });

  test('household steppers update the computed targets', async ({ page }) => {
    await boot(page);
    await gotoSettings(page);
    await page.locator('#sec-household').scrollIntoViewIfNeeded();

    const plus = page
      .locator('#sec-household')
      .getByRole('button', { name: /increase|^\+$/i })
      .first();

    const before = (await activeSet(page)).household.adults;
    await plus.click();

    await expect
      .poll(async () => (await activeSet(page)).household.adults)
      .toBe(before + 1);
  });

  test('danger zone reset asks for confirmation', async ({ page }) => {
    await boot(page);
    await gotoSettings(page);
    await page.locator('#sec-danger').scrollIntoViewIfNeeded();

    // Reset inventory must use the themed dialog, not a native confirm().
    await page.locator('#sec-danger').getByRole('button').first().click();
    await expect(page.getByRole('alertdialog')).toBeVisible();

    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /cancel/i })
      .click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });
});
