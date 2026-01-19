import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SideMenu, SideMenuItem } from './SideMenu';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockItems: SideMenuItem[] = [
  { id: 'item1', label: 'Item 1' },
  { id: 'item2', label: 'Item 2', icon: '🔧' },
  { id: 'item3', label: 'Item 3' },
];

describe('SideMenu', () => {
  it('renders all menu items', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item1"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('renders icons when provided', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item1"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    expect(screen.getByText('🔧')).toBeInTheDocument();
  });

  it('highlights the active item with aria-current', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item2"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    const activeItem = screen.getByTestId('sidemenu-item-item2');
    expect(activeItem).toHaveAttribute('aria-current', 'page');

    const inactiveItem = screen.getByTestId('sidemenu-item-item1');
    expect(inactiveItem).not.toHaveAttribute('aria-current');
  });

  it('calls onSelect when an item is clicked', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item1"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    fireEvent.click(screen.getByTestId('sidemenu-item-item2'));

    expect(onSelect).toHaveBeenCalledWith('item2');
  });

  it('renders showAllOption when provided', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="all"
        onSelect={onSelect}
        ariaLabel="Test Menu"
        showAllOption={{ id: 'all', label: 'All Items', icon: '📦' }}
      />,
    );

    expect(screen.getByText('All Items')).toBeInTheDocument();
    expect(screen.getByText('📦')).toBeInTheDocument();

    const allItem = screen.getByTestId('sidemenu-item-all');
    expect(allItem).toHaveAttribute('aria-current', 'page');
  });

  it('handles keyboard navigation with ArrowDown', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item1"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    const menu = screen.getByRole('navigation');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });

    expect(onSelect).toHaveBeenCalledWith('item2');
  });

  it('handles keyboard navigation with ArrowUp', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item2"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    const menu = screen.getByRole('navigation');
    fireEvent.keyDown(menu, { key: 'ArrowUp' });

    expect(onSelect).toHaveBeenCalledWith('item1');
  });

  it('handles keyboard navigation with Home key', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item3"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    const menu = screen.getByRole('navigation');
    fireEvent.keyDown(menu, { key: 'Home' });

    expect(onSelect).toHaveBeenCalledWith('item1');
  });

  it('handles keyboard navigation with End key', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item1"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    const menu = screen.getByRole('navigation');
    fireEvent.keyDown(menu, { key: 'End' });

    expect(onSelect).toHaveBeenCalledWith('item3');
  });

  it('loops navigation with ArrowDown at the end', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item3"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    const menu = screen.getByRole('navigation');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });

    expect(onSelect).toHaveBeenCalledWith('item1');
  });

  it('renders hamburger button for mobile', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item1"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    expect(screen.getByTestId('sidemenu-hamburger')).toBeInTheDocument();
  });

  it('opens drawer when hamburger button is clicked', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item1"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    const hamburger = screen.getByTestId('sidemenu-hamburger');
    fireEvent.click(hamburger);

    expect(screen.getByTestId('sidemenu-drawer')).toBeInTheDocument();
  });

  it('closes drawer when close button is clicked', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item1"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    // Open drawer
    fireEvent.click(screen.getByTestId('sidemenu-hamburger'));
    expect(screen.getByTestId('sidemenu-drawer')).toBeInTheDocument();

    // Close drawer
    fireEvent.click(screen.getByTestId('sidemenu-close'));
    expect(screen.queryByTestId('sidemenu-drawer')).not.toBeInTheDocument();
  });

  it('closes drawer when backdrop is clicked', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item1"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    // Open drawer
    fireEvent.click(screen.getByTestId('sidemenu-hamburger'));

    // Click backdrop
    fireEvent.mouseDown(screen.getByTestId('sidemenu-drawer-overlay'));

    expect(screen.queryByTestId('sidemenu-drawer')).not.toBeInTheDocument();
  });

  it('closes drawer when item is selected', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item1"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    // Open drawer
    fireEvent.click(screen.getByTestId('sidemenu-hamburger'));

    // Get the item buttons inside the drawer (there will be duplicates - one in sidebar, one in drawer)
    // We want to click the one in the drawer
    const allItem2Buttons = screen.getAllByText('Item 2');
    fireEvent.click(allItem2Buttons[allItem2Buttons.length - 1]);

    expect(onSelect).toHaveBeenCalledWith('item2');
    expect(screen.queryByTestId('sidemenu-drawer')).not.toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    const onSelect = vi.fn();
    render(
      <SideMenu
        items={mockItems}
        selectedId="item1"
        onSelect={onSelect}
        ariaLabel="Test Menu"
      />,
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Test Menu');

    const menubar = screen.getByRole('menubar');
    expect(menubar).toHaveAttribute('aria-orientation', 'vertical');
  });
});
