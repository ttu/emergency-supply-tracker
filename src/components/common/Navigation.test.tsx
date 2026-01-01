import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from './Navigation';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Navigation', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    mockOnNavigate.mockClear();
  });

  it('should render all navigation items', () => {
    render(<Navigation currentPage="dashboard" onNavigate={mockOnNavigate} />);

    expect(screen.getByText('navigation.dashboard')).toBeInTheDocument();
    expect(screen.getByText('navigation.inventory')).toBeInTheDocument();
    expect(screen.getByText('navigation.settings')).toBeInTheDocument();
  });

  it('should highlight current page', () => {
    render(<Navigation currentPage="inventory" onNavigate={mockOnNavigate} />);

    const inventoryButton = screen.getByText('navigation.inventory');
    expect(inventoryButton).toHaveAttribute('aria-current', 'page');
  });

  it('should call onNavigate when clicking a nav item', () => {
    render(<Navigation currentPage="dashboard" onNavigate={mockOnNavigate} />);

    const inventoryButton = screen.getByText('navigation.inventory');
    fireEvent.click(inventoryButton);

    expect(mockOnNavigate).toHaveBeenCalledWith('inventory');
  });

  it('should call onNavigate with correct page for each button', () => {
    render(<Navigation currentPage="dashboard" onNavigate={mockOnNavigate} />);

    fireEvent.click(screen.getByText('navigation.dashboard'));
    expect(mockOnNavigate).toHaveBeenCalledWith('dashboard');

    fireEvent.click(screen.getByText('navigation.inventory'));
    expect(mockOnNavigate).toHaveBeenCalledWith('inventory');

    fireEvent.click(screen.getByText('navigation.settings'));
    expect(mockOnNavigate).toHaveBeenCalledWith('settings');
  });

  it('should not have aria-current on non-active pages', () => {
    render(<Navigation currentPage="dashboard" onNavigate={mockOnNavigate} />);

    const inventoryButton = screen.getByText('navigation.inventory');
    const settingsButton = screen.getByText('navigation.settings');

    expect(inventoryButton).not.toHaveAttribute('aria-current');
    expect(settingsButton).not.toHaveAttribute('aria-current');
  });

  it('should render help navigation item', () => {
    render(<Navigation currentPage="dashboard" onNavigate={mockOnNavigate} />);

    expect(screen.getByText('navigation.help')).toBeInTheDocument();
  });

  it('should navigate to help page when clicked', () => {
    render(<Navigation currentPage="dashboard" onNavigate={mockOnNavigate} />);

    fireEvent.click(screen.getByText('navigation.help'));
    expect(mockOnNavigate).toHaveBeenCalledWith('help');
  });

  it('should use keyboard navigation via ArrowRight', () => {
    render(<Navigation currentPage="dashboard" onNavigate={mockOnNavigate} />);

    const nav = screen.getByRole('tablist');
    fireEvent.keyDown(nav, { key: 'ArrowRight' });

    expect(mockOnNavigate).toHaveBeenCalledWith('inventory');
  });
});
