import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportButton } from './ExportButton';
import * as localStorage from '@/shared/utils/storage/localStorage';
import { createMockAppData } from '@/shared/utils/test/factories';
import { createItemId, createCategoryId } from '@/shared/types';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage', () => ({
  getAppData: vi.fn(),
  saveAppData: vi.fn(),
  exportToJSONSelective: vi.fn(),
  createDefaultAppData: vi.fn(() => createMockAppData()),
}));

vi.mock('@/shared/hooks/useNotification', () => ({
  useNotification: () => ({ showNotification: vi.fn() }),
}));

describe('ExportButton', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.alert = vi.fn();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();

    // Set default mock return values
    (localStorage.getAppData as Mock).mockReturnValue(createMockAppData());
    (localStorage.createDefaultAppData as Mock).mockReturnValue(
      createMockAppData(),
    );

    // Mock anchor element click to prevent jsdom navigation errors
    // Access prototype method directly to avoid circular reference
    const originalCreateElement =
      Document.prototype.createElement.bind(document);
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
    // Defensively restore the spy only if it exists and has mockRestore
    if (createElementSpy?.mockRestore) {
      createElementSpy.mockRestore();
    }
  });

  it('should render export button', () => {
    render(<ExportButton />);

    expect(screen.getByText('settings.export.button')).toBeInTheDocument();
    expect(screen.getByText('settings.export.description')).toBeInTheDocument();
  });

  it('should show alert when no data to export', () => {
    (localStorage.getAppData as Mock).mockReturnValue(null);

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    expect(globalThis.alert).toHaveBeenCalledWith('settings.export.noData');
  });

  it('should open selection modal when data is available', async () => {
    const mockData = createMockAppData({
      household: {
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
    });

    (localStorage.getAppData as Mock).mockReturnValue(mockData);

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    // Modal should open with selection options
    await waitFor(() => {
      expect(
        screen.getByText('settings.exportSelection.title'),
      ).toBeInTheDocument();
    });
  });

  it('should export data when user confirms selection', async () => {
    const user = userEvent.setup();
    const mockData = createMockAppData({
      household: {
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
    });

    (localStorage.getAppData as Mock).mockReturnValue(mockData);
    (localStorage.exportToJSONSelective as Mock).mockReturnValue(
      JSON.stringify(mockData),
    );

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    // Wait for modal to open
    await waitFor(() => {
      expect(
        screen.getByText('settings.exportSelection.title'),
      ).toBeInTheDocument();
    });

    // Click export button in modal
    const exportButton = screen.getByText(
      'settings.exportSelection.exportButton',
    );
    await user.click(exportButton);

    await waitFor(() => {
      expect(localStorage.exportToJSONSelective).toHaveBeenCalled();
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('should close modal when user cancels', async () => {
    const user = userEvent.setup();
    const mockData = createMockAppData({
      household: {
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
    });

    (localStorage.getAppData as Mock).mockReturnValue(mockData);

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    // Wait for modal to open
    await waitFor(() => {
      expect(
        screen.getByText('settings.exportSelection.title'),
      ).toBeInTheDocument();
    });

    // Click cancel button in modal
    const cancelButton = screen.getByText('common.cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText('settings.exportSelection.title'),
      ).not.toBeInTheDocument();
    });
  });

  it('should show section counts in modal', async () => {
    const mockData = createMockAppData({
      household: {
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
      items: [
        {
          id: createItemId('1'),
          name: 'Test Item 1',
          itemType: 'custom',
          categoryId: createCategoryId('food'),
          quantity: 1,
          unit: 'pieces',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: createItemId('2'),
          name: 'Test Item 2',
          itemType: 'custom',
          categoryId: createCategoryId('food'),
          quantity: 2,
          unit: 'pieces',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ],
    });

    (localStorage.getAppData as Mock).mockReturnValue(mockData);

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    // Wait for modal to open
    await waitFor(() => {
      expect(
        screen.getByText('settings.exportSelection.title'),
      ).toBeInTheDocument();
    });

    // Should show item count - use getAllByText since multiple sections may have counts
    const counts = screen.getAllByText('(2)');
    expect(counts.length).toBeGreaterThan(0);
  });

  it('should have all sections selected by default', async () => {
    const mockData = createMockAppData({
      household: {
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
    });

    (localStorage.getAppData as Mock).mockReturnValue(mockData);

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    // Wait for modal to open
    await waitFor(() => {
      expect(
        screen.getByText('settings.exportSelection.title'),
      ).toBeInTheDocument();
    });

    // Check that household and settings sections are checked (they always have data)
    const checkboxes = screen.getAllByRole('checkbox');
    const enabledCheckboxes = checkboxes.filter(
      (cb) => !cb.hasAttribute('disabled'),
    );

    enabledCheckboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });
});
