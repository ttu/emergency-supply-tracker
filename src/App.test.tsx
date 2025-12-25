import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('App', () => {
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
});
