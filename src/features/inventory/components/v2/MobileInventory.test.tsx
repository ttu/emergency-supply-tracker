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
    expect(
      screen.getByRole('button', { name: 'v2.inventory.filterAll.cockpit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'v2.inventory.filterCrit.cockpit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'v2.inventory.filterWarn.cockpit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'v2.inventory.filterOk.cockpit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'v2.inventory.filterExpShort.cockpit',
      }),
    ).toBeInTheDocument();
  });

  it('clicking the add-item button calls onAddItem', () => {
    const onAddItem = vi.fn();
    renderInv(onAddItem);
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.addItem.cockpit' }),
    );
    expect(onAddItem).toHaveBeenCalled();
  });
});
