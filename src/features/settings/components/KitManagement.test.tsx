import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KitManagement } from './KitManagement';
import * as templatesModule from '@/features/templates';
import type { KitInfo, RecommendedItemDefinition } from '@/shared/types';
import { createProductTemplateId, createQuantity } from '@/shared/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options?.name) return `${key}: ${options.name}`;
      if (options?.count !== undefined) return `${key} (${options.count})`;
      if (options?.error) return `${key}: ${options.error}`;
      // Return expected translation values for specific keys
      if (key === 'kits.defaultFileName') return 'recommendations';
      return key;
    },
    i18n: {
      language: 'en',
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
    baseQuantity: createQuantity(3),
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
  forkBuiltInKit: vi.fn(() => 'custom:forked-kit-uuid' as const),
  updateCurrentKitMeta: vi.fn(),
  addItemToKit: vi.fn(),
  updateItemInKit: vi.fn(),
  removeItemFromKit: vi.fn(),
  exportRecommendedItems: vi.fn(() => ({
    meta: { name: 'Test Kit', version: '1.0.0', createdAt: '2024-01-01' },
    items: [],
  })),
  customRecommendationsInfo: undefined,
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
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      mockContext as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    // Mock URL and document methods for export
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    globalThis.URL.revokeObjectURL = vi.fn();

    // Store original createElement before spying
    originalCreateElement = document.createElement.bind(document);
    // Mock createElement to return proper DOM elements
    createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          // Mock click to prevent navigation
          element.click = vi.fn();
        }
        return element;
      });
  });

  afterEach(() => {
    if (createElementSpy?.mockRestore) {
      createElementSpy.mockRestore();
    }
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
        selectedKitId: undefined,
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

  it('should sanitize filename with reserved characters', () => {
    let capturedLink: HTMLAnchorElement | null =
      null as HTMLAnchorElement | null;

    createElementSpy.mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = vi.fn();
        capturedLink = element as unknown as HTMLAnchorElement;
      }
      return element;
    });

    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        availableKits: [
          {
            id: 'custom:test-kit',
            name: String.raw`Kit/With\Invalid:Characters*?"<>|`,
            description: 'Test',
            itemCount: 10,
            isBuiltIn: false,
          },
        ],
        selectedKitId: 'custom:test-kit',
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(<KitManagement />);
    fireEvent.click(screen.getByTestId('export-kit-button'));

    // Filename should be sanitized (reserved chars replaced with hyphens)
    expect(capturedLink?.download).toBe('Kit-With-Invalid-Characters.json');
  });

  it('should sanitize filename with control characters', () => {
    let capturedLink: HTMLAnchorElement | null =
      null as HTMLAnchorElement | null;

    createElementSpy.mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = vi.fn();
        capturedLink = element as unknown as HTMLAnchorElement;
      }
      return element;
    });

    // Create a name with control characters (tab, newline)
    const nameWithControlChars = `Kit\tWith\nControl${String.fromCodePoint(0)}Chars`;

    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        availableKits: [
          {
            id: 'custom:test-kit',
            name: nameWithControlChars,
            description: 'Test',
            itemCount: 10,
            isBuiltIn: false,
          },
        ],
        selectedKitId: 'custom:test-kit',
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(<KitManagement />);
    fireEvent.click(screen.getByTestId('export-kit-button'));

    // Control characters should be replaced with hyphens
    expect(capturedLink?.download).toBe('Kit-With-Control-Chars.json');
  });

  it('should collapse runs of replacement characters', () => {
    let capturedLink: HTMLAnchorElement | null =
      null as HTMLAnchorElement | null;

    createElementSpy.mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = vi.fn();
        capturedLink = element as unknown as HTMLAnchorElement;
      }
      return element;
    });

    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        availableKits: [
          {
            id: 'custom:test-kit',
            name: String.raw`Kit///With\\Multiple---Separators`,
            description: 'Test',
            itemCount: 10,
            isBuiltIn: false,
          },
        ],
        selectedKitId: 'custom:test-kit',
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(<KitManagement />);
    fireEvent.click(screen.getByTestId('export-kit-button'));

    // Multiple consecutive separators should be collapsed to single hyphen
    expect(capturedLink?.download).toBe('Kit-With-Multiple-Separators.json');
  });

  it('should trim whitespace and remove leading/trailing hyphens', () => {
    let capturedLink: HTMLAnchorElement | null =
      null as HTMLAnchorElement | null;

    createElementSpy.mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = vi.fn();
        capturedLink = element as unknown as HTMLAnchorElement;
      }
      return element;
    });

    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        availableKits: [
          {
            id: 'custom:test-kit',
            name: '  Kit Name  ',
            description: 'Test',
            itemCount: 10,
            isBuiltIn: false,
          },
        ],
        selectedKitId: 'custom:test-kit',
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(<KitManagement />);
    fireEvent.click(screen.getByTestId('export-kit-button'));

    // Whitespace should be trimmed
    expect(capturedLink?.download).toBe('Kit Name.json');
  });

  it('should fall back to recommendations if sanitized name is empty', () => {
    let capturedLink: HTMLAnchorElement | null =
      null as HTMLAnchorElement | null;

    createElementSpy.mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = vi.fn();
        capturedLink = element as unknown as HTMLAnchorElement;
      }
      return element;
    });

    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        availableKits: [
          {
            id: 'custom:test-kit',
            name: '///',
            description: 'Test',
            itemCount: 10,
            isBuiltIn: false,
          },
        ],
        selectedKitId: 'custom:test-kit',
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(<KitManagement />);
    fireEvent.click(screen.getByTestId('export-kit-button'));

    // Should fall back to 'recommendations' if name becomes empty after sanitization
    expect(capturedLink?.download).toBe('recommendations.json');
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
        selectedKitId: undefined,
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
      .find((btn) => btn.getAttribute('aria-label') === 'Close notification');

    expect(toastCloseButton).toBeDefined();
    expect(toastCloseButton).not.toBeNull();

    fireEvent.click(toastCloseButton!);

    await waitFor(() => {
      expect(screen.queryByText(/kits.selected/)).not.toBeInTheDocument();
    });
  });

  it('should show error toast when kit upload fails', async () => {
    const mockUploadKit = vi.fn(() => ({
      valid: false,
      kitId: undefined,
      errors: ['Invalid file format'],
      warnings: [],
    }));

    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        uploadKit: mockUploadKit,
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(<KitManagement />);

    // Simulate file upload error by calling handleUploadKit directly
    // We need to trigger the upload through KitSelector
    const fileInput = screen.getByTestId('kit-file-input');
    const file = new File(['invalid json'], 'test.json', {
      type: 'application/json',
    });
    // Mock file.text() method
    (file as { text: () => Promise<string> }).text = vi
      .fn()
      .mockResolvedValue('invalid json');
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    // Mock alert to prevent actual alert from showing
    globalThis.alert = vi.fn();

    fireEvent.change(fileInput);

    await waitFor(() => {
      // The error should be shown via alert (from KitSelector) or toast
      expect(globalThis.alert).toHaveBeenCalled();
    });
  });

  it('should show error toast when uploadKit returns errors', async () => {
    const mockUploadKit = vi.fn(() => ({
      valid: false,
      kitId: undefined,
      errors: ['Validation failed'],
      warnings: [],
    }));

    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        uploadKit: mockUploadKit,
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(<KitManagement />);

    // Create a valid kit file
    const validKitFile = {
      meta: {
        name: 'Test Kit',
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      items: [
        {
          id: 'test-item',
          names: { en: 'Test Item', fi: 'Testituote' },
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: true,
          scaleWithDays: false,
        },
      ],
    };

    // We need to trigger handleUploadKit - this is done through KitSelector
    // For now, let's test the error path by directly calling the handler
    // Actually, we can't easily test this without exposing the handler
    // Let's test it through the file upload flow
    const fileInput = screen.getByTestId('kit-file-input');
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
      // Error toast should appear
      expect(screen.getByText(/kits.uploadError/)).toBeInTheDocument();
    });
  });

  it('should handle export when selectedKit is null', () => {
    createElementSpy.mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = vi.fn();
      }
      return element;
    });

    vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
      createMockContext({
        selectedKitId: undefined,
        availableKits: [],
      }) as ReturnType<typeof templatesModule.useRecommendedItems>,
    );

    render(<KitManagement />);

    // Export button should be disabled, but test the fallback logic
    const exportButton = screen.getByTestId('export-kit-button');
    expect(exportButton).toBeDisabled();
  });

  describe('KitEditor integration', () => {
    it('should have View/Edit Items button', () => {
      render(<KitManagement />);

      expect(screen.getByTestId('view-edit-items-button')).toBeInTheDocument();
    });

    it('should enable View/Edit Items button when kit is selected', () => {
      render(<KitManagement />);

      expect(screen.getByTestId('view-edit-items-button')).not.toBeDisabled();
    });

    it('should disable View/Edit Items button when no kit is selected', () => {
      vi.spyOn(templatesModule, 'useRecommendedItems').mockReturnValue(
        createMockContext({
          selectedKitId: undefined,
        }) as ReturnType<typeof templatesModule.useRecommendedItems>,
      );

      render(<KitManagement />);

      expect(screen.getByTestId('view-edit-items-button')).toBeDisabled();
    });

    it('should open KitEditor modal when View/Edit Items button is clicked', async () => {
      render(<KitManagement />);

      fireEvent.click(screen.getByTestId('view-edit-items-button'));

      await waitFor(() => {
        expect(screen.getByTestId('kit-editor-modal')).toBeInTheDocument();
      });
    });

    it('should close KitEditor modal when close button is clicked', async () => {
      render(<KitManagement />);

      // Open the modal
      fireEvent.click(screen.getByTestId('view-edit-items-button'));

      await waitFor(() => {
        expect(screen.getByTestId('kit-editor-modal')).toBeInTheDocument();
      });

      // Close the modal
      fireEvent.click(screen.getByTestId('kit-editor-close'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('kit-editor-modal'),
        ).not.toBeInTheDocument();
      });
    });
  });
});
