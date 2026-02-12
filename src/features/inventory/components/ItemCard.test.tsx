import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ItemCard } from './ItemCard';
import { renderWithProviders } from '@/test';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import {
  createDateOnly,
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';

// Mock i18next
vi.mock('react-i18next', async () => {
  const actual =
    await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, params?: Record<string, unknown>) => {
        if (key.includes('expiresIn') && params) {
          return `Expires in ${params.days} days`;
        }
        if (key === 'inventory.quantityMissing' && params) {
          return `${params.count} ${params.unit} missing`;
        }
        if (key === 'inventory.quantityStepper.increase') {
          return 'Increase quantity';
        }
        if (key === 'inventory.quantityStepper.decrease') {
          return 'Decrease quantity';
        }
        if (key === 'inventory.quantityStepper.edit') {
          return 'Edit quantity';
        }
        // Return unit names as-is for testing
        if (key === 'liters' || key === 'rolls' || key === 'meters') {
          return key;
        }
        return key;
      },
    }),
  };
});

describe('ItemCard', () => {
  const futureDate = createDateOnly(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  );

  const baseItem = createMockInventoryItem({
    id: createItemId('1'),
    name: 'Bottled Water',
    itemType: createProductTemplateId('bottled-water'),
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(20),
    unit: 'liters',
    neverExpires: false,
    expirationDate: futureDate,
    location: 'Pantry',
    notes: '',
  });

  it('should render item name', () => {
    renderWithProviders(<ItemCard item={baseItem} />);
    expect(screen.getByText('Bottled Water')).toBeInTheDocument();
  });

  it('should render quantity and unit', () => {
    renderWithProviders(<ItemCard item={baseItem} />);
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('liters')).toBeInTheDocument();
  });

  it('should render location if provided', () => {
    renderWithProviders(<ItemCard item={baseItem} />);
    expect(screen.getByText(/Pantry/)).toBeInTheDocument();
  });

  it('should not render location if not provided', () => {
    const itemWithoutLocation = { ...baseItem, location: '' };
    renderWithProviders(<ItemCard item={itemWithoutLocation} />);
    expect(screen.queryByText(/📍/)).not.toBeInTheDocument();
  });

  it('should show expiration warning for items expiring soon', () => {
    const soonDate = createDateOnly(
      new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    );
    const expiringItem = { ...baseItem, expirationDate: soonDate };
    renderWithProviders(<ItemCard item={expiringItem} />);
    expect(screen.getByText(/Expires in/)).toBeInTheDocument();
  });

  it('should show expired warning for expired items', () => {
    const expiredDate = createDateOnly(
      new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    );
    const expiredItem = { ...baseItem, expirationDate: expiredDate };
    renderWithProviders(<ItemCard item={expiredItem} />);
    expect(screen.getByText(/inventory.expired/)).toBeInTheDocument();
  });

  it('should not show expiration for items that never expire', () => {
    const neverExpiresItem = {
      ...baseItem,
      neverExpires: true,
      expirationDate: undefined,
    };
    renderWithProviders(<ItemCard item={neverExpiresItem} />);
    expect(screen.queryByText(/📅/)).not.toBeInTheDocument();
  });

  it('should show formatted date for items not expiring soon', () => {
    // Item with expiration more than 30 days away
    renderWithProviders(<ItemCard item={baseItem} />);
    // Should show the date rather than "expires in X days"
    expect(screen.getByText(/📅/)).toBeInTheDocument();
  });

  it('should be clickable when onItemClick is provided', () => {
    const onItemClick = vi.fn();
    renderWithProviders(<ItemCard item={baseItem} onItemClick={onItemClick} />);

    const card = screen.getByTestId('item-card-1');
    fireEvent.click(card);

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(baseItem);
  });

  it('should have button role when onItemClick is provided', () => {
    const onItemClick = vi.fn();
    renderWithProviders(<ItemCard item={baseItem} onItemClick={onItemClick} />);

    const card = screen.getByTestId('item-card-1');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('should render as div when onItemClick is not provided', () => {
    renderWithProviders(<ItemCard item={baseItem} />);
    const card = screen.getByTestId('item-card-1');
    expect(card.tagName).toBe('DIV');
  });

  it('should display capacity in mAh when provided', () => {
    const powerItem = createMockInventoryItem({
      ...baseItem,
      categoryId: createCategoryId('light-power'),
      name: 'Power Bank',
      capacityMah: 10000,
    });
    renderWithProviders(<ItemCard item={powerItem} />);
    expect(screen.getByText('10000 mAh')).toBeInTheDocument();
    expect(screen.getByText(/🔋/)).toBeInTheDocument();
  });

  it('should display capacity in Wh when provided', () => {
    const powerItem = createMockInventoryItem({
      ...baseItem,
      categoryId: createCategoryId('light-power'),
      name: 'Power Bank',
      capacityWh: 37,
    });
    renderWithProviders(<ItemCard item={powerItem} />);
    expect(screen.getByText('37 Wh')).toBeInTheDocument();
    expect(screen.getByText(/🔋/)).toBeInTheDocument();
  });

  it('should display both mAh and Wh when both are provided', () => {
    const powerItem = createMockInventoryItem({
      ...baseItem,
      categoryId: createCategoryId('light-power'),
      name: 'Power Bank',
      capacityMah: 20000,
      capacityWh: 74,
    });
    renderWithProviders(<ItemCard item={powerItem} />);
    expect(screen.getByText('20000 mAh')).toBeInTheDocument();
    expect(screen.getByText('74 Wh')).toBeInTheDocument();
    expect(screen.getByText(/🔋/)).toBeInTheDocument();
  });

  it('should not display capacity when not provided', () => {
    const itemWithoutCapacity = createMockInventoryItem({
      ...baseItem,
      categoryId: createCategoryId('light-power'),
      name: 'Flashlight',
    });
    renderWithProviders(<ItemCard item={itemWithoutCapacity} />);
    expect(screen.queryByText(/🔋/)).not.toBeInTheDocument();
  });

  it('should display item type', () => {
    renderWithProviders(<ItemCard item={baseItem} />);
    expect(screen.getByText('bottled-water')).toBeInTheDocument();
  });

  it('should display custom for custom items', () => {
    const customItem = createMockInventoryItem({
      ...baseItem,
      itemType: 'custom',
    });
    renderWithProviders(<ItemCard item={customItem} />);
    expect(screen.getByText('custom')).toBeInTheDocument();
  });

  describe('missing quantity display', () => {
    it('should show missing quantity when calculateMissingQuantity returns > 0', () => {
      // Use specific household: 1 adult, 3 days = 9L needed (3L × 1 × 3)
      // Quantity 1L < 9L needed, so should show missing
      const lowQuantityItem = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(1),
        neverExpires: true,
        expirationDate: undefined,
      });
      renderWithProviders(<ItemCard item={lowQuantityItem} />, {
        initialAppData: {
          household: {
            adults: 1,
            children: 0,
            pets: 0,
            supplyDurationDays: 3,
            useFreezer: false,
          },
        },
      });
      // Should show missing quantity (9L - 1L = 8L missing)
      expect(screen.getByText(/missing/i)).toBeInTheDocument();
    });

    it('should not show missing quantity when calculateMissingQuantity returns 0', () => {
      // Use specific household: 1 adult, 3 days = 9L needed
      // Quantity 20L >= 9L needed, so should not show missing
      const sufficientItem = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(20),
        neverExpires: true,
        expirationDate: undefined,
      });
      renderWithProviders(<ItemCard item={sufficientItem} />, {
        initialAppData: {
          household: {
            adults: 1,
            children: 0,
            pets: 0,
            supplyDurationDays: 3,
            useFreezer: false,
          },
        },
      });
      // Should NOT show missing quantity
      expect(screen.queryByText(/missing/i)).not.toBeInTheDocument();
    });

    it('should display missing quantity with correct unit translation', () => {
      // Use specific household: 1 adult, 3 days
      // Rope: baseQuantity 10m, doesn't scale with people or days = 10m needed
      // Quantity 1m < 10m needed, so should show missing
      const ropeItem = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(1),
        itemType: createProductTemplateId('rope'),
        unit: 'meters',
        neverExpires: true,
        expirationDate: undefined,
      });
      renderWithProviders(<ItemCard item={ropeItem} />, {
        initialAppData: {
          household: {
            adults: 1,
            children: 0,
            pets: 0,
            supplyDurationDays: 3,
            useFreezer: false,
          },
        },
      });
      // Should show "9 meters missing" (10 - 1 = 9)
      expect(screen.getByText(/9.*meters.*missing/i)).toBeInTheDocument();
    });
  });

  describe('quantity stepper', () => {
    it('shows edit quantity button by default', () => {
      renderWithProviders(<ItemCard item={baseItem} />);
      expect(
        screen.getByRole('button', { name: /edit quantity/i }),
      ).toBeInTheDocument();
      // Stepper buttons should not be visible initially
      expect(
        screen.queryByRole('button', { name: /increase/i }),
      ).not.toBeInTheDocument();
    });

    it('shows stepper buttons when quantity is clicked', () => {
      renderWithProviders(<ItemCard item={baseItem} />);

      // Click the quantity button to activate stepper
      fireEvent.click(screen.getByRole('button', { name: /edit quantity/i }));

      // Stepper buttons should now be visible
      expect(
        screen.getByRole('button', { name: /increase/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /decrease/i }),
      ).toBeInTheDocument();
    });

    it('calls onQuantityChange when stepper is used', () => {
      const onQuantityChange = vi.fn();
      renderWithProviders(
        <ItemCard item={baseItem} onQuantityChange={onQuantityChange} />,
      );

      // Activate stepper first
      fireEvent.click(screen.getByRole('button', { name: /edit quantity/i }));

      fireEvent.click(screen.getByRole('button', { name: /increase/i }));
      expect(onQuantityChange).toHaveBeenCalledWith(baseItem, 21);
    });

    it('does not trigger onItemClick when quantity button is clicked', () => {
      const onItemClick = vi.fn();
      renderWithProviders(
        <ItemCard item={baseItem} onItemClick={onItemClick} />,
      );

      fireEvent.click(screen.getByRole('button', { name: /edit quantity/i }));
      expect(onItemClick).not.toHaveBeenCalled();
    });

    it('does not trigger onItemClick when stepper buttons are clicked', () => {
      const onItemClick = vi.fn();
      const onQuantityChange = vi.fn();
      renderWithProviders(
        <ItemCard
          item={baseItem}
          onItemClick={onItemClick}
          onQuantityChange={onQuantityChange}
        />,
      );

      // Activate stepper first
      fireEvent.click(screen.getByRole('button', { name: /edit quantity/i }));

      fireEvent.click(screen.getByRole('button', { name: /increase/i }));
      expect(onQuantityChange).toHaveBeenCalled();
      expect(onItemClick).not.toHaveBeenCalled();
    });

    it('disables decrease button when quantity is 0', () => {
      const zeroItem = { ...baseItem, quantity: createQuantity(0) };
      renderWithProviders(<ItemCard item={zeroItem} />);

      // Activate stepper first
      fireEvent.click(screen.getByRole('button', { name: /edit quantity/i }));

      const decreaseBtn = screen.getByRole('button', { name: /decrease/i });
      expect(decreaseBtn).toBeDisabled();
    });
  });
});
