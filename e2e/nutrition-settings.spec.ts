import { test, expect } from './fixtures';

test.describe('Nutrition Settings', () => {
  test.beforeEach(async ({ setupApp }) => {
    await setupApp();
  });

  test('should change daily calories per person', async ({ page }) => {
    await page.getByTestId('nav-settings').click();

    // Navigate to nutrition section
    await page.getByTestId('sidemenu-item-nutrition').click();
    await expect(page.getByTestId('section-nutrition')).toBeVisible();

    // Find daily calories input
    const caloriesInput = page.locator('#daily-calories');
    await expect(caloriesInput).toBeVisible();

    // Change calories
    await caloriesInput.fill('2500');
    await caloriesInput.blur(); // Trigger onChange

    // Verify value changed
    const newValue = await caloriesInput.inputValue();
    expect(newValue).toBe('2500');
  });

  test('should change daily water per person', async ({ page }) => {
    await page.getByTestId('nav-settings').click();

    // Navigate to nutrition section
    await page.getByTestId('sidemenu-item-nutrition').click();
    await expect(page.getByTestId('section-nutrition')).toBeVisible();

    // Find daily water input
    const waterInput = page.locator('#daily-water');
    await expect(waterInput).toBeVisible();

    // Change water
    await waterInput.fill('4');
    await waterInput.blur();

    // Verify value changed
    const newValue = await waterInput.inputValue();
    expect(newValue).toBe('4');
  });

  test('should change children requirement percentage', async ({ page }) => {
    await page.getByTestId('nav-settings').click();

    // Navigate to nutrition section
    await page.getByTestId('sidemenu-item-nutrition').click();
    await expect(page.getByTestId('section-nutrition')).toBeVisible();

    // Find children percentage input
    const childrenInput = page.locator('#children-percentage');
    await expect(childrenInput).toBeVisible();

    // Change percentage
    await childrenInput.fill('80');
    await childrenInput.blur();

    // Verify value changed
    const newValue = await childrenInput.inputValue();
    expect(newValue).toBe('80');
  });

  test('should persist nutrition settings after reload', async ({ page }) => {
    await page.getByTestId('nav-settings').click();

    // Navigate to nutrition section
    await page.getByTestId('sidemenu-item-nutrition').click();
    await expect(page.getByTestId('section-nutrition')).toBeVisible();

    // Change all nutrition settings
    const caloriesInput = page.locator('#daily-calories');
    const waterInput = page.locator('#daily-water');
    const childrenInput = page.locator('#children-percentage');

    await caloriesInput.fill('2200');
    await caloriesInput.blur();
    await waterInput.fill('3.5');
    await waterInput.blur();
    await childrenInput.fill('70');
    await childrenInput.blur();

    // Wait for settings to save
    await page.waitForTimeout(500);

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Verify settings persisted
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('sidemenu-item-nutrition').click();
    await page.waitForLoadState('networkidle');

    expect(await page.locator('#daily-calories').inputValue()).toBe('2200');
    expect(await page.locator('#daily-water').inputValue()).toBe('3.5');
    expect(await page.locator('#children-percentage').inputValue()).toBe('70');
  });

  test('should clamp values to valid ranges', async ({ page }) => {
    await page.getByTestId('nav-settings').click();

    // Navigate to nutrition section
    await page.getByTestId('sidemenu-item-nutrition').click();
    await expect(page.getByTestId('section-nutrition')).toBeVisible();

    const caloriesInput = page.locator('#daily-calories');
    const waterInput = page.locator('#daily-water');
    const childrenInput = page.locator('#children-percentage');

    // Test minimum clamping
    await caloriesInput.fill('500');
    await caloriesInput.blur();
    // Should clamp to minimum (1000)
    const caloriesValue = await caloriesInput.inputValue();
    expect(Number.parseInt(caloriesValue, 10)).toBeGreaterThanOrEqual(1000);

    // Test maximum clamping
    await caloriesInput.fill('10000');
    await caloriesInput.blur();
    // Should clamp to maximum (5000)
    const maxCaloriesValue = await caloriesInput.inputValue();
    expect(Number.parseInt(maxCaloriesValue, 10)).toBeLessThanOrEqual(5000);

    // Test water minimum
    await waterInput.fill('0.5');
    await waterInput.blur();
    const waterValue = await waterInput.inputValue();
    expect(Number.parseFloat(waterValue)).toBeGreaterThanOrEqual(1);

    // Test children percentage range
    await childrenInput.fill('10');
    await childrenInput.blur();
    const childrenValue = await childrenInput.inputValue();
    expect(Number.parseInt(childrenValue, 10)).toBeGreaterThanOrEqual(25);
  });

  test('should reset to defaults', async ({ page }) => {
    await page.getByTestId('nav-settings').click();

    // Navigate to nutrition section
    await page.getByTestId('sidemenu-item-nutrition').click();
    await expect(page.getByTestId('section-nutrition')).toBeVisible();

    // Change values
    const caloriesInput = page.locator('#daily-calories');
    const waterInput = page.locator('#daily-water');
    const childrenInput = page.locator('#children-percentage');

    await caloriesInput.fill('3000');
    await caloriesInput.blur();
    await waterInput.fill('5');
    await waterInput.blur();
    await childrenInput.fill('90');
    await childrenInput.blur();

    // Find and click reset button
    const resetButton = page.locator('button', {
      hasText: /Reset to Defaults|Palauta oletusarvot/i,
    });
    await expect(resetButton).toBeVisible();
    await resetButton.click();

    // Verify values reset to defaults
    // Defaults: 2000 kcal, 3 liters, 75%
    const caloriesValue = await caloriesInput.inputValue();
    const waterValue = await waterInput.inputValue();
    const childrenValue = await childrenInput.inputValue();

    expect(Number.parseInt(caloriesValue, 10)).toBe(2000);
    expect(Number.parseFloat(waterValue)).toBe(3);
    expect(Number.parseInt(childrenValue, 10)).toBe(75);
  });
});
