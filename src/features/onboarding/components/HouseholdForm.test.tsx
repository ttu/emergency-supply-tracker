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
import { HouseholdForm } from './HouseholdForm';
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
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'household.title': 'Household Configuration',
        'household.adults': 'Adults',
        'household.children': 'Children',
        'household.supplyDays': 'Supply Duration (days)',
        'household.useFreezer': 'Use Freezer',
        'household.errors.adultsMin': 'At least {{min}} adult is required',
        'household.errors.adultsMax': 'Maximum {{max}} adults allowed',
        'household.errors.childrenNegative': 'Cannot be negative',
        'household.errors.childrenMax': 'Maximum {{max}} children allowed',
        'household.errors.supplyDaysMin': 'At least {{min}} day is required',
        'household.errors.supplyDaysMax': 'Maximum {{max}} days allowed',
        'actions.save': 'Save',
        'actions.back': 'Back',
        'onboarding.import.link': 'Already have data? Import backup',
        'onboarding.import.button': 'Import backup data',
        'settings.import.invalidFormat': 'Invalid file format',
        'settings.import.confirmOverwrite':
          'This will replace all data. Continue?',
        'settings.import.success': 'Data imported successfully',
        'settings.import.error': 'Failed to import data',
      };
      let result = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          result = result.replace(`{{${paramKey}}}`, String(value));
        });
      }
      return result;
    },
  }),
}));

describe('HouseholdForm', () => {
  const mockImportFromJSON = localStorage.importFromJSON as Mock;
  const mockSaveAppData = localStorage.saveAppData as Mock;

  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.alert = vi.fn();
    globalThis.confirm = vi.fn(() => true);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.location = {
      reload: vi.fn(),
    } as unknown as Location;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders form fields', () => {
    const onSubmit = vi.fn();
    render(<HouseholdForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/Adults/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Children/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Supply Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Use Freezer')).toBeInTheDocument();
  });

  it('displays initial data when provided', () => {
    const onSubmit = vi.fn();
    render(
      <HouseholdForm
        onSubmit={onSubmit}
        initialData={{
          adults: 3,
          children: 2,
          supplyDays: 14,
          useFreezer: true,
        }}
      />,
    );

    expect(screen.getByLabelText(/Adults/i)).toHaveValue(3);
    expect(screen.getByLabelText(/Children/i)).toHaveValue(2);
    expect(screen.getByLabelText(/Supply Duration/i)).toHaveValue(14);
    expect(screen.getByLabelText('Use Freezer')).toBeChecked();
  });

  it('calls onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(<HouseholdForm onSubmit={onSubmit} />);

    const adultsInput = screen.getByLabelText(/Adults/i);
    const childrenInput = screen.getByLabelText(/Children/i);
    const supplyDaysInput = screen.getByLabelText(/Supply Duration/i);
    const freezerCheckbox = screen.getByLabelText('Use Freezer');
    const form = container.querySelector('form');

    fireEvent.change(adultsInput, { target: { value: '2' } });
    fireEvent.change(childrenInput, { target: { value: '1' } });
    fireEvent.change(supplyDaysInput, { target: { value: '10' } });
    await user.click(freezerCheckbox);

    fireEvent.submit(form!);

    expect(onSubmit).toHaveBeenCalledWith({
      adults: 2,
      children: 1,
      supplyDays: 10,
      useFreezer: true,
    });
  });

  it('shows validation error for too many adults', () => {
    const onSubmit = vi.fn();
    const { container } = render(<HouseholdForm onSubmit={onSubmit} />);

    const adultsInput = screen.getByLabelText(/Adults/i);
    const form = container.querySelector('form');

    fireEvent.change(adultsInput, { target: { value: '25' } });
    // Submit form directly to bypass browser validation
    fireEvent.submit(form!);

    expect(screen.getByText('Maximum 20 adults allowed')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for too many children', () => {
    const onSubmit = vi.fn();
    const { container } = render(<HouseholdForm onSubmit={onSubmit} />);

    const childrenInput = screen.getByLabelText(/Children/i);
    const form = container.querySelector('form');

    fireEvent.change(childrenInput, { target: { value: '25' } });
    // already set
    fireEvent.submit(form!);

    expect(screen.getByText('Maximum 20 children allowed')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for too many supply days', () => {
    const onSubmit = vi.fn();
    const { container } = render(<HouseholdForm onSubmit={onSubmit} />);

    const supplyDaysInput = screen.getByLabelText(/Supply Duration/i);
    const form = container.querySelector('form');

    fireEvent.change(supplyDaysInput, { target: { value: '400' } });
    fireEvent.submit(form!);

    expect(screen.getByText('Maximum 365 days allowed')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears error when user corrects invalid input', () => {
    const onSubmit = vi.fn();
    const { container } = render(<HouseholdForm onSubmit={onSubmit} />);

    const adultsInput = screen.getByLabelText(/Adults/i);
    const form = container.querySelector('form');

    // Enter invalid value (too many)
    fireEvent.change(adultsInput, { target: { value: '25' } });
    fireEvent.submit(form!);

    expect(screen.getByText('Maximum 20 adults allowed')).toBeInTheDocument();

    // Correct the value
    fireEvent.change(adultsInput, { target: { value: '2' } });

    expect(
      screen.queryByText('Maximum 20 adults allowed'),
    ).not.toBeInTheDocument();
  });

  it('renders back button when onBack is provided', () => {
    const onSubmit = vi.fn();
    const onBack = vi.fn();
    render(<HouseholdForm onSubmit={onSubmit} onBack={onBack} />);

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onBack = vi.fn();
    render(<HouseholdForm onSubmit={onSubmit} onBack={onBack} />);

    const backButton = screen.getByRole('button', { name: 'Back' });
    await user.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  describe('Import functionality', () => {
    it('renders import link', () => {
      const onSubmit = vi.fn();
      render(<HouseholdForm onSubmit={onSubmit} />);

      expect(
        screen.getByText('Already have data? Import backup'),
      ).toBeInTheDocument();
    });

    it('has hidden file input for import', () => {
      const onSubmit = vi.fn();
      render(<HouseholdForm onSubmit={onSubmit} />);

      const fileInput = screen.getByLabelText('Import backup data');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', '.json');
    });

    it('triggers file input on import link click', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<HouseholdForm onSubmit={onSubmit} />);

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
      const onSubmit = vi.fn();

      render(<HouseholdForm onSubmit={onSubmit} />);

      const fileInput = screen.getByLabelText(
        'Import backup data',
      ) as HTMLInputElement;
      const file = new File([JSON.stringify(validData)], 'data.json', {
        type: 'application/json',
      });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockImportFromJSON).toHaveBeenCalled();
        expect(globalThis.confirm).toHaveBeenCalledWith(
          'This will replace all data. Continue?',
        );
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
      const onSubmit = vi.fn();

      render(<HouseholdForm onSubmit={onSubmit} />);

      const fileInput = screen.getByLabelText(
        'Import backup data',
      ) as HTMLInputElement;
      const file = new File([JSON.stringify(invalidData)], 'data.json', {
        type: 'application/json',
      });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(globalThis.alert).toHaveBeenCalledWith('Invalid file format');
      });

      expect(mockSaveAppData).not.toHaveBeenCalled();
    });

    it('does not import when user cancels confirmation', async () => {
      const validData = {
        version: CURRENT_SCHEMA_VERSION,
        household: { adults: 2, children: 0 },
        settings: { language: 'en' },
        items: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      mockImportFromJSON.mockReturnValue(validData);
      (globalThis.confirm as Mock).mockReturnValue(false);
      const onSubmit = vi.fn();

      render(<HouseholdForm onSubmit={onSubmit} />);

      const fileInput = screen.getByLabelText(
        'Import backup data',
      ) as HTMLInputElement;
      const file = new File([JSON.stringify(validData)], 'data.json', {
        type: 'application/json',
      });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(globalThis.confirm).toHaveBeenCalled();
      });

      expect(mockSaveAppData).not.toHaveBeenCalled();
    });

    it('handles file read error', async () => {
      mockImportFromJSON.mockImplementation(() => {
        throw new Error('Parse error');
      });
      const onSubmit = vi.fn();

      render(<HouseholdForm onSubmit={onSubmit} />);

      const fileInput = screen.getByLabelText(
        'Import backup data',
      ) as HTMLInputElement;
      const file = new File(['invalid json'], 'data.json', {
        type: 'application/json',
      });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(globalThis.alert).toHaveBeenCalledWith('Failed to import data');
      });
    });

    it('does nothing when no file selected', () => {
      const onSubmit = vi.fn();
      render(<HouseholdForm onSubmit={onSubmit} />);

      const fileInput = screen.getByLabelText(
        'Import backup data',
      ) as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [] } });

      expect(mockImportFromJSON).not.toHaveBeenCalled();
    });
  });
});
