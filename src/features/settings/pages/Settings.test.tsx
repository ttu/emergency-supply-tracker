import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test';
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

  it('should render all section titles', () => {
    renderSettings(<Settings />);

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
    expect(screen.getByText('settings.sections.cloudSync')).toBeInTheDocument();
    expect(
      screen.getByText('settings.sections.dataManagement'),
    ).toBeInTheDocument();
    expect(screen.getByText('settings.sections.about')).toBeInTheDocument();
    expect(
      screen.getByText('settings.sections.dangerZone'),
    ).toBeInTheDocument();
  });

  it('should render language selector', () => {
    renderSettings(<Settings />);

    expect(screen.getByText('settings.language.label')).toBeInTheDocument();
  });

  it('should render household form', () => {
    renderSettings(<Settings />);

    expect(screen.getByText('settings.household.adults')).toBeInTheDocument();
    expect(screen.getByText('settings.household.children')).toBeInTheDocument();
  });

  it('should render nutrition settings', () => {
    renderSettings(<Settings />);

    expect(
      screen.getByText('settings.nutrition.dailyCalories'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.nutrition.dailyWater'),
    ).toBeInTheDocument();
  });

  it('should render hidden alerts section', () => {
    renderSettings(<Settings />);

    // HiddenAlerts component shows empty message when no alerts are hidden
    expect(screen.getByText('settings.hiddenAlerts.empty')).toBeInTheDocument();
  });

  it('should render disabled recommendations section', () => {
    renderSettings(<Settings />);

    // DisabledRecommendations component shows empty message when no items are disabled
    expect(
      screen.getByText('settings.disabledRecommendations.empty'),
    ).toBeInTheDocument();
  });

  it('should render overridden recommendations section', () => {
    renderSettings(<Settings />);

    // OverriddenRecommendations component shows empty message when no items are overridden
    expect(
      screen.getByText('settings.overriddenRecommendations.empty'),
    ).toBeInTheDocument();
  });

  it('should render data management buttons', () => {
    renderSettings(<Settings />);

    expect(screen.getByText('settings.export.button')).toBeInTheDocument();
    expect(screen.getByText('settings.import.button')).toBeInTheDocument();
    expect(
      screen.getByText('settings.shoppingList.button'),
    ).toBeInTheDocument();
  });

  it('should render about section', () => {
    renderSettings(<Settings />);

    expect(screen.getByText('app.title')).toBeInTheDocument();
    expect(screen.getByText('settings.about.viewOnGitHub')).toBeInTheDocument();
  });

  it('should render clear data button in danger zone', () => {
    renderSettings(<Settings />);

    expect(screen.getByText('settings.clearData.button')).toBeInTheDocument();
  });

  it('should have GitHub link with correct attributes', () => {
    renderSettings(<Settings />);

    const link = screen.getByText('settings.about.viewOnGitHub');
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/ttu/emergency-supply-tracker',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
