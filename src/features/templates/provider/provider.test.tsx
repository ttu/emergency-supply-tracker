import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { RecommendedItemsProvider } from './index';
import { useRecommendedItems } from '../hooks';
import * as localStorage from '@/shared/utils/storage/localStorage';
import { RECOMMENDED_ITEMS } from '../data';
import type { RecommendedItemsFile } from '@/shared/types';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';
import { createProductTemplateId } from '@/shared/types';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage', () => ({
  getAppData: vi.fn(),
  saveAppData: vi.fn(),
  createDefaultAppData: vi.fn(() => ({
    version: CURRENT_SCHEMA_VERSION,
    household: {
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    },
    settings: {
      language: 'en',
      theme: 'light',
      highContrast: false,
      advancedFeatures: {},
    },
    items: [],
    customCategories: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    lastModified: new Date().toISOString(),
  })),
}));

// Test component that uses the context
function TestComponent({
  onContextReady,
}: {
  onContextReady?: (ctx: ReturnType<typeof useRecommendedItems>) => void;
}) {
  const context = useRecommendedItems();

  if (onContextReady) {
    onContextReady(context);
  }

  return (
    <div>
      <div data-testid="items-count">{context.recommendedItems.length}</div>
      <div data-testid="is-custom">
        {context.isUsingCustomRecommendations ? 'true' : 'false'}
      </div>
      <div data-testid="custom-info">
        {context.customRecommendationsInfo?.name || 'none'}
      </div>
    </div>
  );
}

describe('RecommendedItemsProvider', () => {
  const mockGetAppData = localStorage.getAppData as Mock;
  const mockSaveAppData = localStorage.saveAppData as Mock;

  const validCustomFile: RecommendedItemsFile = {
    meta: {
      name: 'Custom Recommendations',
      version: CURRENT_SCHEMA_VERSION,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    items: [
      {
        id: createProductTemplateId('custom-item-1'),
        i18nKey: 'custom.item1',
        category: 'food',
        unit: 'pieces',
        baseQuantity: 5,
        scaleWithPeople: true,
        scaleWithDays: true,
      },
      {
        id: createProductTemplateId('custom-item-2'),
        names: { en: 'Water Bottle', fi: 'Vesipullo' },
        category: 'water-beverages',
        unit: 'liters',
        baseQuantity: 3,
        scaleWithPeople: true,
        scaleWithDays: true,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAppData.mockReturnValue(null);
  });

  it('should provide built-in recommended items by default', () => {
    render(
      <RecommendedItemsProvider>
        <TestComponent />
      </RecommendedItemsProvider>,
    );

    expect(screen.getByTestId('items-count')).toHaveTextContent(
      String(RECOMMENDED_ITEMS.length),
    );
    expect(screen.getByTestId('is-custom')).toHaveTextContent('false');
    expect(screen.getByTestId('custom-info')).toHaveTextContent('none');
  });

  it('should load custom recommendations from localStorage', () => {
    mockGetAppData.mockReturnValue({
      customRecommendedItems: validCustomFile,
    });

    render(
      <RecommendedItemsProvider>
        <TestComponent />
      </RecommendedItemsProvider>,
    );

    expect(screen.getByTestId('items-count')).toHaveTextContent('2');
    expect(screen.getByTestId('is-custom')).toHaveTextContent('true');
    expect(screen.getByTestId('custom-info')).toHaveTextContent(
      'Custom Recommendations',
    );
  });

  it('should import valid recommendations file', async () => {
    let importFn!: ReturnType<
      typeof useRecommendedItems
    >['importRecommendedItems'];

    render(
      <RecommendedItemsProvider>
        <TestComponent
          onContextReady={(ctx) => {
            importFn = ctx.importRecommendedItems;
          }}
        />
      </RecommendedItemsProvider>,
    );

    expect(screen.getByTestId('is-custom')).toHaveTextContent('false');

    act(() => {
      const result = importFn(validCustomFile);
      expect(result.valid).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-custom')).toHaveTextContent('true');
      expect(screen.getByTestId('items-count')).toHaveTextContent('2');
    });
  });

  it('should reject invalid recommendations file', () => {
    let importFn!: ReturnType<
      typeof useRecommendedItems
    >['importRecommendedItems'];

    render(
      <RecommendedItemsProvider>
        <TestComponent
          onContextReady={(ctx) => {
            importFn = ctx.importRecommendedItems;
          }}
        />
      </RecommendedItemsProvider>,
    );

    const invalidFile = {
      meta: { name: 'Invalid' },
      items: [],
    } as unknown as RecommendedItemsFile;

    act(() => {
      const result = importFn(invalidFile);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    // Should still be using built-in
    expect(screen.getByTestId('is-custom')).toHaveTextContent('false');
  });

  it('should export custom recommendations when using custom', async () => {
    mockGetAppData.mockReturnValue({
      customRecommendedItems: validCustomFile,
    });

    let exportFn: () => RecommendedItemsFile;

    render(
      <RecommendedItemsProvider>
        <TestComponent
          onContextReady={(ctx) => {
            exportFn = ctx.exportRecommendedItems;
          }}
        />
      </RecommendedItemsProvider>,
    );

    let exportedFile: RecommendedItemsFile;
    act(() => {
      exportedFile = exportFn();
    });

    expect(exportedFile!).toEqual(validCustomFile);
  });

  it('should export built-in recommendations when not using custom', () => {
    let exportFn: () => RecommendedItemsFile;

    render(
      <RecommendedItemsProvider>
        <TestComponent
          onContextReady={(ctx) => {
            exportFn = ctx.exportRecommendedItems;
          }}
        />
      </RecommendedItemsProvider>,
    );

    let exportedFile: RecommendedItemsFile;
    act(() => {
      exportedFile = exportFn();
    });

    expect(exportedFile!.meta.name).toBe('72tuntia.fi Standard Kit');
    expect(exportedFile!.items.length).toBe(RECOMMENDED_ITEMS.length);
  });

  it('should reset to default recommendations', async () => {
    mockGetAppData.mockReturnValue({
      customRecommendedItems: validCustomFile,
    });

    let resetFn: () => void;

    render(
      <RecommendedItemsProvider>
        <TestComponent
          onContextReady={(ctx) => {
            resetFn = ctx.resetToDefaultRecommendations;
          }}
        />
      </RecommendedItemsProvider>,
    );

    expect(screen.getByTestId('is-custom')).toHaveTextContent('true');

    act(() => {
      resetFn();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-custom')).toHaveTextContent('false');
      expect(screen.getByTestId('items-count')).toHaveTextContent(
        String(RECOMMENDED_ITEMS.length),
      );
    });
  });

  it('should save to localStorage when custom items change', async () => {
    let importFn: (file: RecommendedItemsFile) => { valid: boolean };

    render(
      <RecommendedItemsProvider>
        <TestComponent
          onContextReady={(ctx) => {
            importFn = ctx.importRecommendedItems;
          }}
        />
      </RecommendedItemsProvider>,
    );

    // Clear any initial save calls
    mockSaveAppData.mockClear();

    await act(async () => {
      importFn(validCustomFile);
    });

    await waitFor(() => {
      expect(mockSaveAppData).toHaveBeenCalled();
    });

    // Find the call that saved our custom items
    const lastCall =
      mockSaveAppData.mock.calls[mockSaveAppData.mock.calls.length - 1][0];
    expect(lastCall.customRecommendedItems).toEqual(validCustomFile);
    // Note: Clearing disabledRecommendedItems is now the responsibility of the
    // component that calls importRecommendedItems, since each provider manages
    // its own slice of localStorage state independently
  });

  describe('getItemName', () => {
    it('should return inline name for custom items with names', () => {
      mockGetAppData.mockReturnValue({
        customRecommendedItems: validCustomFile,
      });

      let getItemNameFn!: ReturnType<typeof useRecommendedItems>['getItemName'];
      let items!: ReturnType<typeof useRecommendedItems>['recommendedItems'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              getItemNameFn = ctx.getItemName;
              items = ctx.recommendedItems;
            }}
          />
        </RecommendedItemsProvider>,
      );

      const waterItem = items.find(
        (i) => i.id === createProductTemplateId('custom-item-2'),
      );
      expect(getItemNameFn(waterItem!, 'en')).toBe('Water Bottle');
      expect(getItemNameFn(waterItem!, 'fi')).toBe('Vesipullo');
    });

    it('should fall back to English when requested language not available', () => {
      mockGetAppData.mockReturnValue({
        customRecommendedItems: validCustomFile,
      });

      let getItemNameFn!: ReturnType<typeof useRecommendedItems>['getItemName'];
      let items!: ReturnType<typeof useRecommendedItems>['recommendedItems'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              getItemNameFn = ctx.getItemName;
              items = ctx.recommendedItems;
            }}
          />
        </RecommendedItemsProvider>,
      );

      const waterItem = items.find(
        (i) => i.id === createProductTemplateId('custom-item-2'),
      );
      // Request German, should fall back to English
      expect(getItemNameFn(waterItem!, 'de')).toBe('Water Bottle');
    });

    it('should return i18nKey without prefix for items with i18nKey', () => {
      let getItemNameFn!: ReturnType<typeof useRecommendedItems>['getItemName'];
      let items!: ReturnType<typeof useRecommendedItems>['recommendedItems'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              getItemNameFn = ctx.getItemName;
              items = ctx.recommendedItems;
            }}
          />
        </RecommendedItemsProvider>,
      );

      // Built-in items have i18nKey like 'products.water'
      const waterItem = items.find((i) => i.i18nKey?.includes('water'));
      if (waterItem) {
        const name = getItemNameFn(waterItem, 'en');
        // Should strip 'products.' prefix
        expect(name).not.toContain('products.');
      }
    });

    it('should return item ID as fallback', () => {
      let getItemNameFn!: ReturnType<typeof useRecommendedItems>['getItemName'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              getItemNameFn = ctx.getItemName;
            }}
          />
        </RecommendedItemsProvider>,
      );

      // Item with no i18nKey and no names
      const itemWithNoName = {
        id: createProductTemplateId('test-item-id'),
        category: 'food' as const,
        unit: 'pieces' as const,
        baseQuantity: 1,
        scaleWithPeople: true,
        scaleWithDays: true,
      };

      expect(getItemNameFn(itemWithNoName, 'en')).toBe('test-item-id');
    });

    it('should handle items with names directly on the item (import preview)', () => {
      let getItemNameFn!: ReturnType<typeof useRecommendedItems>['getItemName'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              getItemNameFn = ctx.getItemName;
            }}
          />
        </RecommendedItemsProvider>,
      );

      // Item with names directly (like during import preview before stored)
      const itemWithInlineNames = {
        id: createProductTemplateId('preview-item'),
        names: { en: 'Preview Item', fi: 'Esikatselu' },
        category: 'food' as const,
        unit: 'pieces' as const,
        baseQuantity: 1,
        scaleWithPeople: true,
        scaleWithDays: true,
      };

      expect(getItemNameFn(itemWithInlineNames, 'en')).toBe('Preview Item');
      expect(getItemNameFn(itemWithInlineNames, 'fi')).toBe('Esikatselu');
    });
  });

  it('should provide customRecommendationsInfo with correct data', () => {
    mockGetAppData.mockReturnValue({
      customRecommendedItems: validCustomFile,
    });

    let info!: ReturnType<
      typeof useRecommendedItems
    >['customRecommendationsInfo'];

    render(
      <RecommendedItemsProvider>
        <TestComponent
          onContextReady={(ctx) => {
            info = ctx.customRecommendationsInfo;
          }}
        />
      </RecommendedItemsProvider>,
    );

    expect(info).toEqual({
      name: 'Custom Recommendations',
      version: CURRENT_SCHEMA_VERSION,
      itemCount: 2,
    });
  });
});
