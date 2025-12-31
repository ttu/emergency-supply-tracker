import { render, screen, fireEvent } from '@testing-library/react';
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

describe('ImportRecommendationsButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
    mockImportRecommendedItems.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    });
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
});
