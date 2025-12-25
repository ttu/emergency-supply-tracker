import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSelector } from './ThemeSelector';
import { SettingsProvider } from '../../contexts/SettingsProvider';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(<SettingsProvider>{component}</SettingsProvider>);
};

describe('ThemeSelector', () => {
  beforeEach(() => {
    // Reset document theme attribute
    document.documentElement.removeAttribute('data-theme');
  });

  it('should render theme selector', () => {
    renderWithProviders(<ThemeSelector />);
    expect(screen.getByLabelText('settings.theme.label')).toBeInTheDocument();
  });

  it('should display light and dark options', () => {
    renderWithProviders(<ThemeSelector />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(screen.getByText('settings.theme.light')).toBeInTheDocument();
    expect(screen.getByText('settings.theme.dark')).toBeInTheDocument();
  });

  it('should change theme when option is selected', () => {
    renderWithProviders(<ThemeSelector />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;

    // Initially light theme
    expect(select.value).toBe('light');

    // Change to dark theme
    fireEvent.change(select, { target: { value: 'dark' } });
    expect(select.value).toBe('dark');

    // Check that data-theme attribute is set
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should display description text', () => {
    renderWithProviders(<ThemeSelector />);
    expect(screen.getByText('settings.theme.description')).toBeInTheDocument();
  });
});
