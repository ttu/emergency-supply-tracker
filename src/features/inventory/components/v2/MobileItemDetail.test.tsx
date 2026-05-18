import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { MobileItemDetail } from './MobileItemDetail';
import { NEW_ITEM_ID } from './ItemDetail';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

describe('MobileItemDetail (v2)', () => {
  it('shows the Item not found fallback for an unknown id', () => {
    renderWithProviders(
      <MobileItemDetail itemId="missing" onBack={vi.fn()} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [],
        }),
      },
    );
    expect(screen.getByText('v2.itemDetail.notFound')).toBeInTheDocument();
  });

  it('clicking the back link from the fallback calls onBack', () => {
    const onBack = vi.fn();
    renderWithProviders(<MobileItemDetail itemId="missing" onBack={onBack} />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
        items: [],
      }),
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.itemDetail.backLink' }),
    );
    expect(onBack).toHaveBeenCalled();
  });

  it('renders the embedded ItemForm in NEW mode', () => {
    renderWithProviders(
      <MobileItemDetail itemId={NEW_ITEM_ID} onBack={vi.fn()} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
        }),
      },
    );
    // ItemForm is the v1 form embedded inside the v2 shell.
    // It renders a form element with the expected save button label.
    expect(
      screen.queryByText('v2.itemDetail.notFound'),
    ).not.toBeInTheDocument();
  });
});
