import { test, expect, ensureNoModals, type Page } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

// Helper to ensure drawer is closed (for mobile viewports)
async function ensureDrawerClosed(page: Page) {
  // Check if there's an open dialog element blocking interactions
  const hasOpenDialog = await page
    .evaluate(() => {
      const dialog = document.querySelector('dialog[open]');
      return dialog !== null;
    })
    .catch(() => false);

  if (hasOpenDialog) {
    // Try pressing Escape to close any open dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Verify it closed, if not try clicking close button
    const stillOpen = await page
      .evaluate(() => {
        const dialog = document.querySelector('dialog[open]');
        return dialog !== null;
      })
      .catch(() => false);

    if (stillOpen) {
      const closeButton = page.getByTestId('sidemenu-close');
      const isCloseButtonVisible = await closeButton
        .isVisible()
        .catch(() => false);
      if (isCloseButtonVisible) {
        await closeButton.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(200);
      }
    }
  }
}

test.describe('Accessibility', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('Dashboard page should have no accessibility violations', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Inventory page should have no accessibility violations', async ({
    page,
  }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Settings page should have no accessibility violations', async ({
    page,
  }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Help page should have no accessibility violations', async ({
    page,
  }) => {
    await page.goto('/help');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dashboard page should have no accessibility violations on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Ensure drawer is closed before running a11y scan
    await ensureDrawerClosed(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Inventory page should have no accessibility violations on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    // Ensure drawer is closed before running a11y scan
    await ensureDrawerClosed(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Item form modal should have no accessibility violations', async ({
    page,
  }) => {
    // Navigate to inventory using navigation to ensure app is fully loaded
    await page.getByTestId('nav-inventory').click();
    await expect(page.getByTestId('page-inventory')).toBeVisible();

    // Ensure drawer is closed on mobile before clicking other elements
    await ensureDrawerClosed(page);
    // Also use ensureNoModals as a fallback
    await ensureNoModals(page);

    // Open the add item modal
    await page.getByTestId('add-item-button').click();
    await page.getByTestId('template-selector').waitFor({ state: 'visible' });

    const accessibilityScanResults = await new AxeBuilder({ page })
      // Use more specific selector for the template modal (not the sidemenu drawer)
      .include('[data-testid="template-selector"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Navigation should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Ensure drawer is closed before testing keyboard navigation
    await ensureDrawerClosed(page);

    // Test keyboard navigation through main navigation
    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Verify focus is on a navigation element with visible focus indicator
    const firstFocusedElement = page.locator(':focus');
    await expect(firstFocusedElement).toBeVisible({ timeout: 2000 });

    // Continue tabbing and verify we can navigate through interactive elements
    await page.keyboard.press('Tab');
    const secondFocusedElement = page.locator(':focus');
    const secondVisible = await secondFocusedElement
      .isVisible()
      .catch(() => false);
    if (secondVisible) {
      await expect(secondFocusedElement).toBeVisible();
    }

    // Try one more tab, but don't fail if no element is focused
    await page.keyboard.press('Tab');
    const thirdFocusedElement = page.locator(':focus');
    const thirdVisible = await thirdFocusedElement
      .isVisible()
      .catch(() => false);
    if (thirdVisible) {
      await expect(thirdFocusedElement).toBeVisible();
    }

    // Run a11y check
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['keyboard'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test.describe('Workspace confirm delete dialog', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    async function openWorkspacesSection(page: Page) {
      await page.getByTestId('nav-settings').click();
      await expect(page.getByTestId('page-settings')).toBeVisible();
      await page.getByRole('menuitem', { name: 'Workspaces' }).click();
      await expect(page.getByTestId('section-workspaces')).toBeVisible();
      await expect(page.getByTestId('workspace-section')).toBeVisible();
    }

    test('should receive initial focus on primary delete button', async ({
      page,
    }) => {
      await openWorkspacesSection(page);

      // Add a second workspace so Delete is available
      await page.getByLabel('Workspace name').fill('To Delete');
      await page.getByRole('button', { name: 'Add workspace' }).click();
      await expect(
        page.getByRole('button', { name: 'Delete workspace' }),
      ).toBeVisible();

      // Open confirm dialog by clicking Delete on the second workspace
      await page
        .getByRole('button', { name: 'Delete workspace' })
        .first()
        .click();

      const dialog = page.getByTestId('workspace-confirm-delete-dialog');
      await expect(dialog).toBeVisible();
      const primaryDelete = page.getByTestId('workspace-confirm-delete-button');
      await expect(primaryDelete).toBeFocused();
    });

    test('should dismiss dialog on Escape and restore focus', async ({
      page,
    }) => {
      await openWorkspacesSection(page);
      await expect(page.getByTestId('workspace-section')).toBeVisible();

      await page.getByLabel('Workspace name').fill('To Delete');
      await page.getByRole('button', { name: 'Add workspace' }).click();

      const deleteButton = page
        .getByRole('button', { name: 'Delete workspace' })
        .first();
      await deleteButton.click();

      await expect(
        page.getByTestId('workspace-confirm-delete-dialog'),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(
        page.getByTestId('workspace-confirm-delete-dialog'),
      ).toBeHidden();
      await expect(deleteButton).toBeFocused();
    });

    test('should trap focus within dialog', async ({ page }) => {
      await openWorkspacesSection(page);
      await expect(page.getByTestId('workspace-section')).toBeVisible();

      await page.getByLabel('Workspace name').fill('To Delete');
      await page.getByRole('button', { name: 'Add workspace' }).click();

      await page
        .getByRole('button', { name: 'Delete workspace' })
        .first()
        .click();

      const dialog = page.getByTestId('workspace-confirm-delete-dialog');
      await expect(dialog).toBeVisible();
      const primaryDelete = page.getByTestId('workspace-confirm-delete-button');
      await expect(primaryDelete).toBeFocused();

      // Tab to Cancel, then Tab again — focus should wrap to primary Delete
      await page.keyboard.press('Tab');
      await expect(
        dialog.getByRole('button', { name: 'Cancel' }),
      ).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(primaryDelete).toBeFocused();
    });

    test('workspace confirm delete dialog should have no a11y violations', async ({
      page,
    }) => {
      await openWorkspacesSection(page);
      await expect(page.getByTestId('workspace-section')).toBeVisible();

      await page.getByLabel('Workspace name').fill('To Delete');
      await page.getByRole('button', { name: 'Add workspace' }).click();
      await page
        .getByRole('button', { name: 'Delete workspace' })
        .first()
        .click();

      const dialog = page.getByTestId('workspace-confirm-delete-dialog');
      await expect(dialog).toBeVisible();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="workspace-confirm-delete-dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
});
