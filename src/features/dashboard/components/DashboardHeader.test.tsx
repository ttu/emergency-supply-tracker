import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardHeader } from './DashboardHeader';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'dashboard.title': 'Dashboard',
        'dashboard.subtitle': `{{people}} people, {{days}} days supply`,
        'dashboard.inventoryTrackingMode': 'Inventory tracking mode',
        'dashboard.preparedness.excellent': 'Excellent',
        'dashboard.preparedness.good': 'Good',
        'dashboard.preparedness.needsWork': 'Needs Work',
      };
      let text = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          text = text.replace(`{{${key}}}`, String(value));
        });
      }
      return text;
    },
  }),
}));

describe('DashboardHeader', () => {
  it('renders title and subtitle', () => {
    render(
      <DashboardHeader
        preparednessScore={75}
        householdSize={4}
        supplyDays={3}
      />,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('4 people, 3 days supply')).toBeInTheDocument();
  });

  it('displays preparedness score', () => {
    render(
      <DashboardHeader
        preparednessScore={85}
        householdSize={2}
        supplyDays={3}
      />,
    );

    expect(screen.getByText('85')).toBeInTheDocument();
    // Use getAllByText and check the first occurrence
    const percentSigns = screen.getAllByText('%');
    expect(percentSigns.length).toBeGreaterThan(0);
    expect(percentSigns[0]).toBeInTheDocument();
  });

  it('shows excellent label for high scores', () => {
    render(
      <DashboardHeader
        preparednessScore={95}
        householdSize={2}
        supplyDays={3}
      />,
    );

    // Use getAllByText and check the first occurrence
    const excellentLabels = screen.getAllByText('Excellent');
    expect(excellentLabels.length).toBeGreaterThan(0);
    expect(excellentLabels[0]).toBeInTheDocument();
  });

  it('shows good label for medium scores', () => {
    render(
      <DashboardHeader
        preparednessScore={65}
        householdSize={2}
        supplyDays={3}
      />,
    );

    // Use getAllByText and check the first occurrence
    const goodLabels = screen.getAllByText('Good');
    expect(goodLabels.length).toBeGreaterThan(0);
    expect(goodLabels[0]).toBeInTheDocument();
  });

  it('shows needs work label for low scores', () => {
    render(
      <DashboardHeader
        preparednessScore={30}
        householdSize={2}
        supplyDays={3}
      />,
    );

    expect(screen.getByText('Needs Work')).toBeInTheDocument();
  });

  it('shows inventory tracking mode when household is disabled', () => {
    render(
      <DashboardHeader
        preparednessScore={50}
        householdSize={2}
        supplyDays={3}
        householdEnabled={false}
      />,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Inventory tracking mode')).toBeInTheDocument();
    expect(
      screen.queryByText('2 people, 3 days supply'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('50')).not.toBeInTheDocument();
  });
});
