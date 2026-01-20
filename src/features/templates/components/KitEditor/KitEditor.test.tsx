import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KitEditor } from './KitEditor';
import * as templatesModule from '@/features/templates';
import type { RecommendedItemDefinition, KitInfo } from '@/shared/types';
import { createProductTemplateId } from '@/shared/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options?.name) return `${key}: ${options.name}`;
      if (options?.ns) return key;
      return key;
    },
    i18n: {
      language: 'en',
    },
  }),
}));

const mockRecommendedItems: RecommendedItemDefinition[] = [
  {
    id: createProductTemplateId('water'),
    i18nKey: 'products.water',
    category: 'water-beverages',
    unit: 'liters',
    baseQuantity: 3,
    scaleWithPeople: true,
    scaleWithDays: true,
  },
  {
    id: createProductTemplateId('rice'),
    i18nKey: 'products.rice',
    category: 'food',
    unit: 'kilograms',
    baseQuantity: 1,
    scaleWithPeople: true,
    scaleWithDays: false,
  },
];

const mockBuiltInKits: KitInfo[] = [
  {
    id: '72tuntia-standard',
    name: 'Standard Kit',
    description: 'Standard emergency kit',
    itemCount: 71,
    isBuiltIn: true,
  },
];

const mockCustomKits: KitInfo[] = [
  {
    id: 'custom:test-uuid',
    name: 'My Custom Kit',
    description: 'Custom kit',
    itemCount: 2,
    isBuiltIn: false,
  },
];

// Shared mock functions that can be checked across tests
const mockAddItemToKit = vi.fn();
const mockUpdateItemInKit = vi.fn();
const mockRemoveItemFromKit = vi.fn();
const mockSelectKit = vi.fn();
const mockUploadKit = vi.fn(() => ({
  valid: true,
  kitId: 'new-kit-uuid' as `custom:${string}`,
  errors: [],
  warnings: [],
}));
const mockDeleteKit = vi.fn();
const mockUpdateCurrentKitMeta = vi.fn();
const mockExportRecommendedItems = vi.fn(() => ({
  meta: { name: 'Test Kit', version: '1.0.0', createdAt: '2024-01-01' },
  items: mockRecommendedItems.map((item) => ({
    ...item,
    i18nKey: item.i18nKey,
  })),
}));
const mockGetItemName = vi.fn(
  (item: RecommendedItemDefinition) => item.i18nKey || item.id,
);

const createMockContext = (overrides = {}) => ({
  recommendedItems: mockRecommendedItems,
  selectedKitId: '72tuntia-standard' as const,
  availableKits: mockBuiltInKits,
  selectKit: mockSelectKit,
  uploadKit: mockUploadKit,
  deleteKit: mockDeleteKit,
  updateCurrentKitMeta: mockUpdateCurrentKitMeta,
  addItemToKit: mockAddItemToKit,
  updateItemInKit: mockUpdateItemInKit,
  removeItemFromKit: mockRemoveItemFromKit,
  exportRecommendedItems: mockExportRecommendedItems,
  customRecommendationsInfo: null,
  isUsingCustomRecommendations: false,
  importRecommendedItems: vi.fn(() => ({
    valid: true,
    errors: [],
    warnings: [],
  })),
  resetToDefaultRecommendations: vi.fn(),
  getItemName: mockGetItemName,
  ...overrides,
});

const mockContext = createMockContext();

describe('KitEditor', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      mockContext as ReturnType<typeof templatesModule.useRecommendedItems>,
    );
  });

  it('should not render when isOpen is false', () => {
    render(<KitEditor isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByTestId('kit-editor-modal')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<KitEditor isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByTestId('kit-editor-modal')).toBeInTheDocument();
    expect(screen.getByText('kitEditor.title')).toBeInTheDocument();
  });

  it('should display current kit name and item count', () => {
    render(<KitEditor isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Standard Kit/)).toBeInTheDocument();
    expect(screen.getByText(/2.*kitEditor.items/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<KitEditor isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByTestId('kit-editor-close'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when footer close button is clicked', () => {
    render(<KitEditor isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('actions.close'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display items grouped by category', () => {
    render(<KitEditor isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('water-beverages')).toBeInTheDocument();
    expect(screen.getByText('food')).toBeInTheDocument();
  });

  it('should show search input', () => {
    render(<KitEditor isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByTestId('kit-editor-search')).toBeInTheDocument();
  });

  it('should filter items based on search query', () => {
    mockContext.getItemName.mockImplementation(
      (item: RecommendedItemDefinition) => {
        if (item.id === 'water') return 'Water';
        if (item.id === 'rice') return 'Rice';
        return item.id;
      },
    );

    render(<KitEditor isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByTestId('kit-editor-search');
    fireEvent.change(searchInput, { target: { value: 'water' } });

    // Water should be visible, rice should not
    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.queryByText('Rice')).not.toBeInTheDocument();
  });

  it('should show empty state when no items match search', () => {
    render(<KitEditor isOpen={true} onClose={mockOnClose} />);

    const searchInput = screen.getByTestId('kit-editor-search');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('kitEditor.noSearchResults')).toBeInTheDocument();
  });

  it('should show notice for built-in kits (not editable)', () => {
    render(<KitEditor isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('kitEditor.builtInNotice')).toBeInTheDocument();
  });

  it('should not show add item button for built-in kits', () => {
    render(<KitEditor isOpen={true} onClose={mockOnClose} />);

    expect(screen.queryByTestId('kit-editor-add-item')).not.toBeInTheDocument();
  });

  it('should not show edit/delete buttons for built-in kit items', () => {
    render(<KitEditor isOpen={true} onClose={mockOnClose} />);

    expect(screen.queryByTestId('edit-item-water')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-item-water')).not.toBeInTheDocument();
  });

  describe('with custom kit selected', () => {
    beforeEach(() => {
      vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
        createMockContext({
          selectedKitId: 'custom:test-uuid' as `custom:${string}`,
          availableKits: [...mockBuiltInKits, ...mockCustomKits],
        }) as ReturnType<typeof templatesModule.useRecommendedItems>,
      );
    });

    it('should show add item button for custom kits', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('kit-editor-add-item')).toBeInTheDocument();
    });

    it('should not show built-in notice for custom kits', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      expect(
        screen.queryByText('kitEditor.builtInNotice'),
      ).not.toBeInTheDocument();
    });

    it('should show edit buttons for custom kit items', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('edit-item-water')).toBeInTheDocument();
      expect(screen.getByTestId('edit-item-rice')).toBeInTheDocument();
    });

    it('should show delete buttons for custom kit items', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('delete-item-water')).toBeInTheDocument();
      expect(screen.getByTestId('delete-item-rice')).toBeInTheDocument();
    });

    it('should open ItemEditor when add item button is clicked', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('kit-editor-add-item'));

      // ItemEditor should be rendered
      expect(screen.getByTestId('item-editor')).toBeInTheDocument();
    });

    it('should open ItemEditor when edit button is clicked', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('edit-item-water'));

      // ItemEditor should be rendered with item data
      expect(screen.getByTestId('item-editor')).toBeInTheDocument();
    });

    it('should open delete confirmation dialog when delete button is clicked', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('delete-item-water'));

      expect(
        screen.getByText('kitEditor.deleteItem.title'),
      ).toBeInTheDocument();
    });

    it('should call removeItemFromKit when delete is confirmed', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('delete-item-water'));
      fireEvent.click(screen.getByText('kitEditor.deleteItem.confirm'));

      expect(mockRemoveItemFromKit).toHaveBeenCalledWith('water');
    });

    it('should close delete dialog when cancel is clicked', async () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('delete-item-water'));

      // The ConfirmDialog should be open
      expect(
        screen.getByText('kitEditor.deleteItem.title'),
      ).toBeInTheDocument();

      // Find the cancel button in the dialog - ConfirmDialog uses 'buttons.cancel'
      const cancelButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.textContent === 'buttons.cancel');
      fireEvent.click(cancelButtons[0]);

      // Dialog should close - the title should no longer be visible
      await vi.waitFor(() => {
        expect(
          screen.queryByText('kitEditor.deleteItem.title'),
        ).not.toBeInTheDocument();
      });
    });

    it('should call addItemToKit when new item is saved', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      // Open add item form
      fireEvent.click(screen.getByTestId('kit-editor-add-item'));

      // Fill in the form - use correct test IDs from ItemEditor component
      fireEvent.change(screen.getByTestId('item-name-en'), {
        target: { value: 'New Item' },
      });
      fireEvent.change(screen.getByTestId('item-base-quantity'), {
        target: { value: '5' },
      });

      // Save the item
      fireEvent.click(screen.getByTestId('item-editor-save'));

      expect(mockAddItemToKit).toHaveBeenCalled();
    });

    it('should open edit form for existing item', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      // Open edit form for water item
      fireEvent.click(screen.getByTestId('edit-item-water'));

      // Verify ItemEditor is shown
      expect(screen.getByTestId('item-editor')).toBeInTheDocument();

      // The item editor should have the save button
      expect(screen.getByTestId('item-editor-save')).toBeInTheDocument();

      // Verify the form has quantity input
      expect(screen.getByTestId('item-base-quantity')).toBeInTheDocument();
    });

    it('should close ItemEditor when cancel is clicked', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      // Open add item form
      fireEvent.click(screen.getByTestId('kit-editor-add-item'));

      // Cancel
      fireEvent.click(screen.getByTestId('item-editor-cancel'));

      // Should be back to main view
      expect(screen.queryByTestId('item-editor')).not.toBeInTheDocument();
      expect(screen.getByText('kitEditor.title')).toBeInTheDocument();
    });

    it('should display per-person tag for items that scale with people', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      expect(screen.getAllByText('kitEditor.perPerson').length).toBeGreaterThan(
        0,
      );
    });

    it('should display per-day tag for items that scale with days', () => {
      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      expect(screen.getAllByText('kitEditor.perDay').length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('should show empty state when no items exist', () => {
      vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
        createMockContext({
          recommendedItems: [],
        }) as ReturnType<typeof templatesModule.useRecommendedItems>,
      );

      render(<KitEditor isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('kitEditor.noItems')).toBeInTheDocument();
    });
  });
});
