import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ItemOpsPanel } from './ItemOpsPanel';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const renderPanel = (onAdjust = vi.fn()) =>
  renderWithProviders(
    <ItemOpsPanel itemName="Bottled water" onAdjust={onAdjust} />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('ItemOpsPanel (v2)', () => {
  it('renders the OPS caption and three quick-action buttons', () => {
    renderPanel();
    expect(screen.getByText('OPS')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Decrease Bottled water by 1' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Increase Bottled water by 1' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CONSUME' })).toBeInTheDocument();
  });

  it('+1 calls onAdjust(+1)', () => {
    const onAdjust = vi.fn();
    renderPanel(onAdjust);
    fireEvent.click(
      screen.getByRole('button', { name: 'Increase Bottled water by 1' }),
    );
    expect(onAdjust).toHaveBeenCalledWith(1);
  });

  it('−1 and CONSUME both call onAdjust(-1)', () => {
    const onAdjust = vi.fn();
    renderPanel(onAdjust);
    fireEvent.click(
      screen.getByRole('button', { name: 'Decrease Bottled water by 1' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'CONSUME' }));
    expect(onAdjust).toHaveBeenNthCalledWith(1, -1);
    expect(onAdjust).toHaveBeenNthCalledWith(2, -1);
  });
});
