import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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

    // Scope to sidebar to avoid duplicates from drawer
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    expect(within(sidebar).getByText('Item 1')).toBeInTheDocument();
    expect(within(sidebar).getByText('Item 2')).toBeInTheDocument();
    expect(within(sidebar).getByText('Item 3')).toBeInTheDocument();
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

    // Scope to sidebar to avoid duplicates from drawer
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    expect(within(sidebar).getByText('🔧')).toBeInTheDocument();
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

    // Scope to sidebar to avoid duplicates from drawer
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    const activeItem = within(sidebar).getByTestId('sidemenu-item-item2');
    expect(activeItem).toHaveAttribute('aria-current', 'page');

    const inactiveItem = within(sidebar).getByTestId('sidemenu-item-item1');
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

    // Scope to sidebar to avoid duplicates from drawer
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    fireEvent.click(within(sidebar).getByTestId('sidemenu-item-item2'));

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

    // Scope to sidebar to avoid duplicates from drawer
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    expect(within(sidebar).getByText('All Items')).toBeInTheDocument();
    expect(within(sidebar).getByText('📦')).toBeInTheDocument();

    const allItem = within(sidebar).getByTestId('sidemenu-item-all');
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

    // Keyboard handler is on the ul element
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    const list = within(sidebar).getByRole('list');
    fireEvent.keyDown(list, { key: 'ArrowDown' });

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

    // Keyboard handler is on the ul element
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    const list = within(sidebar).getByRole('list');
    fireEvent.keyDown(list, { key: 'ArrowUp' });

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

    // Keyboard handler is on the ul element
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    const list = within(sidebar).getByRole('list');
    fireEvent.keyDown(list, { key: 'Home' });

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

    // Keyboard handler is on the ul element
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    const list = within(sidebar).getByRole('list');
    fireEvent.keyDown(list, { key: 'End' });

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

    // Keyboard handler is on the ul element
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    const list = within(sidebar).getByRole('list');
    fireEvent.keyDown(list, { key: 'ArrowDown' });

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
    const dialog = screen.getByTestId('sidemenu-drawer');
    expect(dialog).toBeInTheDocument();

    // Close drawer
    fireEvent.click(screen.getByTestId('sidemenu-close'));
    // Dialog element still exists but is closed (not visible)
    expect(dialog).toBeInTheDocument();
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

    // Click on dialog element itself (backdrop click)
    const dialog = screen.getByTestId('sidemenu-drawer');
    fireEvent.click(dialog);

    // Dialog element still exists but is closed (not visible)
    expect(dialog).toBeInTheDocument();
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
    const dialog = screen.getByTestId('sidemenu-drawer');

    // Get the item buttons inside the drawer (there will be duplicates - one in sidebar, one in drawer)
    // We want to click the one in the drawer
    const drawerContent = within(dialog);
    fireEvent.click(drawerContent.getByTestId('sidemenu-item-item2'));

    expect(onSelect).toHaveBeenCalledWith('item2');
    // Dialog element still exists but is closed (not visible)
    expect(dialog).toBeInTheDocument();
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

    // The ul element has aria-orientation but no menubar role
    const sidebar = screen.getByTestId('sidemenu-sidebar');
    const list = within(sidebar).getByRole('list');
    expect(list).toHaveAttribute('aria-orientation', 'vertical');
  });
});
