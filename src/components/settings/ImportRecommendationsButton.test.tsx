import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportRecommendationsButton } from './ImportRecommendationsButton';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock useRecommendedItems hook
const mockImportRecommendedItems = jest.fn();
jest.mock('../../hooks/useRecommendedItems', () => ({
  useRecommendedItems: () => ({
    importRecommendedItems: mockImportRecommendedItems,
  }),
}));

// Mock parseRecommendedItemsFile
jest.mock('../../utils/validation/recommendedItemsValidation', () => ({
  parseRecommendedItemsFile: jest.fn(),
}));

// Import the mocked function for test control
import { parseRecommendedItemsFile } from '../../utils/validation/recommendedItemsValidation';
const mockParseRecommendedItemsFile = parseRecommendedItemsFile as jest.Mock;

describe('ImportRecommendationsButton', () => {
  const validFile = {
    meta: { name: 'Test', version: '1.0.0', createdAt: '2024-01-01' },
    items: [
      {
        id: 'test-1',
        i18nKey: 'test.item',
        category: 'food',
        unit: 'pcs',
        baseQuantity: 1,
        scaleWithPeople: true,
        scaleWithDays: true,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
    mockImportRecommendedItems.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    });
    mockParseRecommendedItemsFile.mockReturnValue(validFile);
  });

  it('should render import button', () => {
    render(<ImportRecommendationsButton />);

    expect(
      screen.getByText('settings.recommendations.import.button'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.recommendations.import.description'),
    ).toBeInTheDocument();
  });

  it('should have hidden file input', () => {
    render(<ImportRecommendationsButton />);

    const fileInput = screen.getByLabelText(
      'settings.recommendations.import.button',
    );
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.json');
  });

  it('should trigger file input on button click', () => {
    render(<ImportRecommendationsButton />);

    const fileInput = screen.getByLabelText(
      'settings.recommendations.import.button',
    ) as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, 'click');

    const button = screen.getByText('settings.recommendations.import.button');
    fireEvent.click(button);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should import valid file and show success alert', async () => {
    render(<ImportRecommendationsButton />);

    const fileInput = screen.getByLabelText(
      'settings.recommendations.import.button',
    );
    const file = new File([JSON.stringify(validFile)], 'test.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockParseRecommendedItemsFile).toHaveBeenCalled();
      expect(global.confirm).toHaveBeenCalled();
      expect(mockImportRecommendedItems).toHaveBeenCalledWith(validFile);
      expect(global.alert).toHaveBeenCalledWith(
        'settings.recommendations.import.success',
      );
    });
  });

  it('should not import if user cancels confirmation', async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);

    render(<ImportRecommendationsButton />);

    const fileInput = screen.getByLabelText(
      'settings.recommendations.import.button',
    );
    const file = new File([JSON.stringify(validFile)], 'test.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
      expect(mockImportRecommendedItems).not.toHaveBeenCalled();
    });
  });

  it('should display error when import returns validation errors', async () => {
    mockImportRecommendedItems.mockReturnValue({
      valid: false,
      errors: [{ message: 'Error 1' }, { message: 'Error 2' }],
      warnings: [],
    });

    render(<ImportRecommendationsButton />);

    const fileInput = screen.getByLabelText(
      'settings.recommendations.import.button',
    );
    const file = new File([JSON.stringify(validFile)], 'test.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    // The errors are joined with newlines
    expect(screen.getByRole('alert')).toHaveTextContent('Error 1');
    expect(screen.getByRole('alert')).toHaveTextContent('Error 2');
  });

  it('should display error when parsing fails with Error', async () => {
    mockParseRecommendedItemsFile.mockImplementation(() => {
      throw new Error('Invalid JSON format');
    });

    render(<ImportRecommendationsButton />);

    const fileInput = screen.getByLabelText(
      'settings.recommendations.import.button',
    );
    const file = new File(['invalid json'], 'test.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Invalid JSON format',
      );
    });
  });

  it('should display generic error when parsing fails with non-Error', async () => {
    mockParseRecommendedItemsFile.mockImplementation(() => {
      throw 'string error';
    });

    render(<ImportRecommendationsButton />);

    const fileInput = screen.getByLabelText(
      'settings.recommendations.import.button',
    );
    const file = new File(['invalid'], 'test.json', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'settings.recommendations.import.error',
      );
    });
  });

  it('should do nothing when no file is selected', () => {
    render(<ImportRecommendationsButton />);

    const fileInput = screen.getByLabelText(
      'settings.recommendations.import.button',
    );

    fireEvent.change(fileInput, { target: { files: [] } });

    expect(mockParseRecommendedItemsFile).not.toHaveBeenCalled();
  });

  it('should reset file input after file selection', async () => {
    render(<ImportRecommendationsButton />);

    const fileInput = screen.getByLabelText(
      'settings.recommendations.import.button',
    ) as HTMLInputElement;
    const file = new File([JSON.stringify(validFile)], 'test.json', {
      type: 'application/json',
    });

    // Mock the value property to be resettable
    Object.defineProperty(fileInput, 'value', {
      writable: true,
      value: 'C:\\fakepath\\test.json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(fileInput.value).toBe('');
    });
  });
});
