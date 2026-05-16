import {
  test,
  expect,
  setAppStorage,
  navigateToSettingsSection,
  toLocalDateString,
} from './fixtures';
import {
  createMockAppData,
  createMockInventoryItem,
} from '../src/shared/utils/test/factories';
import { createDateOnly } from '../src/shared/types';

/**
 * In design v2 the backup reminder surfaces on the Alerts page (via
 * useDashboardAlerts), not as a dashboard banner. Each test sets the
 * mock app data + navigates to v2-nav-alerts.
 */

const v2Settings = {
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

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

test.describe('Backup Reminder', () => {
  test('should show backup reminder after 30 days without backup', async ({
    page,
  }) => {
    const old = daysAgo(31);
    const appData = createMockAppData({
      items: [
        createMockInventoryItem({
          name: 'Test Item',
          neverExpires: true,
          createdAt: old.toISOString(),
          updatedAt: old.toISOString(),
        }),
      ],
      lastModified: old.toISOString(),
      lastBackupDate: undefined,
      settings: v2Settings,
    });

    await page.goto('/');
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await page.getByTestId('v2-nav-alerts').click();
    await expect(
      page.getByText(/backup|Backup|varmuuskopio/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should dismiss backup reminder', async ({ page }) => {
    const old = daysAgo(31);
    const appData = createMockAppData({
      items: [
        createMockInventoryItem({
          name: 'Test Item',
          neverExpires: true,
          createdAt: old.toISOString(),
          updatedAt: old.toISOString(),
        }),
      ],
      lastModified: old.toISOString(),
      lastBackupDate: undefined,
      settings: v2Settings,
    });

    await page.goto('/');
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await page.getByTestId('v2-nav-alerts').click();
    const reminder = page.getByText(/backup|Backup|varmuuskopio/i).first();
    await expect(reminder).toBeVisible({ timeout: 5000 });

    // v2 Alerts row has a "DISMISS" button (cockpit voice).
    const dismiss = page
      .getByRole('button', { name: /DISMISS|Dismiss/ })
      .first();
    await expect(dismiss).toBeVisible({ timeout: 5000 });
    await dismiss.click();

    await expect(reminder).not.toBeVisible({ timeout: 3000 });
  });

  test('should not show reminder after dismissal until next month', async ({
    page,
  }) => {
    const old = daysAgo(31);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);

    const appData = createMockAppData({
      items: [
        createMockInventoryItem({
          name: 'Test Item',
          neverExpires: true,
          createdAt: old.toISOString(),
          updatedAt: old.toISOString(),
        }),
      ],
      lastModified: old.toISOString(),
      lastBackupDate: undefined,
      backupReminderDismissedUntil: createDateOnly(
        toLocalDateString(nextMonth),
      ),
      settings: v2Settings,
    });

    await page.goto('/');
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await page.getByTestId('v2-nav-alerts').click();
    await expect(page.getByText(/backup|varmuuskopio/i)).not.toBeVisible({
      timeout: 3000,
    });
  });

  test('should remove reminder when backup date is recorded', async ({
    page,
  }) => {
    const old = daysAgo(31);
    const appData = createMockAppData({
      items: [
        createMockInventoryItem({
          name: 'Test Item',
          neverExpires: true,
          createdAt: old.toISOString(),
          updatedAt: old.toISOString(),
        }),
      ],
      lastModified: old.toISOString(),
      lastBackupDate: undefined,
      settings: v2Settings,
    });

    await page.goto('/');
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Reminder visible on Alerts page
    await page.getByTestId('v2-nav-alerts').click();
    await expect(
      page.getByText(/backup|Backup|varmuuskopio/i).first(),
    ).toBeVisible({ timeout: 5000 });

    // Trigger an export (records lastBackupDate)
    await navigateToSettingsSection(page, 'data');
    const exportButton = page.getByTestId('export-data-button');
    await expect(exportButton).toBeVisible({ timeout: 10000 });
    await exportButton.click();

    // Format-selection modal opens; click the primary Export button.
    const exportModalButton = page.locator('button', {
      hasText: /^Export$|^Vie$/i,
    });
    await expect(exportModalButton).toBeVisible({ timeout: 5000 });
    await exportModalButton.click();
    await page.waitForTimeout(500);

    // Back to alerts — reminder gone.
    await page.getByTestId('v2-nav-alerts').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/backup|varmuuskopio/i)).not.toBeVisible({
      timeout: 3000,
    });
  });

  test('should surface the reminder under the v2 Alerts page', async ({
    page,
  }) => {
    const old = daysAgo(35);
    const appData = createMockAppData({
      items: [
        createMockInventoryItem({
          name: 'Test Item',
          neverExpires: true,
          createdAt: old.toISOString(),
          updatedAt: old.toISOString(),
        }),
      ],
      lastModified: old.toISOString(),
      lastBackupDate: undefined,
      settings: v2Settings,
    });

    await page.goto('/');
    await setAppStorage(page, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await page.getByTestId('v2-nav-alerts').click();
    await expect(page.getByText('ALERTS · LOG')).toBeVisible();
    await expect(
      page.getByText(/backup|Backup|varmuuskopio/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
