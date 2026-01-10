import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test';
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

  it('should render all section titles', () => {
    renderWithProviders(<Settings />);

    expect(
      screen.getByText('settings.sections.appearance'),
    ).toBeInTheDocument();
    expect(screen.getByText('settings.sections.household')).toBeInTheDocument();
    expect(screen.getByText('settings.sections.nutrition')).toBeInTheDocument();
    expect(
      screen.getByText('settings.sections.hiddenAlerts'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.sections.disabledRecommendations'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.sections.overriddenRecommendations'),
    ).toBeInTheDocument();
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

  it('should render nutrition settings', () => {
    renderWithProviders(<Settings />);

    expect(
      screen.getByText('settings.nutrition.dailyCalories'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.nutrition.dailyWater'),
    ).toBeInTheDocument();
  });

  it('should render hidden alerts section', () => {
    renderWithProviders(<Settings />);

    // HiddenAlerts component shows empty message when no alerts are hidden
    expect(screen.getByText('settings.hiddenAlerts.empty')).toBeInTheDocument();
  });

  it('should render disabled recommendations section', () => {
    renderWithProviders(<Settings />);

    // DisabledRecommendations component shows empty message when no items are disabled
    expect(
      screen.getByText('settings.disabledRecommendations.empty'),
    ).toBeInTheDocument();
  });

  it('should render overridden recommendations section', () => {
    renderWithProviders(<Settings />);

    // OverriddenRecommendations component shows empty message when no items are overridden
    expect(
      screen.getByText('settings.overriddenRecommendations.empty'),
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
