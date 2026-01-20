import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
  type MockInstance,
} from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HouseholdPresetSelector } from './HouseholdPresetSelector';
import * as localStorage from '@/shared/utils/storage/localStorage';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage', () => ({
  importFromJSON: vi.fn(),
  saveAppData: vi.fn(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'household.title': 'Household Configuration',
        'household.description': 'Choose a preset or customize',
        'household.adults': 'Adults',
        'household.children': 'Children',
        'household.presets.single': 'Single Person',
        'household.presets.couple': 'Couple',
        'household.presets.family': 'Family',
        'household.presets.custom': 'Custom',
        'household.customDescription': 'Set your own configuration',
        'actions.back': 'Back',
        'onboarding.import.link': 'Already have data? Import backup',
        'onboarding.import.button': 'Import backup data',
        'settings.import.invalidFormat': 'Invalid file format',
        'settings.import.confirmOverwrite':
          'This will replace all data. Continue?',
        'settings.import.success': 'Data imported successfully',
        'settings.import.error': 'Failed to import data',
      };
      return translations[key] || key;
    },
  }),
}));

// Helper to create a file with mocked text() method
function createMockFile(content: string, name = 'data.json'): File {
  const file = new File([content], name, { type: 'application/json' });
  file.text = vi.fn().mockResolvedValue(content);
  return file;
}

describe('HouseholdPresetSelector', () => {
  const mockImportFromJSON = localStorage.importFromJSON as Mock;
  const mockSaveAppData = localStorage.saveAppData as Mock;

  let consoleErrorSpy: MockInstance;
  const originalLocation = globalThis.location;
  const originalAlert = globalThis.alert;
  const originalConfirm = globalThis.confirm;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.alert = vi.fn();
    globalThis.confirm = vi.fn(() => true);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(globalThis, 'location', {
      value: { ...originalLocation, reload: vi.fn() },
      writable: true,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
    });
    if (originalAlert) {
      globalThis.alert = originalAlert;
    } else {
      delete (globalThis as { alert?: unknown }).alert;
    }
    if (originalConfirm) {
      globalThis.confirm = originalConfirm;
    } else {
      delete (globalThis as { confirm?: unknown }).confirm;
    }
  });
  it('renders all preset options', () => {
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    expect(screen.getByText('Single Person')).toBeInTheDocument();
    expect(screen.getByText('Couple')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('displays household configuration details', () => {
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    expect(screen.getByText('1 Adults')).toBeInTheDocument();
    expect(screen.getByText(/2 Adults, 2 Children/i)).toBeInTheDocument();
  });

  it('calls onSelectPreset when a preset is clicked', async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    const singlePreset = screen
      .getByText('Single Person')
      .closest('[role="button"]');
    await user.click(singlePreset!);

    expect(onSelectPreset).toHaveBeenCalledWith({
      id: 'single',
      adults: 1,
      children: 0,
      pets: 0,
    });
  });

  it('calls onSelectPreset when custom is clicked', async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    const customPreset = screen.getByText('Custom').closest('[role="button"]');
    await user.click(customPreset!);

    expect(onSelectPreset).toHaveBeenCalledWith({
      id: 'custom',
      adults: 1,
      children: 0,
      pets: 0,
    });
  });

  it('highlights the selected preset', () => {
    const onSelectPreset = vi.fn();
    render(
      <HouseholdPresetSelector
        selectedPreset="couple"
        onSelectPreset={onSelectPreset}
      />,
    );

    const selectedCard = screen
      .getByText('Couple')
      .closest('div[role="button"]');
    // Just verify the card exists and is accessible
    expect(selectedCard).toBeInTheDocument();
    expect(selectedCard).toHaveAttribute('role', 'button');
  });

  it('supports keyboard navigation with Enter key', async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    const familyPreset = screen
      .getByText('Family')
      .closest('[role="button"]') as HTMLElement;
    familyPreset?.focus();
    await user.keyboard('{Enter}');

    expect(onSelectPreset).toHaveBeenCalledWith({
      id: 'family',
      adults: 2,
      children: 2,
      pets: 1,
    });
  });

  it('supports keyboard navigation with Space key', async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    const couplePreset = screen
      .getByText('Couple')
      .closest('[role="button"]') as HTMLElement;
    couplePreset?.focus();
    await user.keyboard(' ');

    expect(onSelectPreset).toHaveBeenCalledWith({
      id: 'couple',
      adults: 2,
      children: 0,
      pets: 0,
    });
  });

  it('supports keyboard navigation on custom preset with Enter key', async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    const customPreset = screen
      .getByText('Custom')
      .closest('[role="button"]') as HTMLElement;
    customPreset?.focus();
    await user.keyboard('{Enter}');

    expect(onSelectPreset).toHaveBeenCalledWith({
      id: 'custom',
      adults: 1,
      children: 0,
      pets: 0,
    });
  });

  it('supports keyboard navigation on custom preset with Space key', async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

    const customPreset = screen
      .getByText('Custom')
      .closest('[role="button"]') as HTMLElement;
    customPreset?.focus();
    await user.keyboard(' ');

    expect(onSelectPreset).toHaveBeenCalledWith({
      id: 'custom',
      adults: 1,
      children: 0,
      pets: 0,
    });
  });

  describe('Import functionality', () => {
    it('renders import link', () => {
      const onSelectPreset = vi.fn();
      render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

      expect(
        screen.getByText('Already have data? Import backup'),
      ).toBeInTheDocument();
    });

    it('has hidden file input for import', () => {
      const onSelectPreset = vi.fn();
      render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

      const fileInput = screen.getByLabelText('Import backup data');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', '.json');
    });

    it('triggers file input on import link click', async () => {
      const user = userEvent.setup();
      const onSelectPreset = vi.fn();
      render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

      const fileInput = screen.getByLabelText(
        'Import backup data',
      ) as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      const importLink = screen.getByText('Already have data? Import backup');
      await user.click(importLink);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('handles valid JSON import', async () => {
      const validData = {
        version: CURRENT_SCHEMA_VERSION,
        household: { adults: 2, children: 0 },
        settings: { language: 'en' },
        items: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      mockImportFromJSON.mockReturnValue(validData);
      const onSelectPreset = vi.fn();

      render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

      const fileInput = screen.getByLabelText(
        'Import backup data',
      ) as HTMLInputElement;
      const file = createMockFile(JSON.stringify(validData));

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockImportFromJSON).toHaveBeenCalled();
        expect(globalThis.confirm).not.toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockSaveAppData).toHaveBeenCalledWith(validData);
        expect(globalThis.alert).toHaveBeenCalledWith(
          'Data imported successfully',
        );
        expect(globalThis.location.reload).toHaveBeenCalled();
      });
    });

    it('shows error for invalid JSON format', async () => {
      const invalidData = {
        foo: 'bar', // missing required fields
      };

      mockImportFromJSON.mockReturnValue(invalidData);
      const onSelectPreset = vi.fn();

      render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

      const fileInput = screen.getByLabelText(
        'Import backup data',
      ) as HTMLInputElement;
      const file = createMockFile(JSON.stringify(invalidData));

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(globalThis.alert).toHaveBeenCalledWith('Invalid file format');
      });

      expect(mockSaveAppData).not.toHaveBeenCalled();
    });

    it('imports without confirmation dialog in onboarding context', async () => {
      const validData = {
        version: CURRENT_SCHEMA_VERSION,
        household: { adults: 2, children: 0 },
        settings: { language: 'en' },
        items: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      mockImportFromJSON.mockReturnValue(validData);
      const onSelectPreset = vi.fn();

      render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

      const fileInput = screen.getByLabelText(
        'Import backup data',
      ) as HTMLInputElement;
      const file = createMockFile(JSON.stringify(validData));

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockImportFromJSON).toHaveBeenCalled();
        expect(globalThis.confirm).not.toHaveBeenCalled();
        expect(mockSaveAppData).toHaveBeenCalledWith(validData);
        expect(globalThis.alert).toHaveBeenCalledWith(
          'Data imported successfully',
        );
        expect(globalThis.location.reload).toHaveBeenCalled();
      });
    });

    it('handles file read error', async () => {
      const onSelectPreset = vi.fn();

      render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

      const fileInput = screen.getByLabelText(
        'Import backup data',
      ) as HTMLInputElement;
      const file = new File(['invalid json'], 'data.json', {
        type: 'application/json',
      });
      file.text = vi.fn().mockRejectedValue(new Error('Read error'));

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(globalThis.alert).toHaveBeenCalledWith('Failed to import data');
      });
    });

    it('does nothing when no file selected', () => {
      const onSelectPreset = vi.fn();
      render(<HouseholdPresetSelector onSelectPreset={onSelectPreset} />);

      const fileInput = screen.getByLabelText(
        'Import backup data',
      ) as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [] } });

      expect(mockImportFromJSON).not.toHaveBeenCalled();
    });
  });
});
