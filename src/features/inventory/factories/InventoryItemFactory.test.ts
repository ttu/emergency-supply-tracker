import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  InventoryItemFactory,
  InventoryItemValidationError,
  type CreateItemInput,
  type CreateFromFormInput,
} from './InventoryItemFactory';
import {
  createCategoryId,
  createProductTemplateId,
  createItemId,
  createDateOnly,
  createQuantity,
  type HouseholdConfig,
  type ProductTemplateId,
  type Quantity,
} from '@/shared/types';
import {
  createMockHousehold,
  createMockRecommendedItem,
} from '@/shared/utils/test/factories';
import { randomQuantitySmall } from '@/shared/utils/test/faker-helpers';
import { faker } from '@faker-js/faker';
import { CUSTOM_ITEM_TYPE } from '@/shared/utils/constants';

// Mock crypto.randomUUID
const mockUUID = 'test-uuid-123';
vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
  mockUUID as `${string}-${string}-${string}-${string}-${string}`,
);

describe('InventoryItemFactory', () => {
  let validInput: CreateItemInput;
  let household: HouseholdConfig;

  beforeEach(() => {
    household = createMockHousehold();

    const quantity = createQuantity(randomQuantitySmall());
    validInput = {
      name: 'Test Item',
      itemType: createProductTemplateId('test-item'),
      categoryId: createCategoryId('food'),
      quantity,
      unit: 'pieces',
      neverExpires: false,
      expirationDate: createDateOnly('2025-12-31'),
    };
  });

  describe('create', () => {
    it('creates a valid inventory item with all required fields', () => {
      const item = InventoryItemFactory.create(validInput);

      expect(item.id).toBeDefined();
      expect(item.name).toBe('Test Item');
      expect(item.itemType).toBe('test-item');
      expect(item.categoryId).toBe(validInput.categoryId);
      expect(item.quantity).toBe(validInput.quantity);
      expect(item.unit).toBe('pieces');
      // recommendedQuantity is no longer stored, calculated dynamically
      expect(item.expirationDate).toBe(createDateOnly('2025-12-31'));
      expect(item.neverExpires).toBe(false);
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
      expect(item.createdAt).toBe(item.updatedAt);
    });

    it('trims name whitespace', () => {
      const item = InventoryItemFactory.create({
        ...validInput,
        name: '  Test Item  ',
      });

      expect(item.name).toBe('Test Item');
    });

    it('handles optional fields', () => {
      const weightGrams = faker.number.int({ min: 50, max: 500 });
      const caloriesPerUnit = faker.number.int({ min: 100, max: 500 });
      const item = InventoryItemFactory.create({
        ...validInput,
        location: '  Pantry  ',
        notes: '  Test notes  ',
        weightGrams,
        caloriesPerUnit,
      });

      expect(item.location).toBe('Pantry');
      expect(item.notes).toBe('Test notes');
      expect(item.weightGrams).toBe(weightGrams);
      expect(item.caloriesPerUnit).toBe(caloriesPerUnit);
    });

    it('sets optional fields to undefined when empty strings', () => {
      const item = InventoryItemFactory.create({
        ...validInput,
        location: '   ',
        notes: '',
      });

      expect(item.location).toBeUndefined();
      expect(item.notes).toBeUndefined();
    });

    it('handles neverExpires=true correctly', () => {
      const item = InventoryItemFactory.create({
        ...validInput,
        neverExpires: true,
        expirationDate: undefined,
      });

      expect(item.neverExpires).toBe(true);
      expect(item.expirationDate).toBeUndefined();
    });

    // Validation tests
    it('throws error when name is empty', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          name: '',
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when name is only whitespace', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          name: '   ',
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when itemType is missing', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          itemType: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when itemType is empty', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          itemType: '',
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when itemType is only whitespace', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          itemType: '   ',
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when categoryId is missing', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          categoryId: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when quantity is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // Use type assertion to test factory validation (bypassing branded type validation)
          quantity: -1 as unknown as Quantity,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when quantity is missing', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          quantity: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when quantity is undefined', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          quantity: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    // recommendedQuantity is no longer stored in InventoryItem
    // It is calculated dynamically from recommended items

    it('throws error when unit is missing', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          unit: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when unit is undefined', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          unit: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when unit is invalid', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          // @ts-expect-error - Testing invalid input
          unit: 'invalid-unit',
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when neverExpires is false but expirationDate is missing', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          neverExpires: false,
          expirationDate: undefined,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when neverExpires is true but expirationDate is provided', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          neverExpires: true,
          expirationDate: createDateOnly('2025-12-31'),
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when weightGrams is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          weightGrams: -1,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when caloriesPerUnit is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          caloriesPerUnit: -1,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when requiresWaterLiters is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          requiresWaterLiters: -1,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when capacityMah is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          capacityMah: -1,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('throws error when capacityWh is negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          ...validInput,
          capacityWh: -1,
        });
      }).toThrow(InventoryItemValidationError);
    });

    it('allows zero for numeric fields', () => {
      const item = InventoryItemFactory.create({
        ...validInput,
        quantity: createQuantity(0),
        weightGrams: 0,
        caloriesPerUnit: 0,
      });

      expect(item.quantity).toBe(0);
      // recommendedQuantity is no longer stored, calculated dynamically
      expect(item.weightGrams).toBe(0);
      expect(item.caloriesPerUnit).toBe(0);
    });
  });

  describe('createFromTemplate', () => {
    it('creates item from template without storing recommended quantity', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('water'),
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: createQuantity(3),
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const item = InventoryItemFactory.createFromTemplate(template, household);

      expect(item.name).toBe('products.water'); // Will be translated by caller
      expect(item.itemType).toBe('water');
      expect(item.categoryId).toBe(createCategoryId('water-beverages'));
      expect(item.quantity).toBe(0); // Default
      expect(item.unit).toBe('liters');
      // recommendedQuantity is no longer stored, calculated dynamically at runtime
      // itemType is set to template.id when created from template
      expect(item.neverExpires).toBe(true); // No defaultExpirationMonths
      expect(item.expirationDate).toBeUndefined();
    });

    it('calculates expiration date from defaultExpirationMonths', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('canned-food'),
        i18nKey: 'products.canned-food',
        category: 'food',
        baseQuantity: createQuantity(1),
        unit: 'cans',
        scaleWithPeople: true,
        scaleWithDays: true,
        defaultExpirationMonths: 12,
      });

      const item = InventoryItemFactory.createFromTemplate(template, household);

      expect(item.neverExpires).toBe(false);
      expect(item.expirationDate).toBeDefined();
      expect(item.expirationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO date format
    });

    it('uses provided name override', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('water'),
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: createQuantity(3),
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const item = InventoryItemFactory.createFromTemplate(
        template,
        household,
        {
          name: 'Drinking Water',
        },
      );

      expect(item.name).toBe('Drinking Water');
    });

    it('uses provided quantity override', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('water'),
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: createQuantity(3),
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const quantity = createQuantity(randomQuantitySmall());
      const item = InventoryItemFactory.createFromTemplate(
        template,
        household,
        {
          quantity,
        },
      );

      expect(item.quantity).toBe(quantity);
    });

    it('uses provided expirationDate override', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('canned-food'),
        i18nKey: 'products.canned-food',
        category: 'food',
        baseQuantity: createQuantity(1),
        unit: 'cans',
        scaleWithPeople: true,
        scaleWithDays: true,
        defaultExpirationMonths: 12,
      });

      const customDate = createDateOnly('2026-12-31');
      const item = InventoryItemFactory.createFromTemplate(
        template,
        household,
        {
          expirationDate: customDate,
        },
      );

      expect(item.expirationDate).toBe(customDate);
    });

    it('copies template properties (weightGrams, caloriesPerUnit, etc.)', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('canned-food'),
        i18nKey: 'products.canned-food',
        category: 'food',
        baseQuantity: createQuantity(1),
        unit: 'cans',
        scaleWithPeople: true,
        scaleWithDays: true,
        weightGramsPerUnit: 400,
        caloriesPerUnit: 200,
        requiresWaterLiters: 0.5,
        capacityMah: 10000,
        capacityWh: 37,
      });

      const item = InventoryItemFactory.createFromTemplate(template, household);

      expect(item.weightGrams).toBe(400);
      expect(item.caloriesPerUnit).toBe(200);
      expect(item.requiresWaterLiters).toBe(0.5);
      expect(item.capacityMah).toBe(10000);
      expect(item.capacityWh).toBe(37);
    });

    it('handles template without scaling', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('flashlight'),
        i18nKey: 'products.flashlight',
        category: 'light-power',
        baseQuantity: createQuantity(1),
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
      });

      const item = InventoryItemFactory.createFromTemplate(template, household);

      // recommendedQuantity is no longer stored, calculated dynamically
      // itemType is set to template.id when created from template
      expect(item.itemType).toBe(template.id);
    });

    it('uses custom childrenMultiplier option (stored for future use)', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('water'),
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: createQuantity(3),
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const item = InventoryItemFactory.createFromTemplate(
        template,
        household,
        {
          childrenMultiplier: 0.5,
        },
      );

      // recommendedQuantity is no longer stored, calculated dynamically
      // childrenMultiplier option is kept for API compatibility
      // itemType is set to template.id when created from template
      expect(item.itemType).toBe(template.id);
    });
  });

  describe('createDraftFromTemplate', () => {
    it('creates draft item with empty id and timestamps', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('water'),
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: createQuantity(3),
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const draft = InventoryItemFactory.createDraftFromTemplate(
        template,
        household,
      );

      // Draft should have empty id/timestamps
      expect(draft.id).toBe(createItemId(''));
      expect(draft.createdAt).toBe('');
      expect(draft.updatedAt).toBe('');

      // But should have all other fields calculated correctly
      expect(draft.name).toBe('products.water');
      expect(draft.itemType).toBe('water');
      expect(draft.categoryId).toBe(createCategoryId('water-beverages'));
      // recommendedQuantity is no longer stored, calculated dynamically
    });

    it('creates draft with same data as createFromTemplate except id/timestamps', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('flashlight'),
        i18nKey: 'products.flashlight',
        category: 'light-power',
        baseQuantity: createQuantity(1),
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
      });

      const fullItem = InventoryItemFactory.createFromTemplate(
        template,
        household,
      );
      const draft = InventoryItemFactory.createDraftFromTemplate(
        template,
        household,
      );

      // Compare all fields except id/timestamps
      expect(draft.name).toBe(fullItem.name);
      expect(draft.itemType).toBe(fullItem.itemType);
      expect(draft.categoryId).toBe(fullItem.categoryId);
      expect(draft.quantity).toBe(fullItem.quantity);
      expect(draft.unit).toBe(fullItem.unit);
      // recommendedQuantity is no longer stored, calculated dynamically

      // But id/timestamps should be different
      expect(draft.id).not.toBe(fullItem.id);
      expect(draft.id).toBe(createItemId(''));
      expect(draft.createdAt).toBe('');
      expect(draft.updatedAt).toBe('');
    });

    it('respects options like createFromTemplate', () => {
      const template = createMockRecommendedItem({
        id: createProductTemplateId('water'),
        i18nKey: 'products.water',
        category: 'water-beverages',
        baseQuantity: createQuantity(3),
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      });

      const quantity = createQuantity(randomQuantitySmall());
      const draft = InventoryItemFactory.createDraftFromTemplate(
        template,
        household,
        {
          name: 'Custom Water',
          quantity,
        },
      );

      expect(draft.name).toBe('Custom Water');
      expect(draft.quantity).toBe(quantity);
      expect(draft.id).toBe(createItemId(''));
    });
  });

  describe('createDraftFromCustomTemplate', () => {
    it('creates draft item with empty id and timestamps from custom template', () => {
      const customTemplate = {
        id: createProductTemplateId('my-custom-item'),
        name: 'My Custom Item',
        category: 'food',
        defaultUnit: 'pieces' as const,
        isBuiltIn: false,
        isCustom: true,
      };

      const draft =
        InventoryItemFactory.createDraftFromCustomTemplate(customTemplate);

      // Draft should have empty id/timestamps
      expect(draft.id).toBe(createItemId(''));
      expect(draft.createdAt).toBe('');
      expect(draft.updatedAt).toBe('');

      // Should have template data
      expect(draft.name).toBe('My Custom Item');
      expect(draft.itemType).toBe('my-custom-item');
      expect(draft.categoryId).toBe(createCategoryId('food'));
      expect(draft.unit).toBe('pieces');
      expect(draft.quantity).toBe(0);
      expect(draft.neverExpires).toBe(true);
    });

    it('respects quantity option', () => {
      const customTemplate = {
        id: createProductTemplateId('custom-water'),
        name: 'Custom Water',
        category: 'water-beverages',
        defaultUnit: 'liters' as const,
        isBuiltIn: false,
        isCustom: true,
      };

      const draft = InventoryItemFactory.createDraftFromCustomTemplate(
        customTemplate,
        { quantity: 5 },
      );

      expect(draft.quantity).toBe(5);
      expect(draft.unit).toBe('liters');
    });

    it('defaults to pieces when defaultUnit is invalid', () => {
      const customTemplate = {
        id: createProductTemplateId('no-unit'),
        name: 'No Unit Item',
        category: 'tools-supplies',
        defaultUnit: undefined as unknown as 'pieces',
        isBuiltIn: false,
        isCustom: true,
      };

      const draft =
        InventoryItemFactory.createDraftFromCustomTemplate(customTemplate);

      expect(draft.unit).toBe('pieces');
    });

    it('handles empty template name', () => {
      const customTemplate = {
        id: createProductTemplateId('empty-name'),
        name: '',
        category: 'food',
        defaultUnit: 'pieces' as const,
        isBuiltIn: false,
        isCustom: true,
      };

      const draft =
        InventoryItemFactory.createDraftFromCustomTemplate(customTemplate);

      expect(draft.name).toBe('');
    });

    it('copies neverExpires, weightGrams, caloriesPerUnit, requiresWaterLiters from template', () => {
      const customTemplate = {
        id: createProductTemplateId('canned-soup'),
        name: 'Canned Soup',
        category: 'food',
        defaultUnit: 'cans' as const,
        neverExpires: false,
        weightGrams: 400,
        caloriesPerUnit: 200,
        requiresWaterLiters: 0.5,
        isBuiltIn: false,
        isCustom: true,
      };

      const draft =
        InventoryItemFactory.createDraftFromCustomTemplate(customTemplate);

      expect(draft.neverExpires).toBe(false);
      expect(draft.weightGrams).toBe(400);
      expect(draft.caloriesPerUnit).toBe(200);
      expect(draft.requiresWaterLiters).toBe(0.5);
    });
  });

  describe('createFromFormData', () => {
    it('creates item from form data', () => {
      const quantity = createQuantity(randomQuantitySmall());
      const weightGrams = faker.number.int({ min: 50, max: 500 });
      const caloriesPerUnit = faker.number.int({ min: 100, max: 500 });
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'test-item',
        categoryId: 'food',
        quantity,
        unit: 'pieces',
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
        location: 'Pantry',
        notes: 'Test notes',
        weightGrams,
        caloriesPerUnit,
      };

      const item = InventoryItemFactory.createFromFormData(formData);

      expect(item.name).toBe('Test Item');
      expect(item.itemType).toBe('test-item');
      expect(item.categoryId).toBe(createCategoryId('food'));
      expect(item.quantity).toBe(quantity);
      expect(item.unit).toBe('pieces');
      // recommendedQuantity is no longer stored, calculated dynamically
      expect(item.expirationDate).toBe(createDateOnly('2025-12-31'));
      expect(item.neverExpires).toBe(false);
      expect(item.location).toBe('Pantry');
      expect(item.notes).toBe('Test notes');
      expect(item.weightGrams).toBe(weightGrams);
      expect(item.caloriesPerUnit).toBe(caloriesPerUnit);
    });

    it('uses CUSTOM_ITEM_TYPE when itemType is empty', () => {
      const quantity = createQuantity(randomQuantitySmall());
      const formData: CreateFromFormInput = {
        name: 'Custom Item',
        itemType: '',
        categoryId: 'food',
        quantity,
        unit: 'pieces',
        neverExpires: true,
      };

      const item = InventoryItemFactory.createFromFormData(formData);

      expect(item.itemType).toBe(CUSTOM_ITEM_TYPE);
    });

    it('handles neverExpires=true correctly', () => {
      const quantity = createQuantity(randomQuantitySmall());
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'test-item',
        categoryId: 'food',
        quantity,
        unit: 'pieces',
        neverExpires: true,
        expirationDate: createDateOnly('2025-12-31'), // Should be ignored
      };

      const item = InventoryItemFactory.createFromFormData(formData);

      expect(item.neverExpires).toBe(true);
      expect(item.expirationDate).toBeUndefined();
    });

    it('handles empty expiration date string by converting to undefined', () => {
      const quantity = createQuantity(randomQuantitySmall());
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'test-item',
        categoryId: 'food',
        quantity,
        unit: 'pieces',
        neverExpires: false,
        // @ts-expect-error - Testing invalid input (empty string)
        expirationDate: '', // Empty string - this will fail validation, but tests the code path
      };

      // This should throw validation error, but tests that empty string is converted to undefined
      expect(() => {
        InventoryItemFactory.createFromFormData(formData);
      }).toThrow('expirationDate is required when neverExpires is false');
    });

    it('handles whitespace-only expiration date string', () => {
      const quantity = createQuantity(randomQuantitySmall());
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'test-item',
        categoryId: 'food',
        quantity,
        unit: 'pieces',
        neverExpires: false,
        // @ts-expect-error - Testing invalid input (whitespace-only string)
        expirationDate: '   ', // Whitespace-only string should be treated as empty
      };

      // This should throw validation error, but tests that whitespace is trimmed
      expect(() => {
        InventoryItemFactory.createFromFormData(formData);
      }).toThrow('expirationDate is required when neverExpires is false');
    });

    it('uses itemType from form data', () => {
      const quantity = createQuantity(randomQuantitySmall());
      const formData: CreateFromFormInput = {
        name: 'Test Item',
        itemType: 'template-1',
        categoryId: 'food',
        quantity,
        unit: 'pieces',
        neverExpires: true,
      };

      const item = InventoryItemFactory.createFromFormData(formData);

      expect(item.itemType).toBe('template-1');
    });
  });

  describe('createCustomItem', () => {
    it('creates custom item with CUSTOM_ITEM_TYPE', () => {
      const quantity = createQuantity(randomQuantitySmall());
      const input: Omit<CreateItemInput, 'itemType'> = {
        name: 'Custom Item',
        categoryId: createCategoryId('food'),
        quantity,
        unit: 'pieces',
        neverExpires: true,
      };

      const item = InventoryItemFactory.createCustomItem(input);

      expect(item.itemType).toBe(CUSTOM_ITEM_TYPE);
      expect(item.name).toBe('Custom Item');
    });

    it('allows custom itemType override', () => {
      const quantity = createQuantity(randomQuantitySmall());
      const input: Omit<CreateItemInput, 'itemType'> & {
        itemType?: ProductTemplateId | 'custom';
      } = {
        name: 'Custom Item',
        // @ts-expect-error - Testing custom string behavior
        itemType: 'custom-type', // Testing custom string behavior
        categoryId: createCategoryId('food'),
        quantity,
        unit: 'pieces',
        neverExpires: true,
      };

      const item = InventoryItemFactory.createCustomItem(input);

      expect(item.itemType).toBe('custom-type');
    });
  });

  describe('rotation item validation', () => {
    it('should require estimatedQuantity when isNormalRotation is true and not excluded', () => {
      expect(() => {
        InventoryItemFactory.create({
          name: 'Flour',
          itemType: 'custom',
          categoryId: createCategoryId('food'),
          quantity: createQuantity(0),
          unit: 'kilograms',
          isNormalRotation: true,
          // Missing estimatedQuantity
          neverExpires: true,
        });
      }).toThrow('estimatedQuantity is required');
    });

    it('should not require estimatedQuantity when excludeFromCalculations is true', () => {
      const item = InventoryItemFactory.create({
        name: 'Flour',
        itemType: 'custom',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(0),
        unit: 'kilograms',
        isNormalRotation: true,
        excludeFromCalculations: true,
        neverExpires: true,
      });
      expect(item.isNormalRotation).toBe(true);
      expect(item.excludeFromCalculations).toBe(true);
    });

    it('should clear expiration fields for rotation items', () => {
      const item = InventoryItemFactory.create({
        name: 'Flour',
        itemType: 'custom',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(0),
        unit: 'kilograms',
        isNormalRotation: true,
        estimatedQuantity: 2,
        expirationDate: createDateOnly('2026-12-31'),
        neverExpires: false,
      });
      expect(item.expirationDate).toBeUndefined();
      expect(item.neverExpires).toBeUndefined();
    });

    it('should clear rotation fields for non-rotation items', () => {
      const item = InventoryItemFactory.create({
        name: 'Flour',
        itemType: 'custom',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(5),
        unit: 'kilograms',
        isNormalRotation: false,
        excludeFromCalculations: true, // Should be cleared
        estimatedQuantity: 10, // Should be cleared
        expirationDate: createDateOnly('2026-12-31'),
      });
      expect(item.excludeFromCalculations).toBeUndefined();
      expect(item.estimatedQuantity).toBeUndefined();
      expect(item.isNormalRotation).toBeUndefined();
    });

    it('should validate estimatedQuantity is non-negative', () => {
      expect(() => {
        InventoryItemFactory.create({
          name: 'Flour',
          itemType: 'custom',
          categoryId: createCategoryId('food'),
          quantity: createQuantity(0),
          unit: 'kilograms',
          isNormalRotation: true,
          estimatedQuantity: -1,
          neverExpires: true,
        });
      }).toThrow('estimatedQuantity must be non-negative');
    });
  });

  describe('edge cases', () => {
    it('handles all valid unit types', () => {
      const units: Array<CreateItemInput['unit']> = [
        'pieces',
        'liters',
        'kilograms',
        'grams',
        'cans',
        'bottles',
        'packages',
        'jars',
        'canisters',
        'boxes',
        'days',
        'rolls',
        'tubes',
        'meters',
        'pairs',
        'euros',
        'sets',
      ];

      units.forEach((unit) => {
        const item = InventoryItemFactory.create({
          ...validInput,
          unit,
        });
        expect(item.unit).toBe(unit);
      });
    });

    it('generates IDs for each item', () => {
      const item1 = InventoryItemFactory.create(validInput);
      const item2 = InventoryItemFactory.create(validInput);

      expect(item1.id).toBeDefined();
      expect(item2.id).toBeDefined();
      // Note: With mocked crypto.randomUUID, IDs will be the same
      // In real usage, crypto.randomUUID() generates unique IDs
    });

    it('sets createdAt and updatedAt to same timestamp on creation', () => {
      const item = InventoryItemFactory.create(validInput);

      expect(item.createdAt).toBe(item.updatedAt);
      const timestamp = new Date(item.createdAt).getTime();
      const now = Date.now();
      // Should be within 1 second (1000ms)
      expect(Math.abs(timestamp - now)).toBeLessThan(1000);
    });
  });
});
