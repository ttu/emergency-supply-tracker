import {
  createMockHousehold,
  createMockSettings,
  createMockCategory,
  createMockInventoryItem,
  createMockProductTemplate,
  createMockAppData,
} from './factories';
import { VALID_THEMES } from '@/shared/types';
import { createProductTemplateId } from '@/shared/types';

describe('factories', () => {
  describe('createMockHousehold', () => {
    it('creates valid household with random data', () => {
      const household = createMockHousehold();
      expect(household.adults).toBeGreaterThanOrEqual(1);
      expect(household.adults).toBeLessThanOrEqual(5);
      expect(household.children).toBeGreaterThanOrEqual(0);
      expect(household.children).toBeLessThanOrEqual(4);
      expect(household.supplyDurationDays).toBeGreaterThanOrEqual(3);
      expect(household.supplyDurationDays).toBeLessThanOrEqual(14);
      expect(typeof household.useFreezer).toBe('boolean');
    });

    it('applies overrides', () => {
      const household = createMockHousehold({ adults: 5, useFreezer: false });
      expect(household.adults).toBe(5);
      expect(household.useFreezer).toBe(false);
    });
  });

  describe('createMockSettings', () => {
    it('creates valid settings with random data', () => {
      const settings = createMockSettings();
      expect(['en', 'fi']).toContain(settings.language);
      expect(VALID_THEMES).toContain(settings.theme);
      expect(typeof settings.highContrast).toBe('boolean');
      expect(typeof settings.advancedFeatures.calorieTracking).toBe('boolean');
      expect(typeof settings.advancedFeatures.powerManagement).toBe('boolean');
      expect(typeof settings.advancedFeatures.waterTracking).toBe('boolean');
    });

    it('applies overrides', () => {
      const settings = createMockSettings({ theme: 'dark' });
      expect(settings.theme).toBe('dark');
    });
  });

  describe('createMockCategory', () => {
    it('creates valid category with random data', () => {
      const category = createMockCategory();
      expect(category.id).toBeDefined();
      expect(typeof category.name).toBe('string');
      expect(category.name.length).toBeGreaterThan(0);
      expect(typeof category.icon).toBe('string');
      expect(typeof category.isCustom).toBe('boolean');
    });
  });

  describe('createMockInventoryItem', () => {
    it('creates valid item with random data', () => {
      const item = createMockInventoryItem();
      expect(item.id).toBeDefined();
      expect(typeof item.name).toBe('string');
      expect(item.name.length).toBeGreaterThan(0);
      expect(typeof item.quantity).toBe('number');
      expect(item.quantity).toBeGreaterThanOrEqual(0);
      expect(typeof item.unit).toBe('string');
      expect(typeof item.recommendedQuantity).toBe('number');
      expect(item.recommendedQuantity).toBeGreaterThanOrEqual(0);
      expect(typeof item.createdAt).toBe('string');
      expect(typeof item.updatedAt).toBe('string');
    });
  });

  describe('createMockProductTemplate', () => {
    it('creates valid template with random data', () => {
      const template = createMockProductTemplate();
      expect(template.id).toBeDefined();
      expect(typeof template.name).toBe('string');
      expect(template.name?.length ?? 0).toBeGreaterThan(0);
      expect(typeof template.category).toBe('string');
      expect(typeof template.defaultUnit).toBe('string');
      expect(typeof template.isBuiltIn).toBe('boolean');
      expect(typeof template.isCustom).toBe('boolean');
    });

    it('applies overrides', () => {
      const template = createMockProductTemplate({
        id: createProductTemplateId('custom-id'),
        isBuiltIn: true,
      });
      expect(template.id).toBe(createProductTemplateId('custom-id'));
      expect(template.isBuiltIn).toBe(true);
    });
  });

  describe('createMockAppData', () => {
    it('creates valid app data with random data', () => {
      const appData = createMockAppData();
      expect(typeof appData.version).toBe('string');
      expect(appData.household).toBeDefined();
      expect(appData.settings).toBeDefined();
      expect(Array.isArray(appData.items)).toBe(true);
      expect(Array.isArray(appData.customCategories)).toBe(true);
      expect(Array.isArray(appData.customTemplates)).toBe(true);
      expect(Array.isArray(appData.dismissedAlertIds)).toBe(true);
      expect(Array.isArray(appData.disabledRecommendedItems)).toBe(true);
      expect(typeof appData.lastModified).toBe('string');
    });

    it('applies overrides', () => {
      const appData = createMockAppData({ version: '2.0.0' });
      expect(appData.version).toBe('2.0.0');
    });
  });
});
