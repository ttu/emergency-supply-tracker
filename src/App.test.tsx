import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
  const appData = {
    version: '1.0.0',
    household: {
      adults: 2,
      children: 0,
      supplyDurationDays: 7,
      useFreezer: false,
    },
    settings: {
      language: 'en',
      theme: 'light',
      onboardingCompleted: true,
    },
    customCategories: [],
    items: [],
    customTemplates: [],
    lastModified: new Date().toISOString(),
  };
  localStorage.setItem('emergencySupplyTracker', JSON.stringify(appData));
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    setupCompletedOnboarding();
  });

  it('renders navigation', () => {
    render(<App />);

    expect(screen.getByText('navigation.dashboard')).toBeInTheDocument();
    expect(screen.getByText('navigation.inventory')).toBeInTheDocument();
    expect(screen.getByText('navigation.settings')).toBeInTheDocument();
  });

  it('renders dashboard by default', () => {
    render(<App />);

    // Dashboard should show quick actions
    expect(screen.getByText('dashboard.quickActions')).toBeInTheDocument();
  });

  it('navigates to inventory when clicking inventory button', () => {
    render(<App />);

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
    render(<App />);

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
    render(<App />);

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
    render(<App />);

    const helpButton = screen.getByText('navigation.help');
    fireEvent.click(helpButton);

    // Should show help page content
    expect(screen.getByText('help.title')).toBeInTheDocument();
  });

  it('shows onboarding when not completed', () => {
    // Clear localStorage to show onboarding
    localStorage.clear();
    const appData = {
      version: '1.0.0',
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      settings: { language: 'en', theme: 'light', onboardingCompleted: false },
      customCategories: [],
      items: [],
      customTemplates: [],
      lastModified: new Date().toISOString(),
    };
    localStorage.setItem('emergencySupplyTracker', JSON.stringify(appData));

    render(<App />);

    // Should show onboarding content (welcome screen or first step)
    expect(screen.getByText('app.title')).toBeInTheDocument();
  });

  it('has skip link for accessibility', () => {
    render(<App />);

    const skipLink = screen.getByText('accessibility.skipToContent');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });
});
