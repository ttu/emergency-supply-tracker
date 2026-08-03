import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardComplete } from './OnboardComplete';
import { renderWithProviders } from '@/test/render';
import {
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createQuantity } from '@/shared/types';
import type { HouseholdConfig } from '@/shared/types';

const household: HouseholdConfig = {
  adults: 2,
  children: 0,
  pets: 0,
  supplyDurationDays: 7,
  useFreezer: false,
};

const itemsAt = (quantity: number, count: number) =>
  Array.from({ length: count }, () =>
    createMockInventoryItem({ quantity: createQuantity(quantity) }),
  );

const renderComplete = (
  props: Partial<Parameters<typeof OnboardComplete>[0]> = {},
) =>
  renderWithProviders(
    <OnboardComplete
      household={household}
      items={itemsAt(0, 10)}
      onComplete={vi.fn()}
      {...props}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('OnboardComplete', () => {
  it('hands the finished household and its items to the caller', () => {
    const onComplete = vi.fn();
    const items = itemsAt(0, 3);
    renderComplete({ items, onComplete });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.complete.openDashboard.cockpit',
      }),
    );
    expect(onComplete).toHaveBeenCalledWith(household, items);
  });

  it('reports how many items the setup produced', () => {
    renderComplete({ items: itemsAt(0, 12) });
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('reads 0% readiness when nothing was marked owned', () => {
    renderComplete({ items: itemsAt(0, 10) });
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('reflects what the household already had', () => {
    // Four of ten on hand — the figure is derived, not the hardcoded zero the
    // screen used to show whatever the setup produced.
    renderComplete({ items: [...itemsAt(3, 4), ...itemsAt(0, 6)] });
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('survives a skipped checklist without dividing by zero', () => {
    renderComplete({ items: [] });
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.queryByText('NaN')).not.toBeInTheDocument();
  });

  it('shows the household supply target', () => {
    renderComplete({ household: { ...household, supplyDurationDays: 14 } });
    expect(screen.getByText('14')).toBeInTheDocument();
  });
});
