import {
  test,
  expect,
  navigateToSettingsSection,
  waitForAppReady,
} from './fixtures';
import { createMockAppData } from '../src/shared/utils/test/factories';
import { STORAGE_KEY } from '../src/shared/utils/storage/localStorage';

test.describe('Backup Reminder', () => {
  test('should show backup reminder after 30 days without backup', async ({
    page,
  }) => {
    // Setup app data with lastModified 31 days ago and no backup
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);

    const appData = createMockAppData({
      items: [
        // Add at least one item so reminder shows
        {
          id: 'test-item-1',
          name: 'Test Item',
          categoryId: 'food',
          quantity: 5,
          unit: 'pieces',
          recommendedQuantity: 10,
          neverExpires: true,
          createdAt: oldDate.toISOString(),
          updatedAt: oldDate.toISOString(),
        },
      ],
      lastModified: oldDate.toISOString(),
      lastBackupDate: undefined, // Never backed up
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
    });

    await page.goto('/');
    await page.evaluate(
      ({ data, key }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      { data: appData, key: STORAGE_KEY },
    );
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Should show backup reminder on dashboard
    await expect(page.getByText(/backup|Backup|varmuuskopio/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should dismiss backup reminder', async ({ page }) => {
    // Setup with old data
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);

    const appData = createMockAppData({
      items: [
        {
          id: 'test-item-1',
          name: 'Test Item',
          categoryId: 'food',
          quantity: 5,
          unit: 'pieces',
          recommendedQuantity: 10,
          neverExpires: true,
          createdAt: oldDate.toISOString(),
          updatedAt: oldDate.toISOString(),
        },
      ],
      lastModified: oldDate.toISOString(),
      lastBackupDate: undefined,
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
    });

    await page.goto('/');
    await page.evaluate(
      ({ data, key }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      { data: appData, key: STORAGE_KEY },
    );
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Find dismiss button for backup reminder
    const dismissButton = page
      .locator(
        'button[aria-label*="Dismiss" i], button[aria-label*="Sulje" i], button:has-text("✕")',
      )
      .first();
    await expect(dismissButton).toBeVisible({ timeout: 5000 });
    await dismissButton.click();

    // Reminder should be hidden
    await expect(page.getByText(/backup|Backup|varmuuskopio/i)).not.toBeVisible(
      { timeout: 3000 },
    );
  });

  test('should not show reminder after dismissal until next month', async ({
    page,
  }) => {
    // Setup with dismissed reminder
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);

    // Set dismissedUntil to first day of next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);

    const appData = createMockAppData({
      items: [
        {
          id: 'test-item-1',
          name: 'Test Item',
          categoryId: 'food',
          quantity: 5,
          unit: 'pieces',
          recommendedQuantity: 10,
          neverExpires: true,
          createdAt: oldDate.toISOString(),
          updatedAt: oldDate.toISOString(),
        },
      ],
      lastModified: oldDate.toISOString(),
      lastBackupDate: undefined,
      backupReminderDismissedUntil: nextMonth.toISOString(),
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
    });

    await page.goto('/');
    await page.evaluate(
      ({ data, key }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      { data: appData, key: STORAGE_KEY },
    );
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Reminder should not be visible (dismissed until next month)
    await expect(page.getByText(/backup|Backup|varmuuskopio/i)).not.toBeVisible(
      { timeout: 3000 },
    );
  });

  test('should remove reminder when backup date is recorded', async ({
    page,
  }) => {
    // Setup with old data
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);

    const appData = createMockAppData({
      items: [
        {
          id: 'test-item-1',
          name: 'Test Item',
          categoryId: 'food',
          quantity: 5,
          unit: 'pieces',
          recommendedQuantity: 10,
          neverExpires: true,
          createdAt: oldDate.toISOString(),
          updatedAt: oldDate.toISOString(),
        },
      ],
      lastModified: oldDate.toISOString(),
      lastBackupDate: undefined,
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
    });

    await page.goto('/');
    await page.evaluate(
      ({ data, key }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      { data: appData, key: STORAGE_KEY },
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);

    // Should see backup reminder
    await expect(page.getByText(/backup|Backup|varmuuskopio/i)).toBeVisible({
      timeout: 5000,
    });

    // Export data (this should record backup date)
    await page.getByTestId('nav-settings').click();
    await navigateToSettingsSection(page, 'backupTransfer');
    const exportButton = page.getByTestId('export-data-button');
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();

    // Wait for export selection modal to open and click export button
    const exportModalButton = page.locator('button', {
      hasText: /^Export$|^Vie$/i,
    });
    await expect(exportModalButton).toBeVisible({ timeout: 5000 });
    await exportModalButton.click();

    // Wait for modal to close and backup date to be persisted
    await page
      .locator('[role="dialog"]')
      .waitFor({ state: 'hidden', timeout: 5000 });
    await page.waitForTimeout(1000);

    // Navigate back to Dashboard
    await page.getByTestId('nav-dashboard').click();
    await page.waitForLoadState('networkidle');
    await page
      .getByTestId('page-dashboard')
      .waitFor({ state: 'visible', timeout: 5000 });

    // Reminder should be gone (backup date was recorded)
    // The backup reminder logic checks if data was modified after backup
    // Since lastModified is old (31 days ago) and lastBackupDate is now (after export),
    // the condition lastModified <= lastBackupDate should be true, so reminder should not show
    await expect(page.getByText(/backup|Backup|varmuuskopio/i)).not.toBeVisible(
      {
        timeout: 5000,
      },
    );
  });

  test('should show reminder on dashboard when conditions are met', async ({
    page,
  }) => {
    // Setup with items and old modification date
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 35);

    const appData = createMockAppData({
      items: [
        {
          id: 'test-item-1',
          name: 'Test Item',
          categoryId: 'food',
          quantity: 5,
          unit: 'pieces',
          recommendedQuantity: 10,
          neverExpires: true,
          createdAt: oldDate.toISOString(),
          updatedAt: oldDate.toISOString(),
        },
      ],
      lastModified: oldDate.toISOString(),
      lastBackupDate: undefined,
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
    });

    await page.goto('/');
    await page.evaluate(
      ({ data, key }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      { data: appData, key: STORAGE_KEY },
    );
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Should see backup reminder in alerts section
    await expect(page.getByText(/backup|Backup|varmuuskopio/i)).toBeVisible({
      timeout: 5000,
    });

    // Should be in the alerts section
    await expect(page.getByTestId('alerts-section')).toBeVisible();
  });
});
