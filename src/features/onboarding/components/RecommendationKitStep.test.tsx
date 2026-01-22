import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecommendationKitStep } from './RecommendationKitStep';
import * as templatesModule from '@/features/templates';
import type { KitInfo, RecommendedItemDefinition } from '@/shared/types';
import { createProductTemplateId } from '@/shared/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
  availableKits: mockBuiltInKits,
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

describe('RecommendationKitStep', () => {
  const mockOnContinue = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      mockContext as ReturnType<typeof templatesModule.useRecommendedItems>,
    );
  });

  it('should render the step container', () => {
    render(
      <RecommendationKitStep onContinue={mockOnContinue} onBack={mockOnBack} />,
    );

    expect(
      screen.getByTestId('onboarding-recommendation-kit-step'),
    ).toBeInTheDocument();
  });

  it('should render title and description', () => {
    render(
      <RecommendationKitStep onContinue={mockOnContinue} onBack={mockOnBack} />,
    );

    expect(screen.getByText('kits.selectTitle')).toBeInTheDocument();
    expect(screen.getByText('kits.selectDescription')).toBeInTheDocument();
  });

  it('should render KitSelector component', () => {
    render(
      <RecommendationKitStep onContinue={mockOnContinue} onBack={mockOnBack} />,
    );

    expect(screen.getByTestId('kit-selector')).toBeInTheDocument();
  });

  it('should call selectKit when a kit is selected', () => {
    render(
      <RecommendationKitStep onContinue={mockOnContinue} onBack={mockOnBack} />,
    );

    fireEvent.click(screen.getByTestId('kit-card-minimal-essentials'));

    expect(mockContext.selectKit).toHaveBeenCalledWith('minimal-essentials');
  });

  it('should call onContinue when continue button is clicked', () => {
    render(
      <RecommendationKitStep onContinue={mockOnContinue} onBack={mockOnBack} />,
    );

    fireEvent.click(screen.getByTestId('kit-step-continue-button'));

    expect(mockOnContinue).toHaveBeenCalled();
  });

  it('should call onBack when back button is clicked', () => {
    render(
      <RecommendationKitStep onContinue={mockOnContinue} onBack={mockOnBack} />,
    );

    fireEvent.click(screen.getByTestId('kit-step-back-button'));

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should disable continue button when no kit is selected', () => {
    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        selectedKitId: null,
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(
      <RecommendationKitStep onContinue={mockOnContinue} onBack={mockOnBack} />,
    );

    expect(screen.getByTestId('kit-step-continue-button')).toBeDisabled();
  });

  it('should enable continue button when a kit is selected', () => {
    render(
      <RecommendationKitStep onContinue={mockOnContinue} onBack={mockOnBack} />,
    );

    expect(screen.getByTestId('kit-step-continue-button')).not.toBeDisabled();
  });

  it('should show upload button', () => {
    render(
      <RecommendationKitStep onContinue={mockOnContinue} onBack={mockOnBack} />,
    );

    expect(screen.getByTestId('upload-kit-button')).toBeInTheDocument();
  });

  it('should not show delete button (showDelete=false)', () => {
    const customKits: KitInfo[] = [
      {
        id: 'custom:test-uuid',
        name: 'Custom Kit',
        description: 'Custom',
        itemCount: 5,
        isBuiltIn: false,
      },
    ];

    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        availableKits: [...mockBuiltInKits, ...customKits],
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(
      <RecommendationKitStep onContinue={mockOnContinue} onBack={mockOnBack} />,
    );

    // Delete button should not be shown in onboarding
    expect(
      screen.queryByTestId('delete-kit-custom:test-uuid'),
    ).not.toBeInTheDocument();
  });

  it('should auto-select uploaded kit when upload is successful', async () => {
    const mockSelectKit = vi.fn();
    const mockUploadKit = vi.fn(() => ({
      valid: true,
      kitId: 'custom:uploaded-kit' as const,
      errors: [],
      warnings: [],
    }));

    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        selectKit: mockSelectKit,
        uploadKit: mockUploadKit,
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(
      <RecommendationKitStep onContinue={mockOnContinue} onBack={mockOnBack} />,
    );

    // Simulate file upload
    const fileInput = screen.getByTestId('kit-file-input');
    const validKitFile = {
      meta: {
        name: 'Uploaded Kit',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      items: [
        {
          id: 'test-item',
          names: { en: 'Test Item', fi: 'Testituote' },
          category: 'food',
          baseQuantity: 1,
          unit: 'pieces',
          scaleWithPeople: true,
          scaleWithDays: false,
        },
      ],
    };
    const file = new File([JSON.stringify(validKitFile)], 'test.json', {
      type: 'application/json',
    });
    // Mock file.text() method
    (file as { text: () => Promise<string> }).text = vi
      .fn()
      .mockResolvedValue(JSON.stringify(validKitFile));
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockUploadKit).toHaveBeenCalled();
      // Should auto-select the uploaded kit
      expect(mockSelectKit).toHaveBeenCalledWith('custom:uploaded-kit');
    });
  });

  it('should not auto-select when upload is invalid', async () => {
    const mockSelectKit = vi.fn();
    const mockUploadKit = vi.fn(() => ({
      valid: false,
      kitId: undefined,
      errors: ['Invalid file'],
      warnings: [],
    }));

    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        selectKit: mockSelectKit,
        uploadKit: mockUploadKit,
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(
      <RecommendationKitStep onContinue={mockOnContinue} onBack={mockOnBack} />,
    );

    // Simulate file upload with invalid result
    const fileInput = screen.getByTestId('kit-file-input');
    const validKitFile = {
      meta: {
        name: 'Uploaded Kit',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      items: [
        {
          id: 'test-item',
          names: { en: 'Test Item', fi: 'Testituote' },
          category: 'food',
          baseQuantity: 1,
          unit: 'pieces',
          scaleWithPeople: true,
          scaleWithDays: false,
        },
      ],
    };
    const file = new File([JSON.stringify(validKitFile)], 'test.json', {
      type: 'application/json',
    });
    // Mock file.text() method
    (file as { text: () => Promise<string> }).text = vi
      .fn()
      .mockResolvedValue(JSON.stringify(validKitFile));
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockUploadKit).toHaveBeenCalled();
      // Should not auto-select when upload is invalid
      expect(mockSelectKit).not.toHaveBeenCalled();
    });
  });
});
