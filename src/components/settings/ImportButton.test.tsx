import { render, screen, fireEvent } from '@testing-library/react';
import { ImportButton } from './ImportButton';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ImportButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
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
    const clickSpy = jest.spyOn(fileInput, 'click');

    const button = screen.getByText('settings.import.button');
    fireEvent.click(button);

    expect(clickSpy).toHaveBeenCalled();
  });
});
