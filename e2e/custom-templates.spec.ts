import { test, expect, navigateToSettingsSection } from './fixtures';

/**
 * In design v2 the template-selector modal is gone and inventory items
 * are always custom. Custom templates are managed under Settings →
 * Custom Kits (§7.4) rather than appearing inside the inventory flow.
 *
 * v1 tests that exercised "add item from template" or "show template in
 * inventory search" have no v2 equivalent; the remaining test verifies
 * the v2 Custom Templates panel renders.
 */

test.describe('Custom Product Templates', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should expose the Custom Templates panel under Settings → Custom Kits', async ({
    page,
  }) => {
    await navigateToSettingsSection(page, 'recommendations');
    // CustomKitsSection (containing CUSTOM TEMPLATES) renders right after
    // §7 Recommendations but is not in the scroll-spy id list — use
    // toBeAttached so we don't require it in the viewport.
    await expect(
      page.getByText('CUSTOM TEMPLATES', { exact: true }),
    ).toBeAttached();
  });
});
