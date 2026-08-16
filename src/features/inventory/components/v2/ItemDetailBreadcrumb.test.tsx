import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ItemDetailBreadcrumb } from './ItemDetailBreadcrumb';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const render = (
  props: Partial<Parameters<typeof ItemDetailBreadcrumb>[0]> = {},
) =>
  renderWithProviders(<ItemDetailBreadcrumb onBack={vi.fn()} {...props} />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('ItemDetailBreadcrumb (v2)', () => {
  it('renders ← INVENTORY back link and NEW label when no item/category is set', () => {
    render();
    expect(
      screen.getByRole('button', { name: /←\s*v2\.voice\.inventory\.cockpit/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.inventory.newCatLabel.cockpit'),
    ).toBeInTheDocument();
  });

  it('shows category code from defaultCategoryId when creating a new item', () => {
    render({ defaultCategoryId: 'water-beverages' });
    expect(screen.getByText('H2O')).toBeInTheDocument();
  });

  it('shows category code and truncated item id for an existing item', () => {
    render({ itemId: 'abcdefghijklmnop', itemCategoryId: 'food' });
    expect(screen.getByText('FUD')).toBeInTheDocument();
    expect(screen.getByText('abcdefghij')).toBeInTheDocument();
  });

  it('clicking the back link calls onBack', () => {
    const onBack = vi.fn();
    render({ onBack });
    fireEvent.click(
      screen.getByRole('button', { name: /←\s*v2\.voice\.inventory\.cockpit/ }),
    );
    expect(onBack).toHaveBeenCalled();
  });
});
