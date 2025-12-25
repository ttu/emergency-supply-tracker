import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { DashboardHeader } from './DashboardHeader';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'dashboard.title': 'Dashboard',
        'dashboard.subtitle': `{{people}} people, {{days}} days supply`,
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
        supplyDays={7}
      />,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('4 people, 7 days supply')).toBeInTheDocument();
  });

  it('displays preparedness score', () => {
    render(
      <DashboardHeader
        preparednessScore={85}
        householdSize={2}
        supplyDays={7}
      />,
    );

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('shows excellent label for high scores', () => {
    render(
      <DashboardHeader
        preparednessScore={95}
        householdSize={2}
        supplyDays={7}
      />,
    );

    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('shows good label for medium scores', () => {
    render(
      <DashboardHeader
        preparednessScore={65}
        householdSize={2}
        supplyDays={7}
      />,
    );

    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('shows needs work label for low scores', () => {
    render(
      <DashboardHeader
        preparednessScore={30}
        householdSize={2}
        supplyDays={7}
      />,
    );

    expect(screen.getByText('Needs Work')).toBeInTheDocument();
  });
});
