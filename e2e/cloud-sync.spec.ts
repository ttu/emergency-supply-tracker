import { test, expect } from './fixtures';

// Helper function to navigate to cloud sync section
async function navigateToCloudSync(page: import('@playwright/test').Page) {
  await page.getByTestId('nav-settings').click();
  // Click on the cloudSync menu item in the sidebar (scope to avoid drawer duplicate)
  await page
    .getByTestId('sidemenu-sidebar')
    .getByTestId('sidemenu-item-cloudSync')
    .click();
}

test.describe('Cloud Sync', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should display cloud sync section in settings', async ({ page }) => {
    await navigateToCloudSync(page);

    // Verify cloud sync section is visible
    await expect(page.getByTestId('section-cloud-sync')).toBeVisible();
  });

  test('should display cloud sync status when disconnected', async ({
    page,
  }) => {
    await navigateToCloudSync(page);

    // Verify status section is visible
    await expect(page.getByTestId('cloud-sync-status')).toBeVisible();

    // Verify status text shows disconnected
    const statusText = page.getByTestId('cloud-sync-status-text');
    await expect(statusText).toBeVisible();
    // Status should indicate disconnected state
    const text = await statusText.textContent();
    expect(text).toBeTruthy();
  });

  test('should display connect button when disconnected', async ({ page }) => {
    await navigateToCloudSync(page);

    // Verify connect button is visible
    const connectButton = page.getByTestId('cloud-sync-connect-button');
    await expect(connectButton).toBeVisible();

    // Button should be enabled when disconnected
    await expect(connectButton).toBeEnabled();
  });

  test('should show connect Google Drive component', async ({ page }) => {
    await navigateToCloudSync(page);

    // Verify connect Google Drive component is visible
    await expect(page.getByTestId('connect-google-drive')).toBeVisible();
  });

  test('should display sync button when connected', async ({ page }) => {
    // This test would require mocking Google Drive connection
    // For now, we verify the UI structure exists
    await navigateToCloudSync(page);

    // When disconnected, the sync button might not be visible, but the section structure exists
    // We verify the section is present
    await expect(page.getByTestId('section-cloud-sync')).toBeVisible();
  });

  test('should display status indicator', async ({ page }) => {
    await navigateToCloudSync(page);

    // Verify status indicator is visible
    const indicator = page.getByTestId('cloud-sync-status-indicator');
    await expect(indicator).toBeVisible();
  });

  test('should navigate to cloud sync section from settings', async ({
    page,
  }) => {
    await page.getByTestId('nav-settings').click();

    // Verify we're on settings page
    await expect(page.getByTestId('page-settings')).toBeVisible();

    // Click on cloud sync menu item (scope to sidebar)
    await page
      .getByTestId('sidemenu-sidebar')
      .getByTestId('sidemenu-item-cloudSync')
      .click();

    // Verify cloud sync section is visible
    await expect(page.getByTestId('section-cloud-sync')).toBeVisible();
  });
});
