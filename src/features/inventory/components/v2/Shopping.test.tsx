import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { Shopping } from './Shopping';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

const setup = () =>
  renderWithProviders(<Shopping />, {
    initialAppData: createMockAppData({
      settings: createMockSettings({ theme: 'cockpit' }),
      items: [],
    }),
  });

describe('Shopping (v2)', () => {
  beforeEach(() => {
    localStorage.removeItem('est:shopping-checked');
  });

  it('renders the procurement title in cockpit voice', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('v2.shopping.title.cockpit')).toBeInTheDocument();
    });
  });

  it('renders empty-state copy when there is nothing to buy', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('v2.shopping.empty.cockpit')).toBeInTheDocument();
    });
  });

  it('renders the queue caption with open and done counts', async () => {
    setup();
    await waitFor(() => {
      expect(
        screen.getByText('v2.shopping.queueCaption.cockpit'),
      ).toBeInTheDocument();
    });
  });

  it('renders the open-items side panel and RESET button', async () => {
    setup();
    await waitFor(() => {
      expect(
        screen.getByText('v2.shopping.itemsToBuy.cockpit'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: 'v2.shopping.reset.cockpit' }),
    ).toBeInTheDocument();
  });

  it('clicking RESET clears stored check state', async () => {
    localStorage.setItem('est:shopping-checked', JSON.stringify({ x: true }));
    setup();
    await waitFor(() =>
      screen.getByRole('button', { name: 'v2.shopping.reset.cockpit' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.shopping.reset.cockpit' }),
    );
    expect(localStorage.getItem('est:shopping-checked')).toBe('{}');
  });
});
