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
    localStorage.removeItem('est:design:shopping-checked');
  });

  it('renders the procurement title in cockpit voice', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('PROCUREMENT QUEUE')).toBeInTheDocument();
    });
  });

  it('renders empty-state copy when there is nothing to buy', async () => {
    setup();
    await waitFor(() => {
      expect(
        screen.getByText(/NIL · NO PROCUREMENT REQUIRED/),
      ).toBeInTheDocument();
    });
  });

  it('renders the queue caption with open and done counts', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText(/QUEUE · 0 OPEN · 0 DONE/)).toBeInTheDocument();
    });
  });

  it('renders the open-items side panel and RESET button', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('OPEN ITEMS')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'RESET' })).toBeInTheDocument();
  });

  it('clicking RESET clears stored check state', async () => {
    localStorage.setItem(
      'est:design:shopping-checked',
      JSON.stringify({ x: true }),
    );
    setup();
    await waitFor(() => screen.getByRole('button', { name: 'RESET' }));
    fireEvent.click(screen.getByRole('button', { name: 'RESET' }));
    expect(localStorage.getItem('est:design:shopping-checked')).toBe('{}');
  });
});
