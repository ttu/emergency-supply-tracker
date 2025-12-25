import { render, screen, fireEvent } from '@testing-library/react';
import { AdvancedFeatures } from './AdvancedFeatures';
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

describe('AdvancedFeatures', () => {
  it('should render advanced features title', () => {
    renderWithProviders(<AdvancedFeatures />);

    expect(screen.getByText('settings.advanced.title')).toBeInTheDocument();
  });

  it('should render all feature toggles', () => {
    renderWithProviders(<AdvancedFeatures />);

    expect(
      screen.getByLabelText('settings.advanced.calorieTracking.label'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('settings.advanced.powerManagement.label'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('settings.advanced.waterTracking.label'),
    ).toBeInTheDocument();
  });

  it('should render feature descriptions', () => {
    renderWithProviders(<AdvancedFeatures />);

    expect(
      screen.getByText('settings.advanced.calorieTracking.description'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.advanced.powerManagement.description'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.advanced.waterTracking.description'),
    ).toBeInTheDocument();
  });

  it('should toggle calorie tracking feature', () => {
    renderWithProviders(<AdvancedFeatures />);

    const checkbox = screen.getByLabelText(
      'settings.advanced.calorieTracking.label',
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('should toggle power management feature', () => {
    renderWithProviders(<AdvancedFeatures />);

    const checkbox = screen.getByLabelText(
      'settings.advanced.powerManagement.label',
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it('should toggle water tracking feature', () => {
    renderWithProviders(<AdvancedFeatures />);

    const checkbox = screen.getByLabelText(
      'settings.advanced.waterTracking.label',
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });
});
