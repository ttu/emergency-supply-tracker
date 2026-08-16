import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { DesignApp } from './DesignApp';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import {
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';

const soup = createMockInventoryItem({
  name: 'Canned soup',
  itemType: createProductTemplateId('canned-soup'),
  categoryId: createCategoryId('food'),
  quantity: createQuantity(12),
  unit: 'cans',
  neverExpires: true,
});

const setup = () =>
  renderWithProviders(<DesignApp />, {
    initialAppData: createMockAppData({
      settings: createMockSettings({ theme: 'cockpit' }),
      items: [soup],
      customCategories: [],
    }),
  });

const nav = (id: string) => screen.getByTestId(`v2-nav-${id}`);

describe('DesignApp', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens on the dashboard', async () => {
    setup();
    expect(
      await screen.findByText('v2.voice.readiness.cockpit'),
    ).toBeInTheDocument();
  });

  it('exposes exactly the four destinations', () => {
    setup();
    for (const id of ['home', 'inv', 'help', 'settings']) {
      expect(nav(id)).toBeInTheDocument();
    }
    for (const id of ['alerts', 'shop', 'plan']) {
      expect(screen.queryByTestId(`v2-nav-${id}`)).not.toBeInTheDocument();
    }
  });

  it('navigates to inventory and back to the overview', async () => {
    setup();
    await screen.findByText('v2.voice.readiness.cockpit');

    fireEvent.click(nav('inv'));
    expect(
      await screen.findByRole('button', { name: 'v2.voice.addItem.cockpit' }),
    ).toBeInTheDocument();

    fireEvent.click(nav('home'));
    expect(
      await screen.findByText('v2.voice.readiness.cockpit'),
    ).toBeInTheDocument();
  });

  it('navigates to help and settings', async () => {
    setup();
    await screen.findByText('v2.voice.readiness.cockpit');

    fireEvent.click(nav('help'));
    expect(await screen.findByText('§1')).toBeInTheDocument();

    fireEvent.click(nav('settings'));
    expect(
      await screen.findByText('v2.settings.railSections.cockpit'),
    ).toBeInTheDocument();
  });

  it('opens the add-item view from inventory and closes it again', async () => {
    setup();
    fireEvent.click(nav('inv'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'v2.voice.addItem.cockpit' }),
    );

    // Adding now starts at the product picker; "custom" reaches the form.
    fireEvent.click(await screen.findByRole('button', { name: /custom/i }));
    await waitFor(() =>
      expect(document.querySelector('#name')).toBeInTheDocument(),
    );

    // Re-selecting the destination clears the open item and shows the list.
    fireEvent.click(nav('inv'));
    expect(
      await screen.findByRole('button', { name: 'v2.voice.addItem.cockpit' }),
    ).toBeInTheDocument();
  });

  it('selecting an item opens its record, and nav returns to the list', async () => {
    setup();
    fireEvent.click(nav('inv'));
    fireEvent.click(await screen.findByText('Canned soup'));

    await waitFor(() =>
      expect(document.querySelector('#name')).toBeInTheDocument(),
    );

    fireEvent.click(nav('inv'));
    expect(
      await screen.findByRole('button', { name: 'v2.voice.addItem.cockpit' }),
    ).toBeInTheDocument();
  });

  it('a dashboard category tile lands on inventory filtered to it', async () => {
    setup();
    fireEvent.click(await screen.findByTestId('v2-category-food'));

    // The category rail replaced the dropdown; the arriving filter shows as
    // the selected row.
    expect(await screen.findByTestId('v2-category-row-food')).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('leaving inventory and returning finds the filter as it was left', async () => {
    setup();
    fireEvent.click(await screen.findByTestId('v2-category-food'));
    await screen.findByTestId('v2-category-row-food');

    fireEvent.click(nav('home'));
    await screen.findByText('v2.voice.readiness.cockpit');
    fireEvent.click(nav('inv'));

    // Filters persist: a round trip to an item or the dashboard should not
    // mean setting the list back up again.
    expect(await screen.findByTestId('v2-category-row-food')).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('the back link leaves an open item without changing destination', async () => {
    setup();
    fireEvent.click(nav('inv'));
    fireEvent.click(await screen.findByText('Canned soup'));
    await waitFor(() =>
      expect(document.querySelector('#name')).toBeInTheDocument(),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /v2\.voice\.inventory\.cockpit/ }),
    );

    expect(
      await screen.findByRole('button', { name: 'v2.voice.addItem.cockpit' }),
    ).toBeInTheDocument();
  });

  it('copying an item opens a fresh record seeded from it', async () => {
    setup();
    fireEvent.click(nav('inv'));
    fireEvent.click(await screen.findByText('Canned soup'));
    await waitFor(() =>
      expect(document.querySelector('#name')).toBeInTheDocument(),
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'v2.voice.copy.cockpit' }),
    );

    // A copy is a new item, so the header says so rather than naming the
    // source — otherwise there is no telling the two records apart.
    expect(
      await screen.findByText('v2.itemDetail.captionNew.cockpit'),
    ).toBeInTheDocument();
  });
});
