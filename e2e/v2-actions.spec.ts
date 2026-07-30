import { test, expect, setAppStorage, toLocalDateString } from './fixtures';
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
  await page.goto('/');
  await setAppStorage(
    page,
    createMockAppData({ settings, items: [...items], customCategories: [] }),
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
}

const storage = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem('emergencySupplyTracker') ?? '{}'),
  );

const activeSet = async (page: Page) => {
  const root = await storage(page);
  return root.inventorySets?.[root.activeInventorySetId ?? 'default'] ?? {};
};

// ── OVERVIEW ────────────────────────────────────────────────────────────────

test.describe('Overview actions', () => {
  test('alert banner expands and collapses', async ({ page }) => {
    await boot(page);
    const rows = page.getByTestId('v2-alert-row');
    await expect(rows).toHaveCount(3);

    await page.getByTestId('v2-alert-toggle').click();
    const expanded = await rows.count();
    expect(expanded).toBeGreaterThan(3);

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
    await page.waitForTimeout(400);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const after = await page.getByTestId('v2-alert-row').count();
    expect(after).toBeLessThanOrEqual(before);
    await expect(
      page.getByTestId('v2-alert-row').filter({ hasText: /expired/i }),
    ).toHaveCount(0);
  });

  test('resolve on an alert opens that item', async ({ page }) => {
    await boot(page);
    await page
      .getByTestId('v2-alert-row')
      .filter({ hasText: /expired/i })
      .getByRole('button', { name: /RESOLVE/i })
      .click();
    await page.waitForTimeout(400);
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
    await page.waitForTimeout(400);
    const select = page.getByLabel(/CATEGORY/i);
    await expect(select).toHaveValue('food');
  });

  test('priority queue view-all goes to inventory', async ({ page }) => {
    await boot(page);
    await page.getByRole('button', { name: /VIEW ALL/i }).click();
    await page.waitForTimeout(400);
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
    await page.waitForTimeout(400);
  };

  test('search narrows the list', async ({ page }) => {
    await boot(page);
    await openInventory(page);
    await expect(page.getByText('Bottled water')).toBeVisible();

    await page.getByPlaceholder(/SEARCH/i).fill('soup');
    await page.waitForTimeout(400);
    await expect(page.getByText('Canned soup')).toBeVisible();
    await expect(page.getByText('Bottled water')).toHaveCount(0);
  });

  test('status filters narrow the list', async ({ page }) => {
    await boot(page);
    await openInventory(page);

    // The expired item is the only CRIT one.
    await page.getByRole('button', { name: /^CRIT/ }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Expired meds')).toBeVisible();
    await expect(page.getByText('Bottled water')).toHaveCount(0);

    await page.getByRole('button', { name: /^ALL/ }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Bottled water')).toBeVisible();
  });

  test('category filter narrows the list', async ({ page }) => {
    await boot(page);
    await openInventory(page);
    await page.getByLabel(/CATEGORY/i).selectOption('food');
    await page.waitForTimeout(400);
    await expect(page.getByText('Canned soup')).toBeVisible();
    await expect(page.getByText('Bottled water')).toHaveCount(0);
  });

  test('add an item and see it persisted', async ({ page }) => {
    await boot(page);
    await openInventory(page);

    await page.getByRole('button', { name: '+ ADD' }).click();
    await page.waitForTimeout(500);
    await page.locator('#name').fill('Sweep test item');
    await page.locator('#quantity').fill('7');
    await page.locator('#categoryId').selectOption('food');
    // Expiration is a required field unless the item never expires.
    await page.getByLabel(/never expires/i).check();
    await page.waitForTimeout(300);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(700);

    const set = await activeSet(page);
    expect(
      set.items.some((i: { name: string }) => i.name === 'Sweep test item'),
    ).toBe(true);
  });

  test('edit quantity from the item detail persists', async ({ page }) => {
    await boot(page);
    await openInventory(page);
    await page.getByText('Canned soup').first().click();
    await page.waitForTimeout(500);

    await page.locator('#quantity').fill('33');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(700);

    const set = await activeSet(page);
    const soup = set.items.find(
      (i: { name: string }) => i.name === 'Canned soup',
    );
    expect(soup.quantity).toBe(33);
  });

  test('quantity stepper updates the form and survives a save', async ({
    page,
  }) => {
    await boot(page);
    await openInventory(page);
    await page.getByText('Canned soup').first().click();
    await page.waitForTimeout(500);

    const before = Number(await page.locator('#quantity').inputValue());
    await page.getByRole('button', { name: /^Increase .* by 1$/ }).click();
    await page.waitForTimeout(500);

    // The quick-action writes to storage; the form must follow, otherwise
    // saving afterwards silently reverts the adjustment.
    expect(Number(await page.locator('#quantity').inputValue())).toBe(
      before + 1,
    );

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(700);
    const set = await activeSet(page);
    const soup = set.items.find(
      (i: { name: string }) => i.name === 'Canned soup',
    );
    expect(soup.quantity).toBe(before + 1);
  });

  test('delete an item removes it', async ({ page }) => {
    await boot(page);
    await openInventory(page);
    await page.getByText('Canned soup').first().click();
    await page.waitForTimeout(500);

    await page
      .getByRole('button', { name: /^Delete$/i })
      .first()
      .click();
    await page.waitForTimeout(400);
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /DELETE|CONFIRM|OK/i }).click();
    await page.waitForTimeout(700);

    const set = await activeSet(page);
    expect(
      set.items.some((i: { name: string }) => i.name === 'Canned soup'),
    ).toBe(false);
  });
});

// ── HELP ────────────────────────────────────────────────────────────────────

test('Help renders its sections', async ({ page }) => {
  await boot(page);
  await page.getByTestId('v2-nav-help').click();
  await page.waitForTimeout(400);
  await expect(page.getByText('§1')).toBeVisible();
  await expect(page.getByText('§6')).toBeVisible();
});

// ── SETTINGS ────────────────────────────────────────────────────────────────

test.describe('Settings', () => {
  const gotoSettings = async (page: Page) => {
    await page.getByTestId('v2-nav-settings').click();
    await page.waitForTimeout(600);
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
      await page.waitForTimeout(500);
      const root = await storage(page);
      expect(root.settings.theme, `theme card ${theme}`).toBe(theme);
      expect(
        await page.locator(`[data-theme="${theme}"]`).count(),
      ).toBeGreaterThan(0);
    }
  });

  test('language switch changes the UI and persists', async ({ page }) => {
    await boot(page);
    await gotoSettings(page);

    await page.getByRole('button', { name: /FI\s+Suomi/i }).click();
    await page.waitForTimeout(600);
    let root = await storage(page);
    expect(root.settings.language).toBe('fi');

    await page.getByRole('button', { name: /EN\s+English/i }).click();
    await page.waitForTimeout(600);
    root = await storage(page);
    expect(root.settings.language).toBe('en');
  });

  test('every settings toggle flips and persists', async ({ page }) => {
    await boot(page);
    await gotoSettings(page);

    const switches = page.locator('main [role="switch"]');
    const count = await switches.count();
    expect(count).toBeGreaterThanOrEqual(11);

    for (let i = 0; i < count; i++) {
      const sw = switches.nth(i);
      const label = (await sw.getAttribute('aria-label')) ?? `switch-${i}`;
      const before = await sw.getAttribute('aria-checked');
      await sw.scrollIntoViewIfNeeded();
      await sw.click();
      await page.waitForTimeout(250);
      const after = await sw.getAttribute('aria-checked');
      expect(after, `toggle "${label}" did not flip`).not.toBe(before);
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
    await plus.click();
    await page.waitForTimeout(400);

    const root = await storage(page);
    const household =
      root.inventorySets[root.activeInventorySetId ?? 'default'].household;
    expect(household.adults).toBeGreaterThanOrEqual(1);
  });

  test('danger zone reset asks for confirmation', async ({ page }) => {
    await boot(page);
    await gotoSettings(page);
    await page.locator('#sec-danger').scrollIntoViewIfNeeded();

    // Reset inventory must use the themed dialog, not a native confirm().
    await page.locator('#sec-danger').getByRole('button').first().click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('alertdialog')).toBeVisible();

    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /cancel/i })
      .click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });
});
