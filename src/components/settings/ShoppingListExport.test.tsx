import { render, screen, fireEvent } from '@testing-library/react';
import { ShoppingListExport } from './ShoppingListExport';
import { InventoryProvider } from '../../contexts/InventoryProvider';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(<InventoryProvider>{component}</InventoryProvider>);
};

describe('ShoppingListExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('should render shopping list export button', () => {
    renderWithProviders(<ShoppingListExport />);

    expect(
      screen.getByText('settings.shoppingList.button'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.shoppingList.description'),
    ).toBeInTheDocument();
  });

  it('should disable button when no items need restocking', () => {
    renderWithProviders(<ShoppingListExport />);

    const button = screen.getByText('settings.shoppingList.button');
    expect(button).toBeDisabled();
  });

  it('should not trigger alert when button is disabled', () => {
    renderWithProviders(<ShoppingListExport />);

    const button = screen.getByText('settings.shoppingList.button');

    // Button is disabled, so click won't trigger handler
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(global.alert).not.toHaveBeenCalled();
  });
});
