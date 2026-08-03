import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { OnboardQuickSetup } from './OnboardQuickSetup';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import type { HouseholdConfig } from '@/shared/types';

const household: HouseholdConfig = {
  adults: 2,
  children: 0,
  pets: 0,
  supplyDurationDays: 7,
  useFreezer: false,
};

const firstItemId = String(
  RECOMMENDED_ITEMS.find((i) => !i.requiresFreezer && !i.scaleWithPets)!.id,
);

const renderStep = (
  props: Partial<Parameters<typeof OnboardQuickSetup>[0]> = {},
) =>
  renderWithProviders(
    <OnboardQuickSetup
      household={household}
      onAddItems={vi.fn()}
      onSkip={vi.fn()}
      onTryDemoData={vi.fn()}
      onBack={vi.fn()}
      {...props}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

/** The checklist ships collapsed; the per-line controls need it opened. */
const openList = () =>
  fireEvent.click(screen.getByTestId('v2-quick-setup-details'));

describe('OnboardQuickSetup', () => {
  it('keeps the checklist collapsed until asked', () => {
    renderStep();
    expect(screen.getByTestId('v2-quick-setup-details')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(
      screen.queryByTestId(`v2-quick-setup-item-${firstItemId}`),
    ).toBeNull();
    // Nothing to select or deselect while it is shut.
    expect(screen.queryByTestId('v2-quick-setup-select-all')).toBeNull();
  });

  it('starts with everything ticked', () => {
    renderStep();
    openList();
    expect(
      screen.getByTestId(`v2-quick-setup-item-${firstItemId}`),
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('hands back every offered product when nothing was unticked', () => {
    const onAddItems = vi.fn();
    renderStep({ onAddItems });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.quickSetup.addAll.cockpit',
      }),
    );
    const { selectedIds, ownedIds } = onAddItems.mock.calls[0][0];
    expect(selectedIds.size).toBeGreaterThan(0);
    expect(ownedIds.size).toBe(0);
  });

  it('drops an unticked product from the selection', () => {
    const onAddItems = vi.fn();
    renderStep({ onAddItems });
    openList();

    fireEvent.click(screen.getByTestId(`v2-quick-setup-item-${firstItemId}`));
    expect(
      screen.getByTestId(`v2-quick-setup-item-${firstItemId}`),
    ).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.quickSetup.addSelected.cockpit',
      }),
    );
    expect(onAddItems.mock.calls[0][0].selectedIds.has(firstItemId)).toBe(
      false,
    );
  });

  it('carries what the household already has', () => {
    const onAddItems = vi.fn();
    renderStep({ onAddItems });
    openList();

    fireEvent.click(screen.getByTestId(`v2-quick-setup-owned-${firstItemId}`));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.quickSetup.addAll.cockpit',
      }),
    );
    expect(onAddItems.mock.calls[0][0].ownedIds.has(firstItemId)).toBe(true);
  });

  it('cannot mark an unticked product as owned', () => {
    renderStep();
    openList();
    fireEvent.click(screen.getByTestId(`v2-quick-setup-item-${firstItemId}`));
    expect(
      screen.getByTestId(`v2-quick-setup-owned-${firstItemId}`),
    ).toBeDisabled();
  });

  it('deselect all clears every tick, and selecting all restores them', () => {
    renderStep();
    openList();
    const toggle = () => screen.getByTestId('v2-quick-setup-select-all');

    fireEvent.click(toggle());
    expect(
      screen.getByTestId(`v2-quick-setup-item-${firstItemId}`),
    ).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(toggle());
    expect(
      screen.getByTestId(`v2-quick-setup-item-${firstItemId}`),
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('reopening and reclosing the list does not lose the selection', () => {
    const onAddItems = vi.fn();
    renderStep({ onAddItems });

    openList();
    fireEvent.click(screen.getByTestId(`v2-quick-setup-item-${firstItemId}`));
    openList(); // shut again
    expect(
      screen.queryByTestId(`v2-quick-setup-item-${firstItemId}`),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.quickSetup.addSelected.cockpit',
      }),
    );
    const { selectedIds } = onAddItems.mock.calls[0][0];
    expect(selectedIds.size).toBeGreaterThan(0);
    expect(selectedIds.has(firstItemId)).toBe(false);
  });

  it('withholds pet supplies from a household with no pets', () => {
    renderStep();
    openList();
    const petItem = RECOMMENDED_ITEMS.find((i) => i.scaleWithPets);
    expect(petItem).toBeDefined();
    expect(
      screen.queryByTestId(`v2-quick-setup-item-${String(petItem!.id)}`),
    ).toBeNull();
  });

  it('offers a way past the list entirely', () => {
    const onSkip = vi.fn();
    const onTryDemoData = vi.fn();
    renderStep({ onSkip, onTryDemoData });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.quickSetup.skip.cockpit',
      }),
    );
    expect(onSkip).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.onboarding.quickSetup.tryDemo.cockpit',
      }),
    );
    expect(onTryDemoData).toHaveBeenCalledTimes(1);
  });
});
