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

    // Design v2 cockpit shell uses uppercase voice strings, not i18n keys.
    expect(
      screen.getByRole('button', { name: 'OVERVIEW' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'INVENTORY' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SETTINGS' }),
    ).toBeInTheDocument();
  });

  it('renders dashboard by default', async () => {
    renderApp();

    // The v2 dashboard leads with the READINESS caption (no Quick Actions).
    await waitFor(() => {
      expect(screen.getByText('READINESS')).toBeInTheDocument();
    });
  });

  it('navigates to inventory when clicking inventory button', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('READINESS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'INVENTORY' }));

    // v2 Inventory shows the "+ ADD" primary button and an "ALL" filter chip.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '+ ADD' })).toBeInTheDocument();
    });
    expect(screen.queryByText('READINESS')).not.toBeInTheDocument();
  });

  it('navigates to settings when clicking settings button', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('READINESS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'SETTINGS' }));

    // v2 Settings has a sub-nav rail captioned "SECTIONS".
    await waitFor(() => {
      expect(screen.getByText('SECTIONS')).toBeInTheDocument();
    });
    // APPEARANCE shows up in both the rail and the §1 heading.
    expect(screen.getAllByText('APPEARANCE').length).toBeGreaterThanOrEqual(2);
  });

  it('navigates between pages', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('READINESS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'SETTINGS' }));
    await waitFor(() => {
      expect(screen.getByText('SECTIONS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'INVENTORY' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '+ ADD' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'OVERVIEW' }));
    await waitFor(() => {
      expect(screen.getByText('READINESS')).toBeInTheDocument();
    });
  });

  it('navigates to help page', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('READINESS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'GUIDE' }));

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
      expect(screen.getByText(/STEP 01 \/ 05 · WELCOME/)).toBeInTheDocument();
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
      expect(screen.getByText('READINESS')).toBeInTheDocument();
    });

    // v2 dashboard tags each category tile with v2-category-<id>.
    const tile = screen.getByTestId('v2-category-water-beverages');
    fireEvent.click(tile);

    // Should land on Inventory.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '+ ADD' })).toBeInTheDocument();
    });

    // The category filter dropdown should be preselected to water-beverages.
    const categorySelect = screen.getByLabelText('CATEGORY');
    expect((categorySelect as HTMLSelectElement).value).toBe('water-beverages');
  });
});
