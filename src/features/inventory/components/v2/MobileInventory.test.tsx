import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { MobileInventory } from './MobileInventory';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

const renderInv = (onAddItem = vi.fn()) =>
  renderWithProviders(
    <MobileInventory
      onItemSelect={vi.fn()}
      onCategoryChange={vi.fn()}
      onAddItem={onAddItem}
    />,
    {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    },
  );

describe('MobileInventory (v2)', () => {
  it('renders the cockpit filter chip labels', () => {
    renderInv();
    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CRIT' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'WARN' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EXP' })).toBeInTheDocument();
  });

  it('clicking the + ADD ITEM button calls onAddItem', () => {
    const onAddItem = vi.fn();
    renderInv(onAddItem);
    fireEvent.click(screen.getByRole('button', { name: '+ ADD ITEM' }));
    expect(onAddItem).toHaveBeenCalled();
  });
});
