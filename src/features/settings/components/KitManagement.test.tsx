import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KitManagement } from './KitManagement';
import * as templatesModule from '@/features/templates';
import type { KitInfo, RecommendedItemDefinition } from '@/shared/types';
import { createProductTemplateId } from '@/shared/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options?.name) return `${key}: ${options.name}`;
      if (options?.count !== undefined) return `${key} (${options.count})`;
      if (options?.error) return `${key}: ${options.error}`;
      return key;
    },
  }),
}));

const mockBuiltInKits: KitInfo[] = [
  {
    id: '72tuntia-standard',
    name: 'Standard Kit',
    description: 'Standard emergency kit',
    itemCount: 71,
    isBuiltIn: true,
  },
  {
    id: 'minimal-essentials',
    name: 'Minimal Kit',
    description: 'Minimal emergency kit',
    itemCount: 20,
    isBuiltIn: true,
  },
];

const mockCustomKits: KitInfo[] = [
  {
    id: 'custom:test-uuid',
    name: 'My Custom Kit',
    description: 'Custom kit',
    itemCount: 25,
    isBuiltIn: false,
  },
];

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
];

const createMockContext = (overrides = {}) => ({
  recommendedItems: mockRecommendedItems,
  availableKits: [...mockBuiltInKits, ...mockCustomKits],
  selectedKitId: '72tuntia-standard' as const,
  selectKit: vi.fn(),
  uploadKit: vi.fn(() => ({
    valid: true,
    kitId: 'custom:new-kit-uuid' as const,
    errors: [],
    warnings: [],
  })),
  deleteKit: vi.fn(),
  updateCurrentKitMeta: vi.fn(),
  addItemToKit: vi.fn(),
  updateItemInKit: vi.fn(),
  removeItemFromKit: vi.fn(),
  exportRecommendedItems: vi.fn(() => ({
    meta: { name: 'Test Kit', version: '1.0.0', createdAt: '2024-01-01' },
    items: [],
  })),
  customRecommendationsInfo: null,
  isUsingCustomRecommendations: false,
  importRecommendedItems: vi.fn(() => ({
    valid: true,
    errors: [],
    warnings: [],
  })),
  resetToDefaultRecommendations: vi.fn(),
  getItemName: vi.fn(
    (item: RecommendedItemDefinition) => item.i18nKey || item.id,
  ),
  ...overrides,
});

const mockContext = createMockContext();

describe('KitManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      mockContext as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    // Mock URL and document methods for export
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('should render kit management container', () => {
    render(<KitManagement />);

    expect(screen.getByTestId('kit-management')).toBeInTheDocument();
  });

  it('should display current kit status', () => {
    render(<KitManagement />);

    expect(screen.getByText('kits.currentKit.label')).toBeInTheDocument();
    // The kit name appears in KitCard components as well
    expect(screen.getAllByText('Standard Kit').length).toBeGreaterThan(0);
  });

  it('should display item count for selected kit', () => {
    render(<KitManagement />);

    expect(screen.getAllByText(/kits.itemCount \(71\)/).length).toBeGreaterThan(
      0,
    );
  });

  it('should show built-in badge for built-in kits', () => {
    render(<KitManagement />);

    expect(screen.getAllByText('kits.builtIn').length).toBeGreaterThan(0);
  });

  it('should show no kit selected message when no kit is selected', () => {
    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        selectedKitId: null,
        availableKits: mockBuiltInKits,
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(<KitManagement />);

    expect(screen.getByText('kits.noKitSelected')).toBeInTheDocument();
  });

  it('should render KitSelector component', () => {
    render(<KitManagement />);

    expect(screen.getByTestId('kit-selector')).toBeInTheDocument();
  });

  it('should call selectKit when a kit is selected', () => {
    render(<KitManagement />);

    // Click on a kit card
    fireEvent.click(screen.getByTestId('kit-card-minimal-essentials'));

    expect(mockContext.selectKit).toHaveBeenCalledWith('minimal-essentials');
  });

  it('should show success toast when kit is selected', async () => {
    render(<KitManagement />);

    fireEvent.click(screen.getByTestId('kit-card-minimal-essentials'));

    await waitFor(() => {
      expect(screen.getByText(/kits.selected/)).toBeInTheDocument();
    });
  });

  it('should open delete confirmation when delete button is clicked', () => {
    render(<KitManagement />);

    fireEvent.click(screen.getByTestId('delete-kit-custom:test-uuid'));

    expect(screen.getByText('kits.deleteConfirm.title')).toBeInTheDocument();
  });

  it('should call deleteKit when delete is confirmed', () => {
    render(<KitManagement />);

    fireEvent.click(screen.getByTestId('delete-kit-custom:test-uuid'));
    fireEvent.click(screen.getByText('kits.deleteConfirm.confirm'));

    expect(mockContext.deleteKit).toHaveBeenCalledWith('custom:test-uuid');
  });

  it('should show success toast when kit is deleted', async () => {
    render(<KitManagement />);

    fireEvent.click(screen.getByTestId('delete-kit-custom:test-uuid'));
    fireEvent.click(screen.getByText('kits.deleteConfirm.confirm'));

    await waitFor(() => {
      expect(screen.getByText(/kits.deleteSuccess/)).toBeInTheDocument();
    });
  });

  it('should close delete dialog when cancel is clicked', async () => {
    render(<KitManagement />);

    fireEvent.click(screen.getByTestId('delete-kit-custom:test-uuid'));

    // Dialog should be open
    expect(screen.getByText('kits.deleteConfirm.title')).toBeInTheDocument();

    // Find cancel button - ConfirmDialog uses 'buttons.cancel'
    const cancelButton = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent === 'buttons.cancel');
    fireEvent.click(cancelButton!);

    await waitFor(() => {
      expect(
        screen.queryByText('kits.deleteConfirm.title'),
      ).not.toBeInTheDocument();
    });
  });

  it('should have export button', () => {
    render(<KitManagement />);

    expect(screen.getByTestId('export-kit-button')).toBeInTheDocument();
  });

  it('should export kit when export button is clicked', () => {
    render(<KitManagement />);

    fireEvent.click(screen.getByTestId('export-kit-button'));

    expect(mockContext.exportRecommendedItems).toHaveBeenCalled();
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should show success toast when kit is exported', async () => {
    render(<KitManagement />);

    fireEvent.click(screen.getByTestId('export-kit-button'));

    await waitFor(() => {
      expect(screen.getByText('kits.exportSuccess')).toBeInTheDocument();
    });
  });

  it('should disable export button when no kit is selected', () => {
    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        selectedKitId: null,
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(<KitManagement />);

    expect(screen.getByTestId('export-kit-button')).toBeDisabled();
  });

  it('should close toast when onClose is called', async () => {
    render(<KitManagement />);

    // Trigger a toast by selecting a kit
    fireEvent.click(screen.getByTestId('kit-card-minimal-essentials'));

    await waitFor(() => {
      expect(screen.getByText(/kits.selected/)).toBeInTheDocument();
    });

    // Find and close the toast - Toast component has a close button
    const toastCloseButton = screen
      .getAllByRole('button')
      .find((btn) => btn.getAttribute('aria-label') === 'actions.close');

    if (toastCloseButton) {
      fireEvent.click(toastCloseButton);

      await waitFor(() => {
        expect(screen.queryByText(/kits.selected/)).not.toBeInTheDocument();
      });
    }
  });
});
