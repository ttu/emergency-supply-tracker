import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { RecommendedItemsProvider } from './index';
import { useRecommendedItems } from '../hooks';
import * as localStorage from '@/shared/utils/storage/localStorage';
import { RECOMMENDED_ITEMS } from '../data';
import type { RecommendedItemsFile, UploadedKit, KitId } from '@/shared/types';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';
import { createProductTemplateId, createCustomKitId } from '@/shared/types';
import { DEFAULT_KIT_ID } from '../kits';

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
    selectedRecommendationKit: DEFAULT_KIT_ID,
    uploadedRecommendationKits: [],
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
      <div data-testid="selected-kit">{context.selectedKitId || 'none'}</div>
      <div data-testid="available-kits-count">
        {context.availableKits.length}
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

  const uploadedKit: UploadedKit = {
    id: 'test-kit-uuid',
    uploadedAt: '2024-01-01T00:00:00.000Z',
    file: validCustomFile,
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
    expect(screen.getByTestId('selected-kit')).toHaveTextContent(
      DEFAULT_KIT_ID,
    );
  });

  it('should fall back to default kit when stored custom kit no longer exists', () => {
    // Simulate a scenario where a custom kit ID is stored but the kit was deleted
    mockGetAppData.mockReturnValue({
      uploadedRecommendationKits: [], // Kit was deleted
      selectedRecommendationKit: createCustomKitId('deleted-kit-uuid'), // But ID is still stored
    });

    render(
      <RecommendedItemsProvider>
        <TestComponent />
      </RecommendedItemsProvider>,
    );

    // Should fall back to default kit
    expect(screen.getByTestId('is-custom')).toHaveTextContent('false');
    expect(screen.getByTestId('selected-kit')).toHaveTextContent(
      DEFAULT_KIT_ID,
    );
  });

  it('should load uploaded kit from localStorage and select it', () => {
    mockGetAppData.mockReturnValue({
      uploadedRecommendationKits: [uploadedKit],
      selectedRecommendationKit: createCustomKitId('test-kit-uuid'),
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

  it('should import valid recommendations file via uploadKit', async () => {
    let uploadKitFn!: ReturnType<typeof useRecommendedItems>['uploadKit'];

    render(
      <RecommendedItemsProvider>
        <TestComponent
          onContextReady={(ctx) => {
            uploadKitFn = ctx.uploadKit;
          }}
        />
      </RecommendedItemsProvider>,
    );

    expect(screen.getByTestId('is-custom')).toHaveTextContent('false');

    act(() => {
      const result = uploadKitFn(validCustomFile);
      expect(result.valid).toBe(true);
      expect(result.kitId).toBeDefined();
    });
  });

  it('should reject invalid recommendations file', () => {
    let uploadKitFn!: ReturnType<typeof useRecommendedItems>['uploadKit'];

    render(
      <RecommendedItemsProvider>
        <TestComponent
          onContextReady={(ctx) => {
            uploadKitFn = ctx.uploadKit;
          }}
        />
      </RecommendedItemsProvider>,
    );

    const invalidFile = {
      meta: { name: 'Invalid' },
      items: [],
    } as unknown as RecommendedItemsFile;

    act(() => {
      const result = uploadKitFn(invalidFile);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    // Should still be using built-in
    expect(screen.getByTestId('is-custom')).toHaveTextContent('false');
  });

  it('should export current kit when using custom', async () => {
    mockGetAppData.mockReturnValue({
      uploadedRecommendationKits: [uploadedKit],
      selectedRecommendationKit: createCustomKitId('test-kit-uuid'),
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

    expect(exportedFile!.meta.name).toBe('Custom Recommendations');
    expect(exportedFile!.items.length).toBe(2);
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

  it('should reset to default recommendations via selectKit', async () => {
    mockGetAppData.mockReturnValue({
      uploadedRecommendationKits: [uploadedKit],
      selectedRecommendationKit: createCustomKitId('test-kit-uuid'),
    });

    let selectKitFn: (kitId: KitId) => void;

    render(
      <RecommendedItemsProvider>
        <TestComponent
          onContextReady={(ctx) => {
            selectKitFn = ctx.selectKit;
          }}
        />
      </RecommendedItemsProvider>,
    );

    expect(screen.getByTestId('is-custom')).toHaveTextContent('true');

    act(() => {
      selectKitFn(DEFAULT_KIT_ID);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-custom')).toHaveTextContent('false');
      expect(screen.getByTestId('items-count')).toHaveTextContent(
        String(RECOMMENDED_ITEMS.length),
      );
    });
  });

  it('should save to localStorage when kit is uploaded', async () => {
    let uploadKitFn: (file: RecommendedItemsFile) => { valid: boolean };

    render(
      <RecommendedItemsProvider>
        <TestComponent
          onContextReady={(ctx) => {
            uploadKitFn = ctx.uploadKit;
          }}
        />
      </RecommendedItemsProvider>,
    );

    // Clear any initial save calls
    mockSaveAppData.mockClear();

    await act(async () => {
      uploadKitFn(validCustomFile);
    });

    await waitFor(() => {
      expect(mockSaveAppData).toHaveBeenCalled();
    });

    // Find the call that saved our uploaded kit
    const lastCall =
      mockSaveAppData.mock.calls[mockSaveAppData.mock.calls.length - 1][0];
    expect(lastCall.uploadedRecommendationKits).toBeDefined();
    expect(lastCall.uploadedRecommendationKits.length).toBeGreaterThan(0);
  });

  describe('getItemName', () => {
    it('should return inline name for custom items with names', () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [uploadedKit],
        selectedRecommendationKit: createCustomKitId('test-kit-uuid'),
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
      expect(waterItem).toBeDefined();
      expect(getItemNameFn(waterItem!, 'en')).toBe('Water Bottle');
      expect(getItemNameFn(waterItem!, 'fi')).toBe('Vesipullo');
    });

    it('should fall back to English when requested language not available', () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [uploadedKit],
        selectedRecommendationKit: createCustomKitId('test-kit-uuid'),
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
      expect(waterItem).toBeDefined();
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
      uploadedRecommendationKits: [uploadedKit],
      selectedRecommendationKit: createCustomKitId('test-kit-uuid'),
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

  describe('kit selection and management', () => {
    it('should list available kits including built-in and uploaded', () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [uploadedKit],
        selectedRecommendationKit: DEFAULT_KIT_ID,
      });

      let availableKits!: ReturnType<
        typeof useRecommendedItems
      >['availableKits'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              availableKits = ctx.availableKits;
            }}
          />
        </RecommendedItemsProvider>,
      );

      // Should have built-in kits + 1 uploaded kit
      expect(availableKits.length).toBeGreaterThan(1);

      // Should include the uploaded kit
      const customKit = availableKits.find(
        (k) => k.id === createCustomKitId('test-kit-uuid'),
      );
      expect(customKit).toBeDefined();
      expect(customKit?.name).toBe('Custom Recommendations');
    });

    it('should select a different kit', async () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [uploadedKit],
        selectedRecommendationKit: DEFAULT_KIT_ID,
      });

      let selectKitFn!: ReturnType<typeof useRecommendedItems>['selectKit'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              selectKitFn = ctx.selectKit;
            }}
          />
        </RecommendedItemsProvider>,
      );

      expect(screen.getByTestId('is-custom')).toHaveTextContent('false');

      act(() => {
        selectKitFn(createCustomKitId('test-kit-uuid'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-custom')).toHaveTextContent('true');
        expect(screen.getByTestId('items-count')).toHaveTextContent('2');
      });
    });

    it('should delete an uploaded kit', async () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [uploadedKit],
        selectedRecommendationKit: DEFAULT_KIT_ID,
      });

      let deleteKitFn!: ReturnType<typeof useRecommendedItems>['deleteKit'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              deleteKitFn = ctx.deleteKit;
            }}
          />
        </RecommendedItemsProvider>,
      );

      // Clear any initial save calls
      mockSaveAppData.mockClear();

      act(() => {
        deleteKitFn(createCustomKitId('test-kit-uuid'));
      });

      await waitFor(() => {
        expect(mockSaveAppData).toHaveBeenCalled();
      });

      // Verify the kit was removed from the saved data
      const lastCall =
        mockSaveAppData.mock.calls[mockSaveAppData.mock.calls.length - 1][0];
      expect(lastCall.uploadedRecommendationKits).toBeDefined();
      expect(lastCall.uploadedRecommendationKits.length).toBe(0);
    });

    it('should switch to default kit when deleting the currently selected kit', async () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [uploadedKit],
        selectedRecommendationKit: createCustomKitId('test-kit-uuid'),
      });

      let deleteKitFn!: ReturnType<typeof useRecommendedItems>['deleteKit'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              deleteKitFn = ctx.deleteKit;
            }}
          />
        </RecommendedItemsProvider>,
      );

      expect(screen.getByTestId('is-custom')).toHaveTextContent('true');

      act(() => {
        deleteKitFn(createCustomKitId('test-kit-uuid'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-custom')).toHaveTextContent('false');
        expect(screen.getByTestId('selected-kit')).toHaveTextContent(
          DEFAULT_KIT_ID,
        );
      });
    });
  });

  describe('kit editing', () => {
    it('should update kit metadata', async () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [uploadedKit],
        selectedRecommendationKit: createCustomKitId('test-kit-uuid'),
      });

      let updateMetaFn!: ReturnType<
        typeof useRecommendedItems
      >['updateCurrentKitMeta'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              updateMetaFn = ctx.updateCurrentKitMeta;
            }}
          />
        </RecommendedItemsProvider>,
      );

      // Clear initial calls
      mockSaveAppData.mockClear();

      act(() => {
        updateMetaFn({ name: 'Updated Kit Name' });
      });

      await waitFor(() => {
        expect(mockSaveAppData).toHaveBeenCalled();
      });

      const lastCall =
        mockSaveAppData.mock.calls[mockSaveAppData.mock.calls.length - 1][0];
      const updatedKit = lastCall.uploadedRecommendationKits.find(
        (k: { id: string }) => k.id === 'test-kit-uuid',
      );
      expect(updatedKit?.file.meta.name).toBe('Updated Kit Name');
    });

    it('should warn and not update metadata for built-in kits', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      let updateMetaFn!: ReturnType<
        typeof useRecommendedItems
      >['updateCurrentKitMeta'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              updateMetaFn = ctx.updateCurrentKitMeta;
            }}
          />
        </RecommendedItemsProvider>,
      );

      act(() => {
        updateMetaFn({ name: 'Should Not Update' });
      });

      expect(warnSpy).toHaveBeenCalledWith('Cannot edit built-in kit metadata');
      warnSpy.mockRestore();
    });

    it('should add item to custom kit', async () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [uploadedKit],
        selectedRecommendationKit: createCustomKitId('test-kit-uuid'),
      });

      let addItemFn!: ReturnType<typeof useRecommendedItems>['addItemToKit'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              addItemFn = ctx.addItemToKit;
            }}
          />
        </RecommendedItemsProvider>,
      );

      // Clear initial calls
      mockSaveAppData.mockClear();

      const newItem = {
        id: createProductTemplateId('new-item'),
        names: { en: 'New Item' },
        category: 'food' as const,
        unit: 'pieces' as const,
        baseQuantity: 3,
        scaleWithPeople: true,
        scaleWithDays: false,
      };

      act(() => {
        addItemFn(newItem);
      });

      await waitFor(() => {
        expect(mockSaveAppData).toHaveBeenCalled();
      });

      const lastCall =
        mockSaveAppData.mock.calls[mockSaveAppData.mock.calls.length - 1][0];
      const updatedKit = lastCall.uploadedRecommendationKits.find(
        (k: { id: string }) => k.id === 'test-kit-uuid',
      );
      expect(updatedKit?.file.items.length).toBe(3);
    });

    it('should warn and not add item to built-in kit', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      let addItemFn!: ReturnType<typeof useRecommendedItems>['addItemToKit'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              addItemFn = ctx.addItemToKit;
            }}
          />
        </RecommendedItemsProvider>,
      );

      act(() => {
        addItemFn({
          id: createProductTemplateId('new-item'),
          names: { en: 'New Item' },
          category: 'food',
          unit: 'pieces',
          baseQuantity: 1,
          scaleWithPeople: true,
          scaleWithDays: true,
        });
      });

      expect(warnSpy).toHaveBeenCalledWith('Cannot add items to built-in kit');
      warnSpy.mockRestore();
    });

    it('should update item in custom kit', async () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [uploadedKit],
        selectedRecommendationKit: createCustomKitId('test-kit-uuid'),
      });

      let updateItemFn!: ReturnType<
        typeof useRecommendedItems
      >['updateItemInKit'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              updateItemFn = ctx.updateItemInKit;
            }}
          />
        </RecommendedItemsProvider>,
      );

      // Clear initial calls
      mockSaveAppData.mockClear();

      act(() => {
        updateItemFn(createProductTemplateId('custom-item-1'), {
          baseQuantity: 10,
        });
      });

      await waitFor(() => {
        expect(mockSaveAppData).toHaveBeenCalled();
      });

      const lastCall =
        mockSaveAppData.mock.calls[mockSaveAppData.mock.calls.length - 1][0];
      const updatedKit = lastCall.uploadedRecommendationKits.find(
        (k: { id: string }) => k.id === 'test-kit-uuid',
      );
      const updatedItem = updatedKit?.file.items.find(
        (i: { id: string }) =>
          i.id === createProductTemplateId('custom-item-1'),
      );
      expect(updatedItem?.baseQuantity).toBe(10);
    });

    it('should warn and not update item in built-in kit', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      let updateItemFn!: ReturnType<
        typeof useRecommendedItems
      >['updateItemInKit'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              updateItemFn = ctx.updateItemInKit;
            }}
          />
        </RecommendedItemsProvider>,
      );

      act(() => {
        updateItemFn('some-item', { baseQuantity: 10 });
      });

      expect(warnSpy).toHaveBeenCalledWith('Cannot edit items in built-in kit');
      warnSpy.mockRestore();
    });

    it('should remove item from custom kit', async () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [uploadedKit],
        selectedRecommendationKit: createCustomKitId('test-kit-uuid'),
      });

      let removeItemFn!: ReturnType<
        typeof useRecommendedItems
      >['removeItemFromKit'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              removeItemFn = ctx.removeItemFromKit;
            }}
          />
        </RecommendedItemsProvider>,
      );

      // Clear initial calls
      mockSaveAppData.mockClear();

      act(() => {
        removeItemFn(createProductTemplateId('custom-item-1'));
      });

      await waitFor(() => {
        expect(mockSaveAppData).toHaveBeenCalled();
      });

      const lastCall =
        mockSaveAppData.mock.calls[mockSaveAppData.mock.calls.length - 1][0];
      const updatedKit = lastCall.uploadedRecommendationKits.find(
        (k: { id: string }) => k.id === 'test-kit-uuid',
      );
      expect(updatedKit?.file.items.length).toBe(1);
    });

    it('should warn and not remove item from built-in kit', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      let removeItemFn!: ReturnType<
        typeof useRecommendedItems
      >['removeItemFromKit'];

      render(
        <RecommendedItemsProvider>
          <TestComponent
            onContextReady={(ctx) => {
              removeItemFn = ctx.removeItemFromKit;
            }}
          />
        </RecommendedItemsProvider>,
      );

      act(() => {
        removeItemFn('some-item');
      });

      expect(warnSpy).toHaveBeenCalledWith(
        'Cannot remove items from built-in kit',
      );
      warnSpy.mockRestore();
    });
  });

  describe('legacy methods', () => {
    it('should import and auto-select via importRecommendedItems', async () => {
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
      });
    });

    it('should reset via resetToDefaultRecommendations', async () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [uploadedKit],
        selectedRecommendationKit: createCustomKitId('test-kit-uuid'),
      });

      let resetFn!: ReturnType<
        typeof useRecommendedItems
      >['resetToDefaultRecommendations'];

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
        expect(screen.getByTestId('selected-kit')).toHaveTextContent(
          DEFAULT_KIT_ID,
        );
      });
    });
  });

  describe('edge cases', () => {
    it('should fallback to default kit when custom kit is not found', () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [],
        selectedRecommendationKit: createCustomKitId('nonexistent-uuid'),
      });

      render(
        <RecommendedItemsProvider>
          <TestComponent />
        </RecommendedItemsProvider>,
      );

      // Should fallback to default items count
      expect(screen.getByTestId('items-count')).toHaveTextContent(
        String(RECOMMENDED_ITEMS.length),
      );
    });

    it('should return null for currentKitFile with invalid kit id type', () => {
      mockGetAppData.mockReturnValue({
        uploadedRecommendationKits: [],
        selectedRecommendationKit: 'invalid-kit-id' as KitId,
      });

      render(
        <RecommendedItemsProvider>
          <TestComponent />
        </RecommendedItemsProvider>,
      );

      // Should fallback to default items
      expect(screen.getByTestId('items-count')).toHaveTextContent(
        String(RECOMMENDED_ITEMS.length),
      );
    });
  });
});
