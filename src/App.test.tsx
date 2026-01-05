import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { createMockAppData } from '@/shared/utils/test/factories';
import { SettingsProvider } from '@/features/settings';
import { HouseholdProvider } from '@/features/household';
import { InventoryProvider } from '@/features/inventory';
import { ThemeApplier } from './components/ThemeApplier';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
  withTranslation: () => (Component: React.ComponentType) => {
    const WrappedComponent = (props: Record<string, unknown>) => {
      const t = (key: string) => key;
      return <Component {...props} t={t} />;
    };
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name || 'Component'})`;
    return WrappedComponent;
  },
}));

// Helper to set up localStorage with onboarding completed
const setupCompletedOnboarding = () => {
  const appData = createMockAppData({
    settings: {
      language: 'en',
      theme: 'light',
      highContrast: false,
      advancedFeatures: {},
      onboardingCompleted: true,
    },
  });
  localStorage.setItem('emergencySupplyTracker', JSON.stringify(appData));
};

// Helper to render App with all required providers
const renderApp = () => {
  return render(
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeApplier>
          <HouseholdProvider>
            <InventoryProvider>
              <App />
            </InventoryProvider>
          </HouseholdProvider>
        </ThemeApplier>
      </SettingsProvider>
    </ErrorBoundary>,
  );
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    setupCompletedOnboarding();
  });

  it('renders navigation', () => {
    renderApp();

    expect(screen.getByText('navigation.dashboard')).toBeInTheDocument();
    expect(screen.getByText('navigation.inventory')).toBeInTheDocument();
    expect(screen.getByText('navigation.settings')).toBeInTheDocument();
  });

  it('renders dashboard by default', () => {
    renderApp();

    // Dashboard should show quick actions
    expect(screen.getByText('dashboard.quickActions')).toBeInTheDocument();
  });

  it('navigates to inventory when clicking inventory button', () => {
    renderApp();

    const inventoryButton = screen.getByText('navigation.inventory');
    fireEvent.click(inventoryButton);

    // Should show inventory page content
    expect(screen.getByText('inventory.addFromTemplate')).toBeInTheDocument();
    // Dashboard content should not be visible
    expect(
      screen.queryByText('dashboard.quickActions'),
    ).not.toBeInTheDocument();
  });

  it('navigates to settings when clicking settings button', () => {
    renderApp();

    const settingsButton = screen.getByText('navigation.settings');
    fireEvent.click(settingsButton);

    // Should show settings sections
    expect(screen.getByText('settings.sections.household')).toBeInTheDocument();
    // Dashboard content should not be visible
    expect(
      screen.queryByText('dashboard.quickActions'),
    ).not.toBeInTheDocument();
  });

  it('navigates between pages', () => {
    renderApp();

    // Start on dashboard
    expect(screen.getByText('dashboard.quickActions')).toBeInTheDocument();

    // Go to settings
    fireEvent.click(screen.getByText('navigation.settings'));
    expect(screen.getByText('settings.sections.household')).toBeInTheDocument();

    // Go to inventory
    fireEvent.click(screen.getByText('navigation.inventory'));
    expect(screen.getByText('inventory.addFromTemplate')).toBeInTheDocument();

    // Go back to dashboard
    fireEvent.click(screen.getByText('navigation.dashboard'));
    expect(screen.getByText('dashboard.quickActions')).toBeInTheDocument();
  });

  it('navigates to help page', () => {
    renderApp();

    const helpButton = screen.getByText('navigation.help');
    fireEvent.click(helpButton);

    // Should show help page content
    expect(screen.getByText('help.title')).toBeInTheDocument();
  });

  it('shows onboarding when not completed', () => {
    // Clear localStorage to show onboarding
    localStorage.clear();
    const appData = createMockAppData({
      settings: {
        language: 'en',
        theme: 'light',
        highContrast: false,
        advancedFeatures: {},
        onboardingCompleted: false,
      },
    });
    localStorage.setItem('emergencySupplyTracker', JSON.stringify(appData));

    renderApp();

    // Should show onboarding content (welcome screen or first step)
    expect(screen.getByText('app.title')).toBeInTheDocument();
  });

  it('has skip link for accessibility', () => {
    renderApp();

    const skipLink = screen.getByText('accessibility.skipToContent');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });
});
