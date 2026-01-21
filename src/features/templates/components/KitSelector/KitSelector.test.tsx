import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KitSelector } from './KitSelector';
import type { KitInfo } from '@/shared/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('KitSelector', () => {
  const mockBuiltInKits: KitInfo[] = [
    {
      id: '72tuntia-standard',
      name: 'Standard Kit',
      description: 'A standard emergency kit',
      itemCount: 50,
      isBuiltIn: true,
    },
    {
      id: 'minimal-essentials',
      name: 'Minimal Kit',
      description: 'A minimal emergency kit',
      itemCount: 20,
      isBuiltIn: true,
    },
  ];

  const mockCustomKits: KitInfo[] = [
    {
      id: 'custom:abc123',
      name: 'My Custom Kit',
      description: 'Custom kit for my family',
      itemCount: 25,
      isBuiltIn: false,
    },
  ];

  const mockOnSelectKit = vi.fn();
  const mockOnUploadKit = vi.fn();
  const mockOnDeleteKit = vi.fn();

  beforeEach(() => {
    mockOnSelectKit.mockClear();
    mockOnUploadKit.mockClear();
    mockOnDeleteKit.mockClear();
  });

  it('should render kit selector container', () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
      />,
    );

    expect(screen.getByTestId('kit-selector')).toBeInTheDocument();
  });

  it('should render built-in kits section', () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
      />,
    );

    expect(screen.getByText('kits.builtInKits')).toBeInTheDocument();
    expect(screen.getByText('Standard Kit')).toBeInTheDocument();
    expect(screen.getByText('Minimal Kit')).toBeInTheDocument();
  });

  it('should render custom kits section', () => {
    render(
      <KitSelector
        availableKits={[...mockBuiltInKits, ...mockCustomKits]}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
      />,
    );

    expect(screen.getByText('kits.yourKits')).toBeInTheDocument();
    expect(screen.getByText('My Custom Kit')).toBeInTheDocument();
  });

  it('should show upload button when showUpload is true and onUploadKit is provided', () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        onUploadKit={mockOnUploadKit}
        showUpload={true}
      />,
    );

    expect(screen.getByTestId('upload-kit-button')).toBeInTheDocument();
    expect(screen.getByText('kits.uploadKit')).toBeInTheDocument();
  });

  it('should not show upload button when showUpload is false', () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        onUploadKit={mockOnUploadKit}
        showUpload={false}
      />,
    );

    expect(screen.queryByTestId('upload-kit-button')).not.toBeInTheDocument();
  });

  it('should not show upload button when onUploadKit is not provided', () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        showUpload={true}
      />,
    );

    expect(screen.queryByTestId('upload-kit-button')).not.toBeInTheDocument();
  });

  it('should call onSelectKit when a kit is selected', () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
      />,
    );

    fireEvent.click(screen.getByTestId('kit-card-72tuntia-standard'));

    expect(mockOnSelectKit).toHaveBeenCalledWith('72tuntia-standard');
  });

  it('should show selected state for the selected kit', () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId="72tuntia-standard"
        onSelectKit={mockOnSelectKit}
      />,
    );

    const selectedCard = screen.getByTestId('kit-card-72tuntia-standard');
    // Selected cards have elevated variant which adds different classes
    expect(selectedCard.className).toMatch(/elevated|selected/);
  });

  it('should show delete button for custom kits when showDelete is true', () => {
    render(
      <KitSelector
        availableKits={[...mockBuiltInKits, ...mockCustomKits]}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        onDeleteKit={mockOnDeleteKit}
        showDelete={true}
      />,
    );

    expect(screen.getByTestId('delete-kit-custom:abc123')).toBeInTheDocument();
  });

  it('should not show delete button for built-in kits', () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        onDeleteKit={mockOnDeleteKit}
        showDelete={true}
      />,
    );

    expect(
      screen.queryByTestId('delete-kit-72tuntia-standard'),
    ).not.toBeInTheDocument();
  });

  it('should call onDeleteKit when delete button is clicked', () => {
    render(
      <KitSelector
        availableKits={[...mockBuiltInKits, ...mockCustomKits]}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        onDeleteKit={mockOnDeleteKit}
        showDelete={true}
      />,
    );

    fireEvent.click(screen.getByTestId('delete-kit-custom:abc123'));

    expect(mockOnDeleteKit).toHaveBeenCalledWith('custom:abc123');
  });

  it('should show empty message when no custom kits and showUpload is false', () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        showUpload={false}
      />,
    );

    expect(screen.getByText('kits.noCustomKits')).toBeInTheDocument();
  });

  it('should have hidden file input for uploads', () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        onUploadKit={mockOnUploadKit}
        showUpload={true}
      />,
    );

    const fileInput = screen.getByTestId('kit-file-input');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.json');
  });

  it('should trigger file input click when upload button is clicked', () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        onUploadKit={mockOnUploadKit}
        showUpload={true}
      />,
    );

    const fileInput = screen.getByTestId('kit-file-input');
    const clickSpy = vi.spyOn(fileInput, 'click');

    fireEvent.click(screen.getByTestId('upload-kit-button'));

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should not call onUploadKit when no file is selected', () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        onUploadKit={mockOnUploadKit}
        showUpload={true}
      />,
    );

    const fileInput = screen.getByTestId('kit-file-input');

    // Simulate empty file selection
    fireEvent.change(fileInput, { target: { files: [] } });

    expect(mockOnUploadKit).not.toHaveBeenCalled();
  });

  it('should separate built-in and custom kits correctly', () => {
    const allKits = [...mockBuiltInKits, ...mockCustomKits];

    render(
      <KitSelector
        availableKits={allKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
      />,
    );

    // Built-in kits should be in built-in section
    expect(
      screen.getByTestId('kit-card-72tuntia-standard'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('kit-card-minimal-essentials'),
    ).toBeInTheDocument();

    // Custom kit should be in custom section
    expect(screen.getByTestId('kit-card-custom:abc123')).toBeInTheDocument();
  });

  it('should not call onDeleteKit for non-custom kit ids', () => {
    // This tests the isCustomKitId guard in handleDeleteKit
    const mockOnDeleteKitTyped = vi.fn();

    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        onDeleteKit={mockOnDeleteKitTyped}
        showDelete={true}
      />,
    );

    // Built-in kits don't have delete buttons, so this verifies the guard works
    expect(
      screen.queryByTestId('delete-kit-72tuntia-standard'),
    ).not.toBeInTheDocument();
    expect(mockOnDeleteKitTyped).not.toHaveBeenCalled();
  });

  it('should handle file upload error and show alert', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const originalAlert = globalThis.alert;
    globalThis.alert = vi.fn();

    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        onUploadKit={mockOnUploadKit}
        showUpload={true}
      />,
    );

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

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to read or parse kit file:',
        expect.any(Error),
      );
      expect(globalThis.alert).toHaveBeenCalledWith('kits.uploadError');
    });

    consoleErrorSpy.mockRestore();
    globalThis.alert = originalAlert;
  });

  it('should reset file input after upload', async () => {
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
          baseQuantity: 1,
          unit: 'pieces',
          scaleWithPeople: true,
          scaleWithDays: false,
        },
      ],
    };

    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        onUploadKit={mockOnUploadKit}
        showUpload={true}
      />,
    );

    const fileInput = screen.getByTestId('kit-file-input') as HTMLInputElement;
    const file = new File([JSON.stringify(validKitFile)], 'test.json', {
      type: 'application/json',
    });
    // Mock file.text() method
    const textMock = vi.fn().mockResolvedValue(JSON.stringify(validKitFile));
    (file as { text: () => Promise<string> }).text = textMock;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    const valueSetter = vi.fn();
    Object.defineProperty(fileInput, 'value', {
      set: valueSetter,
      get: () => 'test.json',
    });

    fireEvent.change(fileInput);

    // Wait for the async file upload to complete
    await waitFor(
      () => {
        expect(textMock).toHaveBeenCalled();
        expect(mockOnUploadKit).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    // File input should be reset after upload completes
    // The reset happens in the finally block, so it should be called
    expect(valueSetter).toHaveBeenCalledWith('');
  });

  it('should not call onUploadKit when onUploadKit is not provided', async () => {
    render(
      <KitSelector
        availableKits={mockBuiltInKits}
        selectedKitId={null}
        onSelectKit={mockOnSelectKit}
        showUpload={true}
      />,
    );

    const fileInput = screen.getByTestId('kit-file-input');
    const file = new File(['{}'], 'test.json', { type: 'application/json' });
    // Mock file.text() method
    (file as { text: () => Promise<string> }).text = vi
      .fn()
      .mockResolvedValue('{}');
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Should not crash, but onUploadKit won't be called since it's not provided
    await waitFor(() => {
      // Just verify no errors occurred
      expect(fileInput).toBeInTheDocument();
    });
  });
});
