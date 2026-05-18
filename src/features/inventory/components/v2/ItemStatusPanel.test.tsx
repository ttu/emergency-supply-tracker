import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ItemStatusPanel } from './ItemStatusPanel';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderPanel = (
  props: Partial<Parameters<typeof ItemStatusPanel>[0]> = {},
) =>
  renderWithProviders(
    <ItemStatusPanel
      status="warn"
      pct={45}
      quantity={4}
      recommended={10}
      unit="L"
      {...props}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('ItemStatusPanel (v2)', () => {
  it('renders the status caption in cockpit voice', () => {
    renderPanel();
    expect(
      screen.getByText('v2.itemDetail.statusCaption.cockpit'),
    ).toBeInTheDocument();
  });

  it('renders the percentage value and qty/rec breakdown', () => {
    renderPanel({ pct: 45, quantity: 4, recommended: 10, unit: 'L' });
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
    expect(screen.getByText(/4\s*\/\s*10\s*L/)).toBeInTheDocument();
  });

  it('shows em-dash when recommended is zero', () => {
    renderPanel({ recommended: 0 });
    expect(screen.getByText(/—\s*L/)).toBeInTheDocument();
  });
});
