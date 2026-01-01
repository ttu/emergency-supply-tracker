import {
  createMockHousehold,
  createMockSettings,
  createMockCategory,
  createMockInventoryItem,
  createMockProductTemplate,
  createMockAppData,
} from './factories';

describe('factories', () => {
  describe('createMockHousehold', () => {
    it('creates default household', () => {
      const household = createMockHousehold();
      expect(household.adults).toBe(2);
      expect(household.children).toBe(1);
      expect(household.supplyDurationDays).toBe(7);
      expect(household.useFreezer).toBe(true);
    });

    it('applies overrides', () => {
      const household = createMockHousehold({ adults: 5, useFreezer: false });
      expect(household.adults).toBe(5);
      expect(household.useFreezer).toBe(false);
    });
  });

  describe('createMockSettings', () => {
    it('creates default settings', () => {
      const settings = createMockSettings();
      expect(settings.language).toBe('en');
      expect(settings.theme).toBe('light');
      expect(settings.highContrast).toBe(false);
    });

    it('applies overrides', () => {
      const settings = createMockSettings({ theme: 'dark' });
      expect(settings.theme).toBe('dark');
    });
  });

  describe('createMockCategory', () => {
    it('creates default category', () => {
      const category = createMockCategory();
      expect(category.id).toBe('test-category');
      expect(category.isCustom).toBe(true);
    });
  });

  describe('createMockInventoryItem', () => {
    it('creates default item', () => {
      const item = createMockInventoryItem();
      expect(item.id).toBe('test-item-1');
      expect(item.quantity).toBe(10);
    });
  });

  describe('createMockProductTemplate', () => {
    it('creates default template', () => {
      const template = createMockProductTemplate();
      expect(template.id).toBe('test-template');
      expect(template.name).toBe('Test Template');
      expect(template.category).toBe('food');
      expect(template.defaultUnit).toBe('pieces');
      expect(template.isBuiltIn).toBe(false);
      expect(template.isCustom).toBe(true);
    });

    it('applies overrides', () => {
      const template = createMockProductTemplate({
        id: 'custom-id',
        isBuiltIn: true,
      });
      expect(template.id).toBe('custom-id');
      expect(template.isBuiltIn).toBe(true);
    });
  });

  describe('createMockAppData', () => {
    it('creates default app data', () => {
      const appData = createMockAppData();
      expect(appData.version).toBe('1.0.0');
      expect(appData.items).toEqual([]);
      expect(appData.customCategories).toEqual([]);
    });

    it('applies overrides', () => {
      const appData = createMockAppData({ version: '2.0.0' });
      expect(appData.version).toBe('2.0.0');
    });
  });
});
