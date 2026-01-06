import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemCard } from './ItemCard';
import { createMockInventoryItem } from '@/shared/utils/test/factories';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key.includes('expiresIn') && params) {
        return `Expires in ${params.days} days`;
      }
      return key;
    },
  }),
}));

describe('ItemCard', () => {
  const futureDate = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const baseItem = createMockInventoryItem({
    id: '1',
    name: 'Bottled Water',
    itemType: 'bottled-water',
    categoryId: 'water-beverages',
    quantity: 20,
    unit: 'liters',
    recommendedQuantity: 28,
    neverExpires: false,
    expirationDate: futureDate,
    location: 'Pantry',
    notes: '',
  });

  it('should render item name', () => {
    render(<ItemCard item={baseItem} />);
    expect(screen.getByText('Bottled Water')).toBeInTheDocument();
  });

  it('should render quantity and unit', () => {
    render(<ItemCard item={baseItem} />);
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('liters')).toBeInTheDocument();
  });

  it('should render location if provided', () => {
    render(<ItemCard item={baseItem} />);
    expect(screen.getByText(/Pantry/)).toBeInTheDocument();
  });

  it('should not render location if not provided', () => {
    const itemWithoutLocation = { ...baseItem, location: '' };
    render(<ItemCard item={itemWithoutLocation} />);
    expect(screen.queryByText(/📍/)).not.toBeInTheDocument();
  });

  it('should show expiration warning for items expiring soon', () => {
    const soonDate = new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const expiringItem = { ...baseItem, expirationDate: soonDate };
    render(<ItemCard item={expiringItem} />);
    expect(screen.getByText(/Expires in/)).toBeInTheDocument();
  });

  it('should show expired warning for expired items', () => {
    const expiredDate = new Date(
      Date.now() - 10 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const expiredItem = { ...baseItem, expirationDate: expiredDate };
    render(<ItemCard item={expiredItem} />);
    expect(screen.getByText(/inventory.expired/)).toBeInTheDocument();
  });

  it('should not show expiration for items that never expire', () => {
    const neverExpiresItem = {
      ...baseItem,
      neverExpires: true,
      expirationDate: undefined,
    };
    render(<ItemCard item={neverExpiresItem} />);
    expect(screen.queryByText(/📅/)).not.toBeInTheDocument();
  });

  it('should show formatted date for items not expiring soon', () => {
    // Item with expiration more than 30 days away
    render(<ItemCard item={baseItem} />);
    // Should show the date rather than "expires in X days"
    expect(screen.getByText(/📅/)).toBeInTheDocument();
  });

  it('should be clickable when onClick is provided', () => {
    const onClick = vi.fn();
    const { container } = render(
      <ItemCard item={baseItem} onClick={onClick} />,
    );

    const card = container.firstChild as HTMLElement;
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard events when clickable', () => {
    const onClick = vi.fn();
    const { container } = render(
      <ItemCard item={baseItem} onClick={onClick} />,
    );

    const card = container.firstChild as HTMLElement;
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('should not be interactive when onClick is not provided', () => {
    const { container } = render(<ItemCard item={baseItem} />);
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveAttribute('role', 'button');
    expect(card).not.toHaveAttribute('tabIndex');
  });

  it('should display capacity in mAh when provided', () => {
    const powerItem = createMockInventoryItem({
      ...baseItem,
      categoryId: 'light-power',
      name: 'Power Bank',
      capacityMah: 10000,
    });
    render(<ItemCard item={powerItem} />);
    expect(screen.getByText('10000 mAh')).toBeInTheDocument();
    expect(screen.getByText(/🔋/)).toBeInTheDocument();
  });

  it('should display capacity in Wh when provided', () => {
    const powerItem = createMockInventoryItem({
      ...baseItem,
      categoryId: 'light-power',
      name: 'Power Bank',
      capacityWh: 37,
    });
    render(<ItemCard item={powerItem} />);
    expect(screen.getByText('37 Wh')).toBeInTheDocument();
    expect(screen.getByText(/🔋/)).toBeInTheDocument();
  });

  it('should display both mAh and Wh when both are provided', () => {
    const powerItem = createMockInventoryItem({
      ...baseItem,
      categoryId: 'light-power',
      name: 'Power Bank',
      capacityMah: 20000,
      capacityWh: 74,
    });
    render(<ItemCard item={powerItem} />);
    expect(screen.getByText('20000 mAh')).toBeInTheDocument();
    expect(screen.getByText('74 Wh')).toBeInTheDocument();
    expect(screen.getByText(/🔋/)).toBeInTheDocument();
  });

  it('should not display capacity when not provided', () => {
    const itemWithoutCapacity = createMockInventoryItem({
      ...baseItem,
      categoryId: 'light-power',
      name: 'Flashlight',
    });
    render(<ItemCard item={itemWithoutCapacity} />);
    expect(screen.queryByText(/🔋/)).not.toBeInTheDocument();
  });

  it('should display recommended quantity when provided', () => {
    render(<ItemCard item={baseItem} />);
    expect(screen.getByText(/\/ 28/)).toBeInTheDocument();
  });

  it('should not display recommended quantity when zero', () => {
    const itemWithoutRecommended = {
      ...baseItem,
      recommendedQuantity: 0,
    };
    render(<ItemCard item={itemWithoutRecommended} />);
    expect(screen.queryByText(/\/ 0/)).not.toBeInTheDocument();
  });
});
