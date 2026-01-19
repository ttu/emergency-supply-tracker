import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '@/test';
import { Settings } from './Settings';

// Mock i18next
vi.mock('react-i18next', async () => {
  const { defaultI18nMock } = await import('@/test/i18n');
  return defaultI18nMock;
});

describe('Settings Page', () => {
  it('should render settings page', () => {
    renderWithProviders(<Settings />);

    expect(screen.getByText('navigation.settings')).toBeInTheDocument();
  });

  it('should render side menu with all section options', () => {
    renderWithProviders(<Settings />);

    // All sections should appear in the side menu
    expect(screen.getByTestId('sidemenu-item-appearance')).toBeInTheDocument();
    expect(screen.getByTestId('sidemenu-item-household')).toBeInTheDocument();
    expect(screen.getByTestId('sidemenu-item-nutrition')).toBeInTheDocument();
    expect(
      screen.getByTestId('sidemenu-item-hiddenAlerts'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('sidemenu-item-disabledRecommendations'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('sidemenu-item-overriddenRecommendations'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('sidemenu-item-recommendedItems'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('sidemenu-item-recommendationKits'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('sidemenu-item-dataManagement'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sidemenu-item-about')).toBeInTheDocument();
    expect(screen.getByTestId('sidemenu-item-dangerZone')).toBeInTheDocument();
  });

  it('should render appearance section by default', () => {
    renderWithProviders(<Settings />);

    // Appearance section should be visible by default
    expect(screen.getByTestId('section-appearance')).toBeInTheDocument();
    expect(screen.getByText('settings.language.label')).toBeInTheDocument();
  });

  it('should navigate to household section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on household in the menu
    fireEvent.click(screen.getByTestId('sidemenu-item-household'));

    // Household section should now be visible
    expect(screen.getByTestId('section-household')).toBeInTheDocument();
    expect(screen.getByText('settings.household.adults')).toBeInTheDocument();
    expect(screen.getByText('settings.household.children')).toBeInTheDocument();
  });

  it('should navigate to nutrition section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on nutrition in the menu
    fireEvent.click(screen.getByTestId('sidemenu-item-nutrition'));

    // Nutrition section should now be visible
    expect(screen.getByTestId('section-nutrition')).toBeInTheDocument();
    expect(
      screen.getByText('settings.nutrition.dailyCalories'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.nutrition.dailyWater'),
    ).toBeInTheDocument();
  });

  it('should navigate to hidden alerts section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on hidden alerts in the menu
    fireEvent.click(screen.getByTestId('sidemenu-item-hiddenAlerts'));

    // Hidden alerts section should now be visible
    expect(screen.getByTestId('section-hidden-alerts')).toBeInTheDocument();
    expect(screen.getByText('settings.hiddenAlerts.empty')).toBeInTheDocument();
  });

  it('should navigate to disabled recommendations section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on disabled recommendations in the menu
    fireEvent.click(
      screen.getByTestId('sidemenu-item-disabledRecommendations'),
    );

    // Disabled recommendations section should now be visible
    expect(
      screen.getByTestId('section-disabled-recommendations'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.disabledRecommendations.empty'),
    ).toBeInTheDocument();
  });

  it('should navigate to overridden recommendations section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on overridden recommendations in the menu
    fireEvent.click(
      screen.getByTestId('sidemenu-item-overriddenRecommendations'),
    );

    // Overridden recommendations section should now be visible
    expect(
      screen.getByTestId('section-overridden-recommendations'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.overriddenRecommendations.empty'),
    ).toBeInTheDocument();
  });

  it('should navigate to recommended items section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on recommended items in the menu
    fireEvent.click(screen.getByTestId('sidemenu-item-recommendedItems'));

    // Recommended items section should now be visible
    expect(screen.getByTestId('section-recommended-items')).toBeInTheDocument();
  });

  it('should navigate to recommendation kits section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on recommendation kits in the menu
    fireEvent.click(screen.getByTestId('sidemenu-item-recommendationKits'));

    // Recommendation kits section should now be visible
    expect(
      screen.getByTestId('section-recommendation-kits'),
    ).toBeInTheDocument();
  });

  it('should navigate to data management section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on data management in the menu
    fireEvent.click(screen.getByTestId('sidemenu-item-dataManagement'));

    // Data management section should now be visible
    expect(screen.getByTestId('section-data-management')).toBeInTheDocument();
    expect(screen.getByText('settings.export.button')).toBeInTheDocument();
    expect(screen.getByText('settings.import.button')).toBeInTheDocument();
    expect(
      screen.getByText('settings.shoppingList.button'),
    ).toBeInTheDocument();
  });

  it('should navigate to about section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on about in the menu
    fireEvent.click(screen.getByTestId('sidemenu-item-about'));

    // About section should now be visible
    expect(screen.getByTestId('section-about')).toBeInTheDocument();
    expect(screen.getByText('app.title')).toBeInTheDocument();
    expect(screen.getByText('settings.about.viewOnGitHub')).toBeInTheDocument();
  });

  it('should navigate to danger zone section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on danger zone in the menu
    fireEvent.click(screen.getByTestId('sidemenu-item-dangerZone'));

    // Danger zone section should now be visible
    expect(screen.getByTestId('section-danger-zone')).toBeInTheDocument();
    expect(screen.getByText('settings.clearData.button')).toBeInTheDocument();
  });

  it('should have GitHub link with correct attributes', () => {
    renderWithProviders(<Settings />);

    // Navigate to about section
    fireEvent.click(screen.getByTestId('sidemenu-item-about'));

    const link = screen.getByText('settings.about.viewOnGitHub');
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/ttu/emergency-supply-tracker',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
