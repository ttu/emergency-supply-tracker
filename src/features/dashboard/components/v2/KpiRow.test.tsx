import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { KpiRow } from './KpiRow';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('KpiRow (v2)', () => {
  it('renders the four KPI labels in cockpit theme', () => {
    renderWithProviders(<KpiRow />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
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
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText(/v2\.dashboard\.statusOk$/)).toBeInTheDocument();
    expect(screen.getByText(/v2\.dashboard\.statusWarn$/)).toBeInTheDocument();
    expect(screen.getByText(/v2\.dashboard\.statusCrit$/)).toBeInTheDocument();
  });
});
