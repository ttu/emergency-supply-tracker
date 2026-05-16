import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { KpiRow } from './KpiRow';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('KpiRow (v2)', () => {
  it('renders the four KPI labels in cockpit voice', () => {
    renderWithProviders(<KpiRow />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText('READINESS')).toBeInTheDocument();
    expect(screen.getByText('DAYS COVERED')).toBeInTheDocument();
    expect(screen.getByText(/EXPIRING/)).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('renders OK/WARN/CRIT mini-tally legend under readiness', () => {
    renderWithProviders(<KpiRow />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText(/OK$/)).toBeInTheDocument();
    expect(screen.getByText(/WARN$/)).toBeInTheDocument();
    expect(screen.getByText(/CRIT$/)).toBeInTheDocument();
  });
});
