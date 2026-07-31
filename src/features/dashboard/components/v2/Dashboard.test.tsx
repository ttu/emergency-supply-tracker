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
        onItemSelect={vi.fn()}
        {...overrides}
      />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
        }),
      },
    );

  it('renders the greeting caption and hero title in cockpit theme', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('v2.voice.greeting.cockpit')).toBeInTheDocument();
    });
    expect(screen.getByText('v2.dashboard.heroCockpit')).toBeInTheDocument();
  });

  it('composes KpiRow + CoverageMatrix + PriorityQueue', async () => {
    setup();
    await waitFor(() => {
      expect(
        screen.getByText('v2.voice.readiness.cockpit'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('v2.dashboard.coverageTitle.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.dashboard.priorityTitle.cockpit'),
    ).toBeInTheDocument();
  });

  it('clicking view-all on priority queue calls onViewAllPriority', async () => {
    const onViewAllPriority = vi.fn();
    setup({ onViewAllPriority });
    await screen.findByRole('button', { name: 'v2.dashboard.priorityViewAll' });
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.dashboard.priorityViewAll' }),
    );
    expect(onViewAllPriority).toHaveBeenCalled();
  });
});
