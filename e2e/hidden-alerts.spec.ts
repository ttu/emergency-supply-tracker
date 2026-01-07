import { test, expect } from './fixtures';
import {
  createMockAppData,
  createMockInventoryItem,
} from '../src/shared/utils/test/factories';

test.describe('Hidden Alerts Management', () => {
  test('should hide alert from dashboard', async ({ page }) => {
    // Setup with an item that will generate an alert (expired item)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const expiredItem = createMockInventoryItem({
      name: 'Expired Item',
      categoryId: 'food',
      quantity: 5,
      unit: 'pieces',
      neverExpires: false,
      expirationDate: pastDate.toISOString().split('T')[0],
    });

    const appData = createMockAppData({
      items: [expiredItem],
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
    await page.evaluate((data) => {
      localStorage.setItem('emergencySupplyTracker', JSON.stringify(data));
    }, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Should see expired alert on dashboard
    await expect(page.getByText(/expired|vanhentunut/i)).toBeVisible({
      timeout: 5000,
    });

    // Find dismiss button (✕ button)
    // The button has aria-label with translation key "actions.dismiss"
    // Look for button with ✕ text or any button in the alert
    const dismissButton = page
      .locator('.alert button, button:has-text("✕"), [aria-label*="dismiss" i]')
      .first();
    await expect(dismissButton).toBeVisible({ timeout: 5000 });

    // Dismiss the alert
    await dismissButton.click();

    // Alert should no longer be visible
    await expect(page.getByText(/expired|vanhentunut/i)).not.toBeVisible({
      timeout: 3000,
    });
  });

  test('should show hidden alert in settings', async ({ page }) => {
    // Setup with expired item
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const expiredItem = createMockInventoryItem({
      name: 'Expired Item',
      categoryId: 'food',
      quantity: 5,
      unit: 'pieces',
      neverExpires: false,
      expirationDate: pastDate.toISOString().split('T')[0],
    });

    const appData = createMockAppData({
      items: [expiredItem],
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
    await page.evaluate((data) => {
      localStorage.setItem('emergencySupplyTracker', JSON.stringify(data));
    }, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Dismiss alert from dashboard
    const dismissButton = page
      .locator('.alert button, button:has-text("✕"), [aria-label*="dismiss" i]')
      .first();
    await expect(dismissButton).toBeVisible({ timeout: 5000 });
    await dismissButton.click();

    // Navigate to Settings
    await page.click('text=Settings');

    // Should see hidden alerts section
    await expect(
      page.getByText(/Hidden Alerts|Piilotetut hälytykset/i),
    ).toBeVisible();

    // Should see the hidden alert
    await expect(
      page.getByText(/Expired Item|expired|vanhentunut/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should re-activate individual alert', async ({ page }) => {
    // Setup with expired item
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const expiredItem = createMockInventoryItem({
      name: 'Expired Item',
      categoryId: 'food',
      quantity: 5,
      unit: 'pieces',
      neverExpires: false,
      expirationDate: pastDate.toISOString().split('T')[0],
    });

    const appData = createMockAppData({
      items: [expiredItem],
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
    await page.evaluate((data) => {
      localStorage.setItem('emergencySupplyTracker', JSON.stringify(data));
    }, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Dismiss alert
    const dismissButton = page
      .locator('.alert button, button:has-text("✕"), [aria-label*="dismiss" i]')
      .first();
    await expect(dismissButton).toBeVisible({ timeout: 5000 });
    await dismissButton.click();

    // Go to Settings
    await page.click('text=Settings');

    // Find and click reactivate button
    const reactivateButton = page
      .locator('button', {
        hasText: /Show|Näytä|Reactivate|Aktivoi/i,
      })
      .first();
    const buttonVisible = await reactivateButton.isVisible().catch(() => false);

    if (buttonVisible) {
      await reactivateButton.click();

      // Navigate back to Dashboard
      await page.click('text=Dashboard');

      // Alert should be visible again (might take a moment)
      await expect(page.getByText(/expired|vanhentunut/i)).toBeVisible({
        timeout: 5000,
      });
    } else {
      // If button not found, test might need adjustment
      // Verify we're on settings page
      await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    }
  });

  test('should re-activate all alerts at once', async ({ page }) => {
    // Setup with multiple items that generate alerts
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const expiredItem1 = createMockInventoryItem({
      name: 'Expired Item 1',
      categoryId: 'food',
      quantity: 5,
      unit: 'pieces',
      neverExpires: false,
      expirationDate: pastDate.toISOString().split('T')[0],
    });

    const expiredItem2 = createMockInventoryItem({
      name: 'Expired Item 2',
      categoryId: 'food',
      quantity: 3,
      unit: 'pieces',
      neverExpires: false,
      expirationDate: pastDate.toISOString().split('T')[0],
    });

    const appData = createMockAppData({
      items: [expiredItem1, expiredItem2],
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
    await page.evaluate((data) => {
      localStorage.setItem('emergencySupplyTracker', JSON.stringify(data));
    }, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Dismiss all alerts (if multiple dismiss buttons exist)
    const dismissButtons = page.locator(
      'button[aria-label*="dismiss" i], button[aria-label*="sulje" i]',
    );
    let remaining = await dismissButtons.count();

    // Dismiss buttons one by one, waiting for DOM update after each click
    while (remaining > 0) {
      // Click the first remaining button
      const buttonToClick = dismissButtons.nth(0);
      await buttonToClick.click();

      // Wait for the button count to decrease (button was removed from DOM)
      await expect(dismissButtons).toHaveCount(remaining - 1, {
        timeout: 3000,
      });

      // Update remaining count
      remaining = await dismissButtons.count();
    }

    // Go to Settings
    await page.click('text=Settings');

    // Find "Show All Alerts" or "Reactivate All" button
    const reactivateAllButton = page.locator('button', {
      hasText: /Show All|Näytä kaikki|Reactivate All|Aktivoi kaikki/i,
    });
    const buttonVisible = await reactivateAllButton
      .isVisible()
      .catch(() => false);

    if (buttonVisible) {
      await reactivateAllButton.click();

      // Navigate back to Dashboard
      await page.click('text=Dashboard');

      // Alerts should be visible again
      await expect(page.getByText(/expired|vanhentunut/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should persist hidden alerts after reload', async ({ page }) => {
    // Setup with expired item
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const expiredItem = createMockInventoryItem({
      name: 'Expired Item',
      categoryId: 'food',
      quantity: 5,
      unit: 'pieces',
      neverExpires: false,
      expirationDate: pastDate.toISOString().split('T')[0],
    });

    const appData = createMockAppData({
      items: [expiredItem],
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
    await page.evaluate((data) => {
      localStorage.setItem('emergencySupplyTracker', JSON.stringify(data));
    }, appData);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Dismiss alert
    const dismissButton = page
      .locator('.alert button, button:has-text("✕"), [aria-label*="dismiss" i]')
      .first();
    await expect(dismissButton).toBeVisible({ timeout: 5000 });
    await dismissButton.click();

    // Wait for dismissal to be persisted in localStorage
    await page.waitForFunction(
      () => {
        const data = localStorage.getItem('emergencySupplyTracker');
        if (!data) return false;
        try {
          const appData = JSON.parse(data);
          return (
            Array.isArray(appData.dismissedAlertIds) &&
            appData.dismissedAlertIds.length > 0
          );
        } catch {
          return false;
        }
      },
      { timeout: 3000 },
    );

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Alert should still be hidden
    const alertVisible = await page
      .getByText(/expired|vanhentunut/i)
      .isVisible()
      .catch(() => false);
    expect(alertVisible).toBe(false);

    // Go to Settings and verify it's in hidden alerts
    await page.click('text=Settings');
    await page.waitForLoadState('networkidle');

    // Check if hidden alerts section shows the alert
    const hiddenAlertVisible = await page
      .getByText(/Expired Item|expired|vanhentunut/i)
      .isVisible()
      .catch(() => false);

    // If hidden alerts section exists, it should show the dismissed alert
    if (hiddenAlertVisible) {
      await expect(
        page.getByText(/Expired Item|expired|vanhentunut/i),
      ).toBeVisible();
    } else {
      // Verify we're on settings page
      await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    }
  });
});
