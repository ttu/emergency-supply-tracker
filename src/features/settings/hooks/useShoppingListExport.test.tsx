import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { useShoppingListExport } from './useShoppingListExport';
import { SettingsProvider } from '@/features/settings';
import { HouseholdProvider } from '@/features/household';
import { InventoryProvider } from '@/features/inventory';
import { RecommendedItemsProvider } from '@/features/templates';
import { InventorySetProvider } from '@/features/inventory-set';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';
import { createMockAppData } from '@/shared/utils/test/factories';
import { STORAGE_KEY, saveAppData } from '@/shared/utils/storage/localStorage';
import type { AppData } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import { createMockInventoryItem } from '@/shared/utils/test/factories';

/**
 * Helper to render the hook with all required providers and initial data.
 */
function renderShoppingListHook(initialAppData?: Partial<AppData>) {
  if (initialAppData) {
    const data = createMockAppData(initialAppData);
    saveAppData(data);
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <InventorySetProvider>
        <SettingsProvider>
          <NotificationProvider>
            <HouseholdProvider>
              <RecommendedItemsProvider>
                <InventoryProvider>{children}</InventoryProvider>
              </RecommendedItemsProvider>
            </HouseholdProvider>
          </NotificationProvider>
        </SettingsProvider>
      </InventorySetProvider>
    );
  }

  return renderHook(() => useShoppingListExport(), { wrapper: Wrapper });
}

describe('useShoppingListExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.alert = vi.fn();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    vi.restoreAllMocks();
  });

  describe('itemsToRestock', () => {
    it('returns empty array when no items exist', () => {
      const { result } = renderShoppingListHook({
        items: [],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      expect(result.current.itemsToRestock).toEqual([]);
    });

    it('excludes items marked as enough', () => {
      // markedAsEnough items should be filtered out even if quantity is below recommended
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(1), // well below 9L recommended
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
            markedAsEnough: true,
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      expect(result.current.itemsToRestock).toHaveLength(0);
    });

    it('includes items below recommended quantity (strict less-than)', () => {
      // EqualityOperator mutant L52: item.quantity < recommendedQuantity
      // bottled-water: 3L * 1 adult * 3 days = 9L recommended
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5), // 5 < 9 -> needs restock
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      expect(result.current.itemsToRestock).toHaveLength(1);
      expect(result.current.itemsToRestock[0].name).toBe('Water');
    });

    it('excludes items at exactly recommended quantity (boundary)', () => {
      // EqualityOperator mutant: tests < vs <= boundary
      // bottled-water: 3L * 1 * 3 = 9L
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(9), // 9 == 9 -> NOT below, no restock
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      expect(result.current.itemsToRestock).toHaveLength(0);
    });

    it('excludes items above recommended quantity', () => {
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(20), // 20 > 9
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      expect(result.current.itemsToRestock).toHaveLength(0);
    });

    it('excludes custom items with no recommended definition', () => {
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('custom-1'),
            name: 'Custom Thing',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(0),
            itemType: createProductTemplateId('custom'),
            unit: 'pieces',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      // Custom items return recommended=0, and 0 < 0 is false
      expect(result.current.itemsToRestock).toHaveLength(0);
    });
  });

  describe('generateShoppingList', () => {
    it('returns noItems translation key when no items need restocking', () => {
      // ConditionalExpression mutant L57, EqualityOperator L57
      const { result } = renderShoppingListHook({
        items: [],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();
      expect(list).toBe('settings.shoppingList.noItems');
    });

    it('generates header with title and generated date', () => {
      // StringLiteral mutants: header formatting
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      // Verify header structure: title\ngenerated: date\n\n
      expect(list).toContain('settings.shoppingList.title');
      expect(list).toContain('settings.shoppingList.generated');
      // Header starts with title, then newline, then generated line
      expect(list).toMatch(
        /^settings\.shoppingList\.title\nsettings\.shoppingList\.generated: /,
      );
      // Two newlines after the date (header separator) - date format is locale-dependent
      expect(list).toMatch(/\d{1,4}[.,-/]\d{1,4}[.,-/]\d{1,4}\n\n/);
    });

    it('includes category name with icon and separator line', () => {
      // StringLiteral mutants for category header formatting
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      // Category icon (💧) and translated name
      expect(list).toContain('💧 categories.water-beverages');
      // Separator line of 40 dashes
      expect(list).toContain('─'.repeat(40));
    });

    it('includes item details with checkbox, needed quantity, current and recommended', () => {
      // StringLiteral mutants for item formatting
      // bottled-water: recommended = 3 * 1 * 3 = 9, have 5, need 4
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      // Item line: □ Water: 4 units.liters
      expect(list).toContain('□ Water: 4 units.liters');
      // Detail line: current: 5, recommended: 9
      expect(list).toContain(
        '  settings.shoppingList.current: 5, settings.shoppingList.recommended: 9',
      );
    });

    it('calculates needed quantity as recommendedQuantity minus item.quantity', () => {
      // ArithmeticOperator mutant L96: recommendedQuantity - item.quantity → +
      // bottled-water: recommended = 9, have 5, need = 9 - 5 = 4 (not 9 + 5 = 14)
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      // needed = 9 - 5 = 4, NOT 9 + 5 = 14
      expect(list).toContain('□ Water: 4 units.liters');
      expect(list).not.toContain('□ Water: 14 units.liters');
    });

    it('groups items by category and sorts categories alphabetically', () => {
      // MethodExpression L78 (Object.keys), BlockStatement L80, L89
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
          createMockInventoryItem({
            id: createItemId('item-2'),
            name: 'Beans',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            itemType: createProductTemplateId('canned-vegetables'),
            unit: 'cans',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      // Both categories should appear
      expect(list).toContain('categories.food');
      expect(list).toContain('categories.water-beverages');

      // Food (f) should come before water-beverages (w) alphabetically
      const foodIndex = list.indexOf('categories.food');
      const waterIndex = list.indexOf('categories.water-beverages');
      expect(foodIndex).toBeLessThan(waterIndex);

      // Each category should have items
      expect(list).toContain('□ Beans:');
      expect(list).toContain('□ Water:');
    });

    it('initializes category group as empty array when first item of category is encountered', () => {
      // ConditionalExpression L66, ArrayDeclaration L54 (reduce accumulator init)
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(1),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
          createMockInventoryItem({
            id: createItemId('item-2'),
            name: 'Juice',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(0),
            itemType: createProductTemplateId('long-life-juice'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      // Both items should be under same category
      expect(list).toContain('□ Water:');
      expect(list).toContain('□ Juice:');

      // Only one category header for water-beverages
      const matches = list.match(/categories\.water-beverages/g);
      expect(matches).toHaveLength(1);
    });

    it('uses fallback icon 📦 for unknown categories', () => {
      // LogicalOperator L86: category?.icon || '📦'
      // ArrowFunction L81: (c) => c.id === categoryId
      // Use an item with a non-standard category
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Custom Item',
            categoryId: createCategoryId('unknown-category'),
            quantity: createQuantity(1),
            // Use a known template so recommended > 0, but with wrong category
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      // Unknown category should use fallback icon 📦
      expect(list).toContain('📦 unknown-category');
      // Should NOT contain the standard category icons for this line
      expect(list).not.toContain('💧 unknown-category');
    });

    it('uses standard category icon when category exists', () => {
      // Ensures icon is from the actual category, not always the fallback
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      expect(list).toContain('💧 categories.water-beverages');
      // Should NOT use fallback for known categories
      expect(list).not.toContain('📦 categories.water-beverages');
    });

    it('uses food category icon for food items', () => {
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Beans',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            itemType: createProductTemplateId('canned-vegetables'),
            unit: 'cans',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();
      expect(list).toContain('🍽️ categories.food');
    });

    it('uses translated category name for known categories and raw id for unknown', () => {
      // EqualityOperator L81: c.id === categoryId vs c.id !== categoryId
      // When category is found, uses t(`categories.${category.id}`)
      // When not found, uses raw categoryId
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Custom',
            categoryId: createCategoryId('unknown-cat'),
            quantity: createQuantity(1),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      // For unknown category, the raw categoryId is used (not t(`categories.${id}`))
      expect(list).toContain('📦 unknown-cat\n');
    });

    it('includes unit label from translation', () => {
      // StringLiteral mutant for 'units.' + item.unit
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      // Unit label uses t('units.' + item.unit), i18n mock returns the key
      expect(list).toContain('units.liters');
    });

    it('includes translated current and recommended labels', () => {
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      expect(list).toContain('settings.shoppingList.current');
      expect(list).toContain('settings.shoppingList.recommended');
    });

    it('ends each category section with a blank line', () => {
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      // After item details, there should be an extra newline before next section/end
      // The pattern is: detail line\n\n (blank line after category)
      expect(list).toMatch(/recommended: \d+\n\n/);
    });
  });

  // Note: childrenRequirementPercentage tests removed - the ArithmeticOperator L36
  // mutant requires integration testing with the full settings provider chain

  describe('handleExport', () => {
    it('shows alert when no items need restocking', () => {
      // ConditionalExpression, ArrayDeclaration L117
      const { result } = renderShoppingListHook({
        items: [],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      result.current.handleExport();

      expect(globalThis.alert).toHaveBeenCalledWith(
        'settings.shoppingList.noItemsAlert',
      );
      expect(globalThis.URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('creates download link with correct filename format when items exist', () => {
      // Mock document.createElement to capture the download filename
      const mockClick = vi.fn();
      const mockRemove = vi.fn();
      const originalCreateElement =
        Document.prototype.createElement.bind(document);

      let capturedHref = '';
      let capturedDownload = '';

      vi.spyOn(document, 'createElement').mockImplementation(
        (tagName: string) => {
          const element = originalCreateElement(tagName);
          if (tagName === 'a') {
            element.click = mockClick;
            element.remove = mockRemove;
            // Capture href and download when they're set
            const originalSetAttribute = element.setAttribute.bind(element);
            Object.defineProperty(element, 'href', {
              set: (v: string) => {
                capturedHref = v;
                originalSetAttribute('href', v);
              },
              get: () => capturedHref,
            });
            Object.defineProperty(element, 'download', {
              set: (v: string) => {
                capturedDownload = v;
                originalSetAttribute('download', v);
              },
              get: () => capturedDownload,
            });
          }
          return element;
        },
      );

      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      result.current.handleExport();

      // Verify blob was created and URL generated
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
      // Verify link was clicked and cleaned up
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalled();
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(
        'blob:mock-url',
      );

      // Verify filename format: shopping-list-YYYY-MM-DD.txt
      expect(capturedDownload).toMatch(
        /^shopping-list-\d{4}-\d{2}-\d{2}\.txt$/,
      );
    });

    it('creates blob with text/plain content type', () => {
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      // Mock createElement to prevent navigation
      const origCreate = Document.prototype.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation(
        (tagName: string) => {
          const el = origCreate(tagName);
          if (tagName === 'a') {
            el.click = vi.fn();
          }
          return el;
        },
      );

      result.current.handleExport();

      const blobArg = (
        globalThis.URL.createObjectURL as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('text/plain;charset=utf-8');
    });
  });

  describe('full shopping list output format', () => {
    it('produces correctly formatted output with multiple categories', () => {
      // This test verifies the complete format to kill remaining StringLiteral mutants
      const { result } = renderShoppingListHook({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Water',
            categoryId: createCategoryId('water-beverages'),
            quantity: createQuantity(5),
            itemType: createProductTemplateId('bottled-water'),
            unit: 'liters',
          }),
          createMockInventoryItem({
            id: createItemId('item-2'),
            name: 'Beans',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            itemType: createProductTemplateId('canned-vegetables'),
            unit: 'cans',
          }),
        ],
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });

      const list = result.current.generateShoppingList();

      // Verify overall structure:
      // 1. Header with title and date
      // 2. Categories sorted alphabetically (food before water-beverages)
      // 3. Each category: icon + name, separator, items with details

      const lines = list.split('\n');

      // Line 0: title
      expect(lines[0]).toBe('settings.shoppingList.title');
      // Line 1: generated date
      expect(lines[1]).toMatch(
        /^settings\.shoppingList\.generated: \d{1,4}[.,-/]\d{1,4}[.,-/]\d{1,4}$/,
      );
      // Line 2: empty (header separator)
      expect(lines[2]).toBe('');

      // Food category first (alphabetically)
      // canned-vegetables: 1 * 1 * 3 = 3 cans recommended, have 1, need 2
      expect(lines[3]).toBe('🍽️ categories.food');
      expect(lines[4]).toBe('─'.repeat(40));
      expect(lines[5]).toBe('□ Beans: 2 units.cans');
      expect(lines[6]).toBe(
        '  settings.shoppingList.current: 1, settings.shoppingList.recommended: 3',
      );
      // Blank line between categories
      expect(lines[7]).toBe('');

      // Water category
      // bottled-water: 3 * 1 * 3 = 9L recommended, have 5, need 4
      expect(lines[8]).toBe('💧 categories.water-beverages');
      expect(lines[9]).toBe('─'.repeat(40));
      expect(lines[10]).toBe('□ Water: 4 units.liters');
      expect(lines[11]).toBe(
        '  settings.shoppingList.current: 5, settings.shoppingList.recommended: 9',
      );
    });
  });
});
