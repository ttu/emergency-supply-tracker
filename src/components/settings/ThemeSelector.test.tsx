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

  it('should display all theme options', () => {
    renderWithProviders(<ThemeSelector />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(8);
    expect(screen.getByText('settings.theme.light')).toBeInTheDocument();
    expect(screen.getByText('settings.theme.dark')).toBeInTheDocument();
    expect(screen.getByText('settings.theme.midnight')).toBeInTheDocument();
    expect(screen.getByText('settings.theme.ocean')).toBeInTheDocument();
    expect(screen.getByText('settings.theme.sunset')).toBeInTheDocument();
    expect(screen.getByText('settings.theme.forest')).toBeInTheDocument();
    expect(screen.getByText('settings.theme.lavender')).toBeInTheDocument();
    expect(screen.getByText('settings.theme.minimal')).toBeInTheDocument();
  });

  it('should change theme when option is selected', () => {
    renderWithProviders(<ThemeSelector />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;

    // Initially ocean theme
    expect(select.value).toBe('ocean');

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

  it('should render high contrast toggle', () => {
    renderWithProviders(<ThemeSelector />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(screen.getByText('accessibility.highContrast')).toBeInTheDocument();
  });

  it('should toggle high contrast when checkbox is clicked', () => {
    renderWithProviders(<ThemeSelector />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    // Initially unchecked
    expect(checkbox.checked).toBe(false);

    // Click to enable high contrast
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it('should display high contrast description', () => {
    renderWithProviders(<ThemeSelector />);
    expect(
      screen.getByText('accessibility.highContrastDescription'),
    ).toBeInTheDocument();
  });
});
