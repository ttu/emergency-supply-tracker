import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from './LanguageSelector';
import { SettingsProvider } from '../../contexts/SettingsProvider';

// Mock i18next
const mockChangeLanguage = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(<SettingsProvider>{component}</SettingsProvider>);
};

describe('LanguageSelector', () => {
  beforeEach(() => {
    mockChangeLanguage.mockClear();
  });

  it('should render language selector', () => {
    renderWithProviders(<LanguageSelector />);

    expect(screen.getByText('settings.language.label')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should show language options', () => {
    renderWithProviders(<LanguageSelector />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Check that English and Finnish options exist
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('English');
    expect(options[1]).toHaveTextContent('Suomi');
  });

  it('should change language when option selected', () => {
    renderWithProviders(<LanguageSelector />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'fi' } });

    expect(mockChangeLanguage).toHaveBeenCalledWith('fi');
  });
});
