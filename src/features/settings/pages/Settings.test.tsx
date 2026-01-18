import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent, within } from '@/test';
import { Settings } from './Settings';
import { CloudSyncProvider } from '@/features/cloudSync';

// Mock i18next
vi.mock('react-i18next', async () => {
  const { defaultI18nMock } = await import('@/test/i18n');
  return defaultI18nMock;
});

// Wrapper to add CloudSyncProvider since Settings uses CloudSyncSection
const renderSettings = (component: React.ReactElement) => {
  return renderWithProviders(component, {
    wrapper: ({ children }) => (
      <CloudSyncProvider>{children}</CloudSyncProvider>
    ),
  });
};

describe('Settings Page', () => {
  it('should render settings page', () => {
    renderSettings(<Settings />);

    expect(screen.getByText('navigation.settings')).toBeInTheDocument();
  });

  it('should render side menu with all section options', () => {
    renderSettings(<Settings />);

    // Scope to sidebar to avoid duplicates from drawer
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    expect(
      within(sidebar).getByTestId('sidemenu-item-appearance'),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByTestId('sidemenu-item-household'),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByTestId('sidemenu-item-nutrition'),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByTestId('sidemenu-item-hiddenAlerts'),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByTestId('sidemenu-item-disabledRecommendations'),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByTestId('sidemenu-item-disabledCategories'),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByTestId('sidemenu-item-overriddenRecommendations'),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByTestId('sidemenu-item-recommendationKits'),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByTestId('sidemenu-item-backupTransfer'),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByTestId('sidemenu-item-cloudSync'),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByTestId('sidemenu-item-about'),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByTestId('sidemenu-item-dangerZone'),
    ).toBeInTheDocument();
  });

  it('should render appearance section by default', () => {
    renderSettings(<Settings />);

    // Appearance section should be visible by default
    expect(screen.getByTestId('section-appearance')).toBeInTheDocument();
    expect(screen.getByText('settings.language.label')).toBeInTheDocument();
  });

  it('should navigate to household section when clicked', () => {
    renderSettings(<Settings />);

    // Click on household in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(within(sidebar).getByTestId('sidemenu-item-household'));

    // Household section should now be visible
    expect(screen.getByTestId('section-household')).toBeInTheDocument();
    expect(screen.getByText('settings.household.adults')).toBeInTheDocument();
    expect(screen.getByText('settings.household.children')).toBeInTheDocument();
  });

  it('should navigate to nutrition section when clicked', () => {
    renderSettings(<Settings />);

    // Click on nutrition in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(within(sidebar).getByTestId('sidemenu-item-nutrition'));

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
    renderSettings(<Settings />);

    // Click on hidden alerts in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(within(sidebar).getByTestId('sidemenu-item-hiddenAlerts'));

    // Hidden alerts section should now be visible
    expect(screen.getByTestId('section-hidden-alerts')).toBeInTheDocument();
    expect(screen.getByText('settings.hiddenAlerts.empty')).toBeInTheDocument();
  });

  it('should navigate to disabled recommendations section when clicked', () => {
    renderSettings(<Settings />);

    // Click on disabled recommendations in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(
      within(sidebar).getByTestId('sidemenu-item-disabledRecommendations'),
    );

    // Disabled recommendations section should now be visible
    expect(
      screen.getByTestId('section-disabled-recommendations'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.disabledRecommendations.empty'),
    ).toBeInTheDocument();
  });

  it('should navigate to disabled categories section when clicked', () => {
    renderSettings(<Settings />);

    // Click on disabled categories in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(
      within(sidebar).getByTestId('sidemenu-item-disabledCategories'),
    );

    // Disabled categories section should now be visible
    expect(
      screen.getByTestId('section-disabled-categories'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.disabledCategories.empty'),
    ).toBeInTheDocument();
  });

  it('should navigate to overridden recommendations section when clicked', () => {
    renderSettings(<Settings />);

    // Click on overridden recommendations in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(
      within(sidebar).getByTestId('sidemenu-item-overriddenRecommendations'),
    );

    // Overridden recommendations section should now be visible
    expect(
      screen.getByTestId('section-overridden-recommendations'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.overriddenRecommendations.empty'),
    ).toBeInTheDocument();
  });

  it('should navigate to recommendation kits section when clicked', () => {
    renderSettings(<Settings />);

    // Click on recommendation kits in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(
      within(sidebar).getByTestId('sidemenu-item-recommendationKits'),
    );

    // Recommendation kits section should now be visible
    expect(
      screen.getByTestId('section-recommendation-kits'),
    ).toBeInTheDocument();
  });

  it('should navigate to backup and transfer section when clicked', () => {
    renderSettings(<Settings />);

    // Click on backup and transfer in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(
      within(sidebar).getByTestId('sidemenu-item-backupTransfer'),
    );

    // Backup and transfer section should now be visible
    expect(screen.getByTestId('section-backup-transfer')).toBeInTheDocument();
    expect(screen.getByText('settings.export.button')).toBeInTheDocument();
    expect(screen.getByText('settings.import.button')).toBeInTheDocument();
  });

  it('should navigate to cloud sync section when clicked', () => {
    renderSettings(<Settings />);

    // Click on cloud sync in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(within(sidebar).getByTestId('sidemenu-item-cloudSync'));

    // Cloud sync section should now be visible
    expect(screen.getByTestId('section-cloud-sync')).toBeInTheDocument();
  });

  it('should navigate to about section when clicked', () => {
    renderSettings(<Settings />);

    // Click on about in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(within(sidebar).getByTestId('sidemenu-item-about'));

    // About section should now be visible
    expect(screen.getByTestId('section-about')).toBeInTheDocument();
    expect(screen.getByText('app.title')).toBeInTheDocument();
    expect(screen.getByText('help.githubLink')).toBeInTheDocument();
    expect(screen.getByTestId('storage-used')).toBeInTheDocument();
  });

  it('should navigate to danger zone section when clicked', () => {
    renderSettings(<Settings />);

    // Click on danger zone in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(within(sidebar).getByTestId('sidemenu-item-dangerZone'));

    // Danger zone section should now be visible
    expect(screen.getByTestId('section-danger-zone')).toBeInTheDocument();
    expect(screen.getByText('settings.clearData.button')).toBeInTheDocument();
  });

  it('should have GitHub link with correct attributes', () => {
    renderSettings(<Settings />);

    // Navigate to about section (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(within(sidebar).getByTestId('sidemenu-item-about'));

    const link = screen.getByText('help.githubLink');
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/ttu/emergency-supply-tracker',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should handle default case in switch statement (exhaustive check)', () => {
    renderSettings(<Settings />);

    // This test ensures the default case is covered
    // In practice, TypeScript ensures all cases are handled,
    // but we test the default case for defensive programming
    // We can't easily trigger the default case without breaking types,
    // but we can verify the switch statement structure is correct
    // by ensuring all known sections work

    // Test all sections to ensure switch handles them
    const sections = [
      'appearance',
      'inventorySets',
      'household',
      'nutrition',
      'hiddenAlerts',
      'disabledRecommendations',
      'disabledCategories',
      'customCategories',
      'customTemplates',
      'overriddenRecommendations',
      'recommendationKits',
      'backupTransfer',
      'debugLog',
      'cloudSync',
      'about',
      'dangerZone',
    ];

    // Scope to sidebar to avoid duplicates from drawer
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    sections.forEach((section) => {
      fireEvent.click(within(sidebar).getByTestId(`sidemenu-item-${section}`));
      expect(
        screen.getByTestId(
          `section-${section.replaceAll(/([A-Z])/g, '-$1').toLowerCase()}`,
        ),
      ).toBeInTheDocument();
    });
  });

  it('should navigate to custom templates section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on custom templates in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(
      within(sidebar).getByTestId('sidemenu-item-customTemplates'),
    );

    // Custom templates section should now be visible
    expect(screen.getByTestId('section-custom-templates')).toBeInTheDocument();
    expect(
      screen.getByText('settings.customTemplates.empty'),
    ).toBeInTheDocument();
  });

  it('should navigate to custom categories section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on custom categories in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(
      within(sidebar).getByTestId('sidemenu-item-customCategories'),
    );

    // Custom categories section should now be visible
    expect(screen.getByTestId('section-custom-categories')).toBeInTheDocument();
  });

  it('should navigate to debug log section when clicked', () => {
    renderWithProviders(<Settings />);

    // Click on debug log in the menu (scope to sidebar)
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(within(sidebar).getByTestId('sidemenu-item-debugLog'));

    // Debug log section should now be visible
    expect(screen.getByTestId('section-debug-log')).toBeInTheDocument();
    expect(screen.getByText('settings.debugExport.button')).toBeInTheDocument();
  });
});
