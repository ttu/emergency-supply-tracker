import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('Dashboard (v2)', () => {
  const setup = (overrides: Partial<Parameters<typeof Dashboard>[0]> = {}) =>
    renderWithProviders(
      <Dashboard
        onCategorySelect={vi.fn()}
        onViewAllPriority={vi.fn()}
        {...overrides}
      />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
        }),
      },
    );

  it('renders the greeting caption and hero title in cockpit voice', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('OVERVIEW')).toBeInTheDocument();
    });
    expect(screen.getByText('HOUSEHOLD STATUS')).toBeInTheDocument();
  });

  it('composes KpiRow + CoverageMatrix + PriorityQueue', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('READINESS')).toBeInTheDocument();
    });
    expect(screen.getByText(/COVERAGE MATRIX/)).toBeInTheDocument();
    expect(screen.getByText(/PRIORITY QUEUE/)).toBeInTheDocument();
  });

  it('clicking VIEW ALL → on priority queue calls onViewAllPriority', async () => {
    const onViewAllPriority = vi.fn();
    setup({ onViewAllPriority });
    await waitFor(() => screen.getByRole('button', { name: /VIEW ALL/ }));
    fireEvent.click(screen.getByRole('button', { name: /VIEW ALL/ }));
    expect(onViewAllPriority).toHaveBeenCalled();
  });
});
