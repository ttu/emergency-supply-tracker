import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from './ExportButton';
import * as localStorage from '@/shared/utils/storage/localStorage';
import { createMockAppData } from '@/shared/utils/test/factories';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage');

describe('ExportButton', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.alert = vi.fn();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();

    // Mock anchor element click to prevent jsdom navigation errors
    // Access prototype method directly to avoid circular reference
    const originalCreateElement =
      HTMLDocument.prototype.createElement.bind(document);
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
    createElementSpy.mockRestore();
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

  it('should export data when available', () => {
    const mockData = createMockAppData({
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
    });

    (localStorage.getAppData as Mock).mockReturnValue(mockData);
    (localStorage.exportToJSON as Mock).mockReturnValue(
      JSON.stringify(mockData),
    );

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    expect(localStorage.exportToJSON).toHaveBeenCalledWith(mockData);
    expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
  });
});
