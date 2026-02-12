import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemList } from './ItemList';
import type { InventoryItem } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createDateOnly,
  createQuantity,
} from '@/shared/types';

// Mock ItemCard component
vi.mock('./ItemCard', () => ({
  ItemCard: ({
    item,
    onItemClick,
    onQuantityChange,
  }: {
    item: InventoryItem;
    onItemClick?: (item: InventoryItem) => void;
    onQuantityChange?: (item: InventoryItem, newQuantity: number) => void;
  }) => (
    <div data-testid={`item-${item.id}`} onClick={() => onItemClick?.(item)}>
      {item.name}
      <button
        data-testid={`quantity-increase-${item.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onQuantityChange?.(item, item.quantity + 1);
        }}
      >
        +
      </button>
    </div>
  ),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ItemList', () => {
  const now = new Date().toISOString();
  const sampleItems: InventoryItem[] = [
    {
      id: createItemId('1'),
      name: 'Item 1',
      itemType: createProductTemplateId('bottled-water'),
      categoryId: createCategoryId('water-beverages'),
      quantity: createQuantity(10),
      unit: 'liters',

      neverExpires: false,
      expirationDate: createDateOnly('2026-12-31'),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createItemId('2'),
      name: 'Item 2',
      itemType: createProductTemplateId('canned-food'),
      categoryId: createCategoryId('food'),
      quantity: createQuantity(5),
      unit: 'cans',

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
    const onItemClick = vi.fn();
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

  it('should pass onQuantityChange to ItemCards', () => {
    const onQuantityChange = vi.fn();
    render(
      <ItemList items={sampleItems} onQuantityChange={onQuantityChange} />,
    );

    const increaseBtn = screen.getByTestId('quantity-increase-1');
    fireEvent.click(increaseBtn);

    expect(onQuantityChange).toHaveBeenCalledWith(sampleItems[0], 11);
  });
});
