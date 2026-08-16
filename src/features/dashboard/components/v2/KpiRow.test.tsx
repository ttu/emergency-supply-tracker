import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { KpiRow } from './KpiRow';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockHousehold,
  createMockSettings,
} from '@/shared/utils/test/factories';

// The target line interpolates the household's own duration, so this file needs
// a mock that resolves {{days}} rather than echoing the key.
vi.mock('react-i18next', async () => {
  const { createI18nMock } = await import('@/test/i18n');
  return createI18nMock({
    translations: {
      'v2.dashboard.kpiTarget.cockpit': 'TARGET: {{days}}D',
      'v2.dashboard.kpiLimitedBy.cockpit': 'LIMITED BY: {{resource}}',
      'v2.dashboard.limit.water.cockpit': 'WATER',
      'v2.dashboard.limit.food.cockpit': 'FOOD',
    },
  });
});

const cockpit = createMockSettings({ theme: 'cockpit' });

describe('KpiRow (v2)', () => {
  it('renders the four KPI labels in cockpit theme', () => {
    renderWithProviders(<KpiRow />, {
      initialAppData: createMockAppData({ settings: cockpit }),
    });
    expect(screen.getByText('v2.voice.readiness.cockpit')).toBeInTheDocument();
    expect(
      screen.getByText('v2.voice.daysCovered.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.voice.expiringSoon.cockpit'),
    ).toBeInTheDocument();
    expect(screen.getByText('v2.voice.critical.cockpit')).toBeInTheDocument();
  });

  it('renders OK/WARN/CRIT mini-tally legend under readiness', () => {
    renderWithProviders(<KpiRow />, {
      initialAppData: createMockAppData({ settings: cockpit }),
    });
    expect(screen.getByText(/v2\.dashboard\.statusOk$/)).toBeInTheDocument();
    expect(screen.getByText(/v2\.dashboard\.statusWarn$/)).toBeInTheDocument();
    expect(screen.getByText(/v2\.dashboard\.statusCrit$/)).toBeInTheDocument();
  });

  it('shows the household target rather than a hardcoded seven days', () => {
    renderWithProviders(<KpiRow />, {
      initialAppData: createMockAppData({
        settings: cockpit,
        household: createMockHousehold({ supplyDurationDays: 3 }),
      }),
    });

    expect(screen.getByText('TARGET: 3D')).toBeInTheDocument();
  });

  it('names the limiting resource while the household is short of its target', () => {
    renderWithProviders(<KpiRow />, {
      initialAppData: createMockAppData({
        settings: cockpit,
        household: createMockHousehold({ supplyDurationDays: 7 }),
        items: [],
      }),
    });

    // An empty inventory covers no days at all, so something must be limiting.
    expect(screen.getByText(/^LIMITED BY: /)).toBeInTheDocument();
  });
});
