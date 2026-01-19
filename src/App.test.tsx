import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';
import { createMockAppData } from '@/shared/utils/test/factories';
import { renderWithProviders } from '@/test/render';
import { STORAGE_KEY } from '@/shared/utils/storage/localStorage';

// Mock i18next
const mockT = (key: string) => key;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  withTranslation:
    () => (Component: React.ComponentType<Record<string, unknown>>) => {
      const WrappedComponent = (props: Record<string, unknown>) => {
        return <Component {...props} t={mockT} />;
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
      onboardingCompleted: true,
    },
  } as Parameters<typeof createMockAppData>[0]);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
};

// Helper to render App with all required providers
const renderApp = () => {
  return renderWithProviders(<App />, {
    providers: {
      errorBoundary: true,
      themeApplier: true,
    },
  });
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

  it('renders dashboard by default', async () => {
    renderApp();

    // Dashboard should show quick actions (wait for lazy loading)
    await waitFor(() => {
      expect(screen.getByText('dashboard.quickActions')).toBeInTheDocument();
    });
  });

  it('navigates to inventory when clicking inventory button', async () => {
    renderApp();

    // Wait for initial dashboard to load
    await waitFor(() => {
      expect(screen.getByText('dashboard.quickActions')).toBeInTheDocument();
    });

    const inventoryButton = screen.getByText('navigation.inventory');
    fireEvent.click(inventoryButton);

    // Should show inventory page content (wait for lazy loading)
    await waitFor(() => {
      expect(screen.getByText('inventory.addFromTemplate')).toBeInTheDocument();
    });
    // Dashboard content should not be visible
    expect(
      screen.queryByText('dashboard.quickActions'),
    ).not.toBeInTheDocument();
  });

  it('navigates to settings when clicking settings button', async () => {
    renderApp();

    // Wait for initial dashboard to load
    await waitFor(() => {
      expect(screen.getByText('dashboard.quickActions')).toBeInTheDocument();
    });

    const settingsButton = screen.getByText('navigation.settings');
    fireEvent.click(settingsButton);

    // Should show settings sections (wait for lazy loading)
    await waitFor(() => {
      expect(
        screen.getByText('settings.sections.household'),
      ).toBeInTheDocument();
    });
    // Dashboard content should not be visible
    expect(
      screen.queryByText('dashboard.quickActions'),
    ).not.toBeInTheDocument();
  });

  it('navigates between pages', async () => {
    renderApp();

    // Start on dashboard (wait for lazy loading)
    await waitFor(() => {
      expect(screen.getByText('dashboard.quickActions')).toBeInTheDocument();
    });

    // Go to settings
    fireEvent.click(screen.getByText('navigation.settings'));
    await waitFor(() => {
      expect(
        screen.getByText('settings.sections.household'),
      ).toBeInTheDocument();
    });

    // Go to inventory
    fireEvent.click(screen.getByText('navigation.inventory'));
    await waitFor(() => {
      expect(screen.getByText('inventory.addFromTemplate')).toBeInTheDocument();
    });

    // Go back to dashboard
    fireEvent.click(screen.getByText('navigation.dashboard'));
    await waitFor(() => {
      expect(screen.getByText('dashboard.quickActions')).toBeInTheDocument();
    });
  });

  it('navigates to help page', async () => {
    renderApp();

    // Wait for initial dashboard to load
    await waitFor(() => {
      expect(screen.getByText('dashboard.quickActions')).toBeInTheDocument();
    });

    const helpButton = screen.getByText('navigation.help');
    fireEvent.click(helpButton);

    // Should show help page content (wait for lazy loading)
    await waitFor(() => {
      expect(screen.getByText('help.title')).toBeInTheDocument();
    });
  });

  it('shows onboarding when not completed', async () => {
    // Clear localStorage to show onboarding
    localStorage.clear();
    const appData = createMockAppData({
      settings: {
        language: 'en',
        theme: 'light',
        highContrast: false,
        onboardingCompleted: false,
      },
    } as Parameters<typeof createMockAppData>[0]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));

    renderApp();

    // Should show onboarding content (wait for lazy loading)
    await waitFor(() => {
      expect(screen.getByText('app.title')).toBeInTheDocument();
    });
  });

  it('has skip link for accessibility', () => {
    renderApp();

    const skipLink = screen.getByText('accessibility.skipToContent');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('navigates to inventory with category when clicking category from dashboard', async () => {
    renderApp();

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('dashboard.quickActions')).toBeInTheDocument();
    });

    // Find and click a category card (water-beverages category)
    const categoryCard = screen.getByTestId('category-water-beverages');
    fireEvent.click(categoryCard);

    // Should show inventory page with category filter active
    await waitFor(() => {
      expect(screen.getByText('inventory.addFromTemplate')).toBeInTheDocument();
    });

    // The category should be selected in the SideMenu (has aria-current="page")
    const categoryNavButton = screen.getByTestId(
      'sidemenu-item-water-beverages',
    );
    expect(categoryNavButton).toHaveAttribute('aria-current', 'page');
  });
});
