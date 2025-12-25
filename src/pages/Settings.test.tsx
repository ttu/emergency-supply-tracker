import { render, screen } from '@testing-library/react';
import { Settings } from './Settings';
import { SettingsProvider } from '../contexts/SettingsProvider';
import { HouseholdProvider } from '../contexts/HouseholdProvider';
import { InventoryProvider } from '../contexts/InventoryProvider';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <SettingsProvider>
      <HouseholdProvider>
        <InventoryProvider>{component}</InventoryProvider>
      </HouseholdProvider>
    </SettingsProvider>,
  );
};

describe('Settings Page', () => {
  it('should render settings page', () => {
    renderWithProviders(<Settings />);

    expect(screen.getByText('navigation.settings')).toBeInTheDocument();
  });

  it('should render all section titles', () => {
    renderWithProviders(<Settings />);

    expect(
      screen.getByText('settings.sections.appearance'),
    ).toBeInTheDocument();
    expect(screen.getByText('settings.sections.household')).toBeInTheDocument();
    expect(screen.getByText('settings.advanced.title')).toBeInTheDocument();
    expect(
      screen.getByText('settings.sections.dataManagement'),
    ).toBeInTheDocument();
    expect(screen.getByText('settings.sections.about')).toBeInTheDocument();
    expect(
      screen.getByText('settings.sections.dangerZone'),
    ).toBeInTheDocument();
  });

  it('should render language selector', () => {
    renderWithProviders(<Settings />);

    expect(screen.getByText('settings.language.label')).toBeInTheDocument();
  });

  it('should render household form', () => {
    renderWithProviders(<Settings />);

    expect(screen.getByText('settings.household.adults')).toBeInTheDocument();
    expect(screen.getByText('settings.household.children')).toBeInTheDocument();
  });

  it('should render advanced features', () => {
    renderWithProviders(<Settings />);

    expect(
      screen.getByText('settings.advanced.calorieTracking.label'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.advanced.powerManagement.label'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.advanced.waterTracking.label'),
    ).toBeInTheDocument();
  });

  it('should render data management buttons', () => {
    renderWithProviders(<Settings />);

    expect(screen.getByText('settings.export.button')).toBeInTheDocument();
    expect(screen.getByText('settings.import.button')).toBeInTheDocument();
    expect(
      screen.getByText('settings.shoppingList.button'),
    ).toBeInTheDocument();
  });

  it('should render about section', () => {
    renderWithProviders(<Settings />);

    expect(screen.getByText('app.title')).toBeInTheDocument();
    expect(screen.getByText('settings.about.viewOnGitHub')).toBeInTheDocument();
  });

  it('should render clear data button in danger zone', () => {
    renderWithProviders(<Settings />);

    expect(screen.getByText('settings.clearData.button')).toBeInTheDocument();
  });

  it('should have GitHub link with correct attributes', () => {
    renderWithProviders(<Settings />);

    const link = screen.getByText('settings.about.viewOnGitHub');
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/ttu/emergency-supply-tracker',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
