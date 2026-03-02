import { test, expect, setAppStorage, defaultAppData } from './fixtures';
import { createMockAppData } from '../src/shared/utils/test/factories';
import {
  createItemId,
  createCategoryId,
  createQuantity,
  createDateOnly,
  createProductTemplateId,
} from '../src/shared/types';
import type { InventoryItem } from '../src/shared/types';

// Deterministic test items for consistent screenshots
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
    unit: 'kg',
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

// ─── Dashboard ───────────────────────────────────────────────────────

test.describe('Visual Regression - Dashboard', () => {
  test('empty dashboard', async ({ page }) => {
    await page.goto('/');
    await setAppStorage(page, defaultAppData);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await disableAnimations(page);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-empty.png', {
      fullPage: true,
    });
  });

  test('dashboard with items', async ({ page }) => {
    await page.goto('/');
    const appData = createMockAppData({
      settings: {
        onboardingCompleted: true,
        language: 'en',
        theme: 'light',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
      household: {
        adults: 2,
        children: 1,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: true,
      },
      items: testItems,
      customCategories: [],
    });
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await disableAnimations(page);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-with-items.png', {
      fullPage: true,
    });
  });
});

// ─── Inventory ───────────────────────────────────────────────────────

test.describe('Visual Regression - Inventory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const appData = createMockAppData({
      settings: {
        onboardingCompleted: true,
        language: 'en',
        theme: 'light',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
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
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await disableAnimations(page);
  });

  test('inventory list', async ({ page }) => {
    await page.getByTestId('nav-inventory').click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('inventory-list.png', {
      fullPage: true,
    });
  });

  test('inventory category view', async ({ page }) => {
    await page.getByTestId('nav-inventory').click();
    await page.waitForLoadState('networkidle');

    // Select food category
    const sidebar = page.getByTestId('sidemenu-sidebar');
    await sidebar.getByTestId('sidemenu-item-food').click();
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('inventory-category-food.png', {
      fullPage: true,
    });
  });
});

// ─── Settings ────────────────────────────────────────────────────────

test.describe('Visual Regression - Settings', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('settings household section', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await disableAnimations(page);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('settings-household.png', {
      fullPage: true,
    });
  });

  test('settings appearance section', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await disableAnimations(page);
    await page
      .getByTestId('sidemenu-sidebar')
      .getByTestId('sidemenu-item-appearance')
      .click();
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('settings-appearance.png', {
      fullPage: true,
    });
  });
});

// ─── Onboarding ──────────────────────────────────────────────────────

test.describe('Visual Regression - Onboarding', () => {
  test('welcome screen', async ({ page }) => {
    // Clear storage to show onboarding
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await disableAnimations(page);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('onboarding-welcome')).toBeVisible({
      timeout: 10000,
    });

    await expect(page).toHaveScreenshot('onboarding-welcome.png', {
      fullPage: true,
    });
  });
});

// ─── Themes ──────────────────────────────────────────────────────────

test.describe('Visual Regression - Themes', () => {
  const themes = ['light', 'dark', 'ocean'] as const;

  for (const theme of themes) {
    test(`dashboard ${theme} theme`, async ({ page }) => {
      await page.goto('/');
      const appData = createMockAppData({
        settings: {
          onboardingCompleted: true,
          language: 'en',
          theme,
          highContrast: false,
          advancedFeatures: {
            calorieTracking: false,
            powerManagement: false,
            waterTracking: false,
          },
        },
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
      await setAppStorage(page, appData);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await disableAnimations(page);
      await page.waitForLoadState('networkidle');

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
    await page.goto('/');
    const appData = createMockAppData({
      settings: {
        onboardingCompleted: true,
        language: 'en',
        theme: 'light',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
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
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await disableAnimations(page);
  });

  test('mobile dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('mobile-dashboard.png', {
      fullPage: true,
    });
  });

  test('mobile inventory', async ({ page }) => {
    await page.getByTestId('nav-inventory').click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('mobile-inventory.png', {
      fullPage: true,
    });
  });
});

// ─── UI States ───────────────────────────────────────────────────────

test.describe('Visual Regression - UI States', () => {
  test('add item modal', async ({ page }) => {
    await page.goto('/');
    const appData = createMockAppData({
      settings: {
        onboardingCompleted: true,
        language: 'en',
        theme: 'light',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
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
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await disableAnimations(page);

    // Navigate to inventory and open add item modal
    await page.getByTestId('nav-inventory').click();
    await page.waitForLoadState('networkidle');

    // Click add item button
    const addButton = page.getByTestId('add-item-button');
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot('modal-add-item.png');
    }
  });
});
