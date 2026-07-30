import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DisabledRecommendations } from './DisabledRecommendations';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'settings.disabledRecommendations.empty': 'No disabled recommendations',
        'settings.disabledRecommendations.description': `You have ${options?.count || 0} disabled recommendation(s).`,
        'settings.disabledRecommendations.reactivate': 'Enable',
        'settings.disabledRecommendations.reactivateAll':
          'Enable All Recommendations',
        'bottled-water': 'Bottled Water',
        'long-life-milk': 'Long Life Milk',
        'water-beverages': 'Water & Beverages',
        food: 'Food',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the inventory hook
const mockEnableRecommendedItem = vi.fn();
const mockEnableAllRecommendedItems = vi.fn();
let mockDisabledRecommendedItems: string[] = [];

vi.mock('@/features/inventory', () => ({
  useInventory: () => ({
    disabledRecommendedItems: mockDisabledRecommendedItems,
    enableRecommendedItem: mockEnableRecommendedItem,
    enableAllRecommendedItems: mockEnableAllRecommendedItems,
  }),
}));

describe('DisabledRecommendations', () => {
  beforeEach(() => {
    mockEnableRecommendedItem.mockClear();
    mockEnableAllRecommendedItems.mockClear();
    mockDisabledRecommendedItems = ['bottled-water', 'long-life-milk'];
  });

  it('should render list of disabled items', () => {
    render(<DisabledRecommendations />);

    expect(screen.getByText(/Bottled Water/)).toBeInTheDocument();
    expect(screen.getByText(/Long Life Milk/)).toBeInTheDocument();
  });

  it('should show description with count', () => {
    render(<DisabledRecommendations />);

    expect(
      screen.getByText(/You have 2 disabled recommendation/),
    ).toBeInTheDocument();
  });

  it('should call enableRecommendedItem when clicking enable button', () => {
    render(<DisabledRecommendations />);

    const enableButtons = screen.getAllByRole('button', { name: /Enable/i });
    fireEvent.click(enableButtons[0]);

    expect(mockEnableRecommendedItem).toHaveBeenCalledTimes(1);
  });

  it('should show enable all button when multiple items are disabled', () => {
    render(<DisabledRecommendations />);

    expect(
      screen.getByRole('button', { name: 'Enable All Recommendations' }),
    ).toBeInTheDocument();
  });

  it('should call enableAllRecommendedItems when clicking enable all button', () => {
    render(<DisabledRecommendations />);

    const enableAllButton = screen.getByRole('button', {
      name: 'Enable All Recommendations',
    });
    fireEvent.click(enableAllButton);

    expect(mockEnableAllRecommendedItems).toHaveBeenCalledTimes(1);
  });
});

describe('DisabledRecommendations with no disabled items', () => {
  beforeEach(() => {
    mockDisabledRecommendedItems = [];
  });

  it('should show empty message when no items are disabled', () => {
    render(<DisabledRecommendations />);

    expect(screen.getByText('No disabled recommendations')).toBeInTheDocument();
  });

  it('should not render an enable all button', () => {
    render(<DisabledRecommendations />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
