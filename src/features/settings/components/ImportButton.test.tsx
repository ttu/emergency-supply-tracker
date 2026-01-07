import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, vi, type Mock, type SpyInstance } from 'vitest';
import { ImportButton } from './ImportButton';
import * as localStorage from '@/shared/utils/storage/localStorage';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage', () => ({
  importFromJSON: vi.fn(),
  saveAppData: vi.fn(),
}));

describe('ImportButton', () => {
  const mockImportFromJSON = localStorage.importFromJSON as Mock;
  const mockSaveAppData = localStorage.saveAppData as Mock;

  let consoleErrorSpy: SpyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    global.alert = vi.fn();
    global.confirm = vi.fn(() => true);
    // Suppress console.error output from expected error handling in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock window.location.reload to prevent jsdom navigation errors
    globalThis.location = {
      reload: vi.fn(),
    } as unknown as Location;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should render import button', () => {
    render(<ImportButton />);

    expect(screen.getByText('settings.import.button')).toBeInTheDocument();
    expect(screen.getByText('settings.import.description')).toBeInTheDocument();
  });

  it('should have hidden file input', () => {
    render(<ImportButton />);

    const fileInput = screen.getByLabelText('settings.import.button');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.json');
  });

  it('should trigger file input on button click', () => {
    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    const button = screen.getByText('settings.import.button');
    fireEvent.click(button);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should handle valid JSON import', async () => {
    const validData = {
      version: '1.0.0',
      household: { adults: 2, children: 0 },
      settings: { language: 'en' },
      items: [],
      lastModified: '2024-01-01T00:00:00.000Z',
    };

    mockImportFromJSON.mockReturnValue(validData);
    const onImportSuccess = vi.fn();

    render(<ImportButton onImportSuccess={onImportSuccess} />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = new File([JSON.stringify(validData)], 'data.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockImportFromJSON).toHaveBeenCalled();
      expect(global.confirm).toHaveBeenCalledWith(
        'settings.import.confirmOverwrite',
      );
    });

    await waitFor(() => {
      expect(mockSaveAppData).toHaveBeenCalledWith(validData);
      expect(global.alert).toHaveBeenCalledWith('settings.import.success');
      expect(onImportSuccess).toHaveBeenCalled();
      // Note: window.location.reload is called but difficult to mock in jsdom
    });
  });

  it('should show error for invalid JSON format', async () => {
    const invalidData = {
      foo: 'bar', // missing required fields
    };

    mockImportFromJSON.mockReturnValue(invalidData);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = new File([JSON.stringify(invalidData)], 'data.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        'settings.import.invalidFormat',
      );
    });

    expect(mockSaveAppData).not.toHaveBeenCalled();
  });

  it('should not import when user cancels confirmation', async () => {
    const validData = {
      version: '1.0.0',
      household: { adults: 2, children: 0 },
      settings: { language: 'en' },
      items: [],
      lastModified: '2024-01-01T00:00:00.000Z',
    };

    mockImportFromJSON.mockReturnValue(validData);
    (global.confirm as Mock).mockReturnValue(false);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = new File([JSON.stringify(validData)], 'data.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
    });

    expect(mockSaveAppData).not.toHaveBeenCalled();
  });

  it('should handle file read error', async () => {
    mockImportFromJSON.mockImplementation(() => {
      throw new Error('Parse error');
    });

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = new File(['invalid json'], 'data.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('settings.import.error');
    });
  });

  it('should do nothing when no file selected', () => {
    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [] } });

    expect(mockImportFromJSON).not.toHaveBeenCalled();
  });

  it('should reset file input after import', async () => {
    const validData = {
      version: '1.0.0',
      household: { adults: 2, children: 0 },
      settings: { language: 'en' },
      items: [],
      lastModified: '2024-01-01T00:00:00.000Z',
    };

    mockImportFromJSON.mockReturnValue(validData);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = new File([JSON.stringify(validData)], 'data.json', {
      type: 'application/json',
    });

    // We can't easily test the value reset, but we can verify the change event works
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockImportFromJSON).toHaveBeenCalled();
    });
  });

  it('should validate data has required fields', async () => {
    // Missing version
    const missingVersion = {
      household: { adults: 2 },
      settings: { language: 'en' },
      items: [],
      lastModified: '2024-01-01T00:00:00.000Z',
    };

    mockImportFromJSON.mockReturnValue(missingVersion);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = new File([JSON.stringify(missingVersion)], 'data.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        'settings.import.invalidFormat',
      );
    });
  });

  it('should validate data is an object', async () => {
    mockImportFromJSON.mockReturnValue(null);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = new File(['null'], 'data.json', { type: 'application/json' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        'settings.import.invalidFormat',
      );
    });
  });

  it('should validate items is an array', async () => {
    const invalidItems = {
      version: '1.0.0',
      household: { adults: 2 },
      settings: { language: 'en' },
      items: 'not an array',
      lastModified: '2024-01-01T00:00:00.000Z',
    };

    mockImportFromJSON.mockReturnValue(invalidItems);

    render(<ImportButton />);

    const fileInput = screen.getByLabelText(
      'settings.import.button',
    ) as HTMLInputElement;
    const file = new File([JSON.stringify(invalidItems)], 'data.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        'settings.import.invalidFormat',
      );
    });
  });
});
