import { test as base, expect } from '@playwright/test';

// Default app data with onboarding completed
export const defaultAppData = {
  version: '1.0.0',
  settings: {
    onboardingCompleted: true,
    language: 'en',
    theme: 'light',
    advancedFeatures: {
      calorieTracking: false,
      nutritionInfo: false,
      mealPlanning: false,
      barcodeScan: false,
    },
  },
  household: {
    adults: 2,
    children: 0,
    supplyDurationDays: 3,
    useFreezer: true,
    freezerHoldTime: 48,
  },
  items: [],
  categories: [],
  lastModified: new Date().toISOString(),
};

// Extended test with setup helper
export const test = base.extend<{
  setupApp: () => Promise<void>;
}>({
  setupApp: async ({ page }, use) => {
    const setup = async () => {
      await page.goto('/');
      await page.evaluate((data) => {
        localStorage.setItem('emergencySupplyTracker', JSON.stringify(data));
      }, defaultAppData);
      await page.reload({ waitUntil: 'domcontentloaded' });
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(setup);
  },
});

export { expect };
