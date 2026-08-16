import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';
import { createMockAppData } from '@/shared/utils/test/factories';
import { renderWithProviders } from '@/test/render';
import { saveAppData } from '@/shared/utils/storage/localStorage';

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

// Helper to set up localStorage with onboarding completed.
// Uses 'cockpit' (the default design v2 theme) so the integration tests
// exercise the v2 shell that real users will see.
const setupCompletedOnboarding = () => {
  const appData = createMockAppData({
    settings: {
      language: 'en',
      theme: 'cockpit',
      highContrast: false,
      onboardingCompleted: true,
    },
  } as Parameters<typeof createMockAppData>[0]);
  saveAppData(appData);
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

    // The mocked t() echoes the key back, so the nav reads as its voice keys.
    expect(
      screen.getByRole('button', { name: 'v2.voice.navHome.cockpit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'v2.voice.navInventory.cockpit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'v2.voice.navSettings.cockpit' }),
    ).toBeInTheDocument();
  });

  it('renders dashboard by default', async () => {
    renderApp();

    // The v2 dashboard leads with the READINESS caption (no Quick Actions).
    await waitFor(() => {
      expect(
        screen.getByText('v2.voice.readiness.cockpit'),
      ).toBeInTheDocument();
    });
  });

  it('navigates to inventory when clicking inventory button', async () => {
    renderApp();

    await waitFor(() => {
      expect(
        screen.getByText('v2.voice.readiness.cockpit'),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.navInventory.cockpit' }),
    );

    // v2 Inventory shows the "+ ADD" primary button and an "ALL" filter chip.
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'v2.voice.addItem.cockpit' }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText('v2.voice.readiness.cockpit'),
    ).not.toBeInTheDocument();
  });

  it('navigates to settings when clicking settings button', async () => {
    renderApp();

    await waitFor(() => {
      expect(
        screen.getByText('v2.voice.readiness.cockpit'),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.navSettings.cockpit' }),
    );

    // v2 Settings has a sub-nav rail captioned "SECTIONS".
    await waitFor(() => {
      expect(
        screen.getByText('v2.settings.railSections.cockpit'),
      ).toBeInTheDocument();
    });
    // APPEARANCE shows up in both the rail and the §1 heading.
    expect(
      screen.getAllByText('v2.settings.appearance.title.cockpit').length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('navigates between pages', async () => {
    renderApp();

    await waitFor(() => {
      expect(
        screen.getByText('v2.voice.readiness.cockpit'),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.navSettings.cockpit' }),
    );
    await waitFor(() => {
      expect(
        screen.getByText('v2.settings.railSections.cockpit'),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.navInventory.cockpit' }),
    );
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'v2.voice.addItem.cockpit' }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.navHome.cockpit' }),
    );
    await waitFor(() => {
      expect(
        screen.getByText('v2.voice.readiness.cockpit'),
      ).toBeInTheDocument();
    });
  });

  it('navigates to help page', async () => {
    renderApp();

    await waitFor(() => {
      expect(
        screen.getByText('v2.voice.readiness.cockpit'),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.navHelp.cockpit' }),
    );

    // v2 Guide renders §1–§6 sections; §1 is always present.
    await waitFor(() => {
      expect(screen.getByText('§1')).toBeInTheDocument();
    });
  });

  it('shows onboarding when not completed', async () => {
    // Clear localStorage and set data with onboarding not completed
    localStorage.clear();
    const appData = createMockAppData({
      settings: {
        language: 'en',
        theme: 'cockpit',
        highContrast: false,
        onboardingCompleted: false,
      },
    } as Parameters<typeof createMockAppData>[0]);
    saveAppData(appData);

    renderApp();

    // v2 onboarding step 01 (Welcome) leads with the step indicator.
    await waitFor(() => {
      expect(screen.getByText('v2.onboarding.stepLabel')).toBeInTheDocument();
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

    await waitFor(() => {
      expect(
        screen.getByText('v2.voice.readiness.cockpit'),
      ).toBeInTheDocument();
    });

    // v2 dashboard tags each category tile with v2-category-<id>.
    const tile = screen.getByTestId('v2-category-water-beverages');
    fireEvent.click(tile);

    // Should land on Inventory.
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'v2.voice.addItem.cockpit' }),
      ).toBeInTheDocument();
    });

    // The category rail should arrive with water-beverages selected.
    expect(
      screen.getByTestId('v2-category-row-water-beverages'),
    ).toHaveAttribute('aria-current', 'true');
  });
});
