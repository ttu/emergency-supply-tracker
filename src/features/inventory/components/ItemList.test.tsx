import { render, screen, fireEvent } from '@testing-library/react';
import { ItemList } from './ItemList';
import type { InventoryItem } from '@/shared/types';

// Mock ItemCard component
jest.mock('./ItemCard', () => ({
  ItemCard: ({
    item,
    onClick,
  }: {
    item: InventoryItem;
    onClick?: () => void;
  }) => (
    <div data-testid={`item-${item.id}`} onClick={onClick}>
      {item.name}
    </div>
  ),
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ItemList', () => {
  const now = new Date().toISOString();
  const sampleItems: InventoryItem[] = [
    {
      id: '1',
      name: 'Item 1',
      itemType: 'bottled-water',
      categoryId: 'water-beverages',
      quantity: 10,
      unit: 'liters',
      recommendedQuantity: 20,
      neverExpires: false,
      expirationDate: '2026-12-31',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '2',
      name: 'Item 2',
      itemType: 'canned-food',
      categoryId: 'food',
      quantity: 5,
      unit: 'cans',
      recommendedQuantity: 10,
      neverExpires: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  it('should render all items', () => {
    render(<ItemList items={sampleItems} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should show empty state when no items', () => {
    render(<ItemList items={[]} />);

    expect(screen.getByText('inventory.noItems')).toBeInTheDocument();
  });

  it('should show custom empty message when provided', () => {
    render(<ItemList items={[]} emptyMessage="No items in category" />);

    expect(screen.getByText('No items in category')).toBeInTheDocument();
  });

  it('should call onItemClick when an item is clicked', () => {
    const onItemClick = jest.fn();
    render(<ItemList items={sampleItems} onItemClick={onItemClick} />);

    const item = screen.getByTestId('item-1');
    fireEvent.click(item);

    expect(onItemClick).toHaveBeenCalledWith(sampleItems[0]);
  });

  it('should not call onItemClick when not provided', () => {
    // Should not throw error when clicking without onItemClick
    render(<ItemList items={sampleItems} />);

    const item = screen.getByTestId('item-1');
    expect(() => fireEvent.click(item)).not.toThrow();
  });

  it('should render empty state with icon', () => {
    render(<ItemList items={[]} />);

    // Check for the emoji icon in the empty state
    expect(screen.getByText('📦')).toBeInTheDocument();
    expect(screen.getByText('inventory.noItems')).toBeInTheDocument();
  });
});
