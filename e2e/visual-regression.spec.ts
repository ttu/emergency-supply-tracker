import {
  test,
  expect,
  setAppStorage,
  defaultAppData,
  selectInventoryCategory,
  navigateToSettingsSection,
  APP_URL,
} from './fixtures';
import { createMockAppData } from '../src/shared/utils/test/factories';
import {
  createItemId,
  createCategoryId,
  createQuantity,
  createDateOnly,
  createProductTemplateId,
} from '../src/shared/types';
import type { DesignV2Theme, InventoryItem } from '../src/shared/types';

/**
 * Visual regression snapshots for the design-v2 shell. Baselines were
 * regenerated when the v1 → v2 e2e migration landed; old v1 themes
 * (light/dark/ocean) are no longer covered here — the v2 ThemePicker
 * tests in theme-switching.spec.ts cover theme behaviour functionally.
 */

const testItems: InventoryItem[] = [
  {
    id: createItemId('water-1'),
    name: 'Drinking Water',
    itemType: createProductTemplateId('drinking-water'),
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(6),
    unit: 'liters',
    expirationDate: createDateOnly('2027-06-15'),
    notes: '',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: createItemId('food-1'),
    name: 'Canned Beans',
    itemType: createProductTemplateId('canned-beans'),
    categoryId: createCategoryId('food'),
    quantity: createQuantity(4),
    unit: 'pieces',
    expirationDate: createDateOnly('2026-12-01'),
    notes: 'Stored in pantry',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: createItemId('food-2'),
    name: 'Rice',
    itemType: createProductTemplateId('rice'),
    categoryId: createCategoryId('food'),
    quantity: createQuantity(2),
    unit: 'kilograms',
    notes: '',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: createItemId('med-1'),
    name: 'First Aid Kit',
    itemType: createProductTemplateId('first-aid-kit'),
    categoryId: createCategoryId('medical-health'),
    quantity: createQuantity(1),
    unit: 'pieces',
    notes: '',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: createItemId('light-1'),
    name: 'Flashlight',
    itemType: createProductTemplateId('flashlight'),
    categoryId: createCategoryId('light-power'),
    quantity: createQuantity(2),
    unit: 'pieces',
    notes: '',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

function v2Settings(theme: DesignV2Theme = 'cockpit') {
  return {
    onboardingCompleted: true as const,
    language: 'en' as const,
    theme,
    highContrast: false,
    advancedFeatures: {
      calorieTracking: false,
      powerManagement: false,
      waterTracking: false,
    },
  };
}

function seededAppData(theme: DesignV2Theme = 'cockpit') {
  return createMockAppData({
    settings: v2Settings(theme),
    household: {
      adults: 2,
      children: 0,
      pets: 0,
      supplyDurationDays: 3,
      useFreezer: true,
    },
    items: testItems,
    customCategories: [],
  });
}

/** Disable CSS transitions/animations for stable screenshots */
async function disableAnimations(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
}

async function loadWith(
  page: import('@playwright/test').Page,
  appData: ReturnType<typeof createMockAppData>,
) {
  await page.goto(APP_URL);
  await setAppStorage(page, appData);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await disableAnimations(page);
  await page.waitForLoadState('networkidle');
}

// ─── Dashboard ───────────────────────────────────────────────────────

test.describe('Visual Regression - Dashboard', () => {
  test('empty dashboard', async ({ page }) => {
    await loadWith(page, defaultAppData);
    await expect(page).toHaveScreenshot('dashboard-empty.png', {
      fullPage: true,
    });
  });

  test('dashboard with items', async ({ page }) => {
    await loadWith(page, seededAppData());
    await expect(page).toHaveScreenshot('dashboard-with-items.png', {
      fullPage: true,
    });
  });
});

// ─── Inventory ───────────────────────────────────────────────────────

test.describe('Visual Regression - Inventory', () => {
  test.beforeEach(async ({ page }) => {
    await loadWith(page, seededAppData());
  });

  test('inventory list', async ({ page }) => {
    await page.getByTestId('v2-nav-inv').click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('inventory-list.png', {
      fullPage: true,
    });
  });

  test('inventory category view', async ({ page }) => {
    await selectInventoryCategory(page, 'food');
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('inventory-category-food.png', {
      fullPage: true,
    });
  });
});

// ─── Settings ────────────────────────────────────────────────────────

test.describe('Visual Regression - Settings', () => {
  test.beforeEach(async ({ setupApp, page }) => {
    await setupApp();
    await disableAnimations(page);
  });

  test('settings household section', async ({ page }) => {
    await navigateToSettingsSection(page, 'household');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('settings-household.png', {
      fullPage: true,
    });
  });

  test('settings appearance section', async ({ page }) => {
    await navigateToSettingsSection(page, 'appearance');
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('settings-appearance.png', {
      fullPage: true,
    });
  });
});

// ─── Onboarding ──────────────────────────────────────────────────────

test.describe('Visual Regression - Onboarding', () => {
  test('welcome screen', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await disableAnimations(page);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/STEP 01 \/ 06/)).toBeVisible({
      timeout: 10000,
    });
    await expect(page).toHaveScreenshot('onboarding-welcome.png', {
      fullPage: true,
    });
  });
});

// ─── Themes ──────────────────────────────────────────────────────────

test.describe('Visual Regression - Themes', () => {
  const themes: DesignV2Theme[] = ['cockpit', 'civil', 'pantry'];

  for (const theme of themes) {
    test(`dashboard ${theme} theme`, async ({ page }) => {
      await loadWith(page, seededAppData(theme));
      await expect(page).toHaveScreenshot(`dashboard-theme-${theme}.png`, {
        fullPage: true,
      });
    });
  }
});

// ─── Mobile Viewport ─────────────────────────────────────────────────

test.describe('Visual Regression - Mobile', () => {
  test.use({ viewport: { width: 393, height: 851 } });

  test.beforeEach(async ({ page }) => {
    await loadWith(page, seededAppData());
  });

  test('mobile dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('mobile-dashboard.png', {
      fullPage: true,
    });
  });

  test('mobile inventory', async ({ page }) => {
    await page.getByTestId('v2-nav-inv').click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('mobile-inventory.png', {
      fullPage: true,
    });
  });
});

// ─── UI States ───────────────────────────────────────────────────────

test.describe('Visual Regression - UI States', () => {
  test('inline add-item view', async ({ page }) => {
    // v2 has no add-item modal — the inline ItemDetail view in NEW mode
    // replaces it. Capture that view instead.
    await loadWith(page, seededAppData());
    await page.getByTestId('v2-nav-inv').click();
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: '+ ADD' });
    await expect(addButton).toBeVisible();
    await addButton.click();
    // Adding opens the product picker; the blank form is the "custom" branch.
    await page.getByRole('button', { name: /custom item/i }).click();
    await page.getByTestId('item-form').waitFor({ state: 'visible' });
    await disableAnimations(page);

    await expect(page).toHaveScreenshot('inline-add-item.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
