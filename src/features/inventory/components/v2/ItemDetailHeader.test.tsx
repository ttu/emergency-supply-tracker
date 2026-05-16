import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ItemDetailHeader } from './ItemDetailHeader';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const render = (props: Partial<Parameters<typeof ItemDetailHeader>[0]> = {}) =>
  renderWithProviders(<ItemDetailHeader isNew={false} {...props} />, {
    initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
  });

describe('ItemDetailHeader (v2)', () => {
  it('renders ADD ITEM title and NEW ITEM caption in new mode', () => {
    render({ isNew: true });
    expect(screen.getByText('NEW ITEM')).toBeInTheDocument();
    expect(screen.getByText('ADD ITEM')).toBeInTheDocument();
  });

  it('renders item name + ITEM RECORD caption when editing existing item', () => {
    render({
      isNew: false,
      itemName: 'Bottled water',
      itemCategoryId: 'water-beverages',
      categoryName: 'Water & beverages',
    });
    expect(screen.getByText('ITEM RECORD')).toBeInTheDocument();
    expect(screen.getByText('Bottled water')).toBeInTheDocument();
    expect(screen.getByText(/H2O\s*·\s*Water & beverages/)).toBeInTheDocument();
  });

  it('shows DELETE button only when editing an existing item', () => {
    const onDelete = vi.fn();
    const { rerender } = render({
      isNew: false,
      itemName: 'A',
      onDelete,
    });
    fireEvent.click(screen.getByRole('button', { name: 'DELETE' }));
    expect(onDelete).toHaveBeenCalled();

    rerender(<ItemDetailHeader isNew={true} onDelete={onDelete} />);
    expect(
      screen.queryByRole('button', { name: 'DELETE' }),
    ).not.toBeInTheDocument();
  });
});
