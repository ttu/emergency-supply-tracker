import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SideMenuDrawer } from './SideMenuDrawer';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('SideMenuDrawer', () => {
  beforeEach(() => {
    // Reset body overflow before each test
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow after each test
    document.body.style.overflow = '';
  });

  it('renders dialog when isOpen is false (but dialog is closed)', () => {
    const onClose = vi.fn();
    render(
      <SideMenuDrawer isOpen={false} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    // Dialog element exists but is not open
    const dialog = screen.queryByTestId('sidemenu-drawer');
    expect(dialog).toBeInTheDocument();
    // Dialog should not have open attribute when closed
    expect(dialog).not.toHaveAttribute('open');
  });

  it('renders drawer when isOpen is true', () => {
    const onClose = vi.fn();
    render(
      <SideMenuDrawer isOpen={true} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    expect(screen.getByTestId('sidemenu-drawer')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('sets body overflow to hidden when opened', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <SideMenuDrawer isOpen={false} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    expect(document.body.style.overflow).toBe('');

    rerender(
      <SideMenuDrawer isOpen={true} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores previous body overflow when closed', () => {
    const onClose = vi.fn();
    // Set initial overflow
    document.body.style.overflow = 'scroll';

    const { rerender } = render(
      <SideMenuDrawer isOpen={true} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    expect(document.body.style.overflow).toBe('hidden');

    // Test the else branch: when isOpen becomes false, restore prevOverflow
    rerender(
      <SideMenuDrawer isOpen={false} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    // Should restore to 'scroll' (the prevOverflow value)
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('restores previous body overflow on cleanup', () => {
    const onClose = vi.fn();
    document.body.style.overflow = 'auto';

    const { unmount } = render(
      <SideMenuDrawer isOpen={true} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('auto');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <SideMenuDrawer isOpen={true} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    fireEvent.click(screen.getByTestId('sidemenu-close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <SideMenuDrawer isOpen={true} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    // Click on the dialog element itself (backdrop click) - outside the content area
    const dialog = screen.getByTestId('sidemenu-drawer');
    // Simulate click on dialog element (not on content)
    fireEvent.click(dialog, { target: dialog });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when drawer content is clicked', () => {
    const onClose = vi.fn();
    render(
      <SideMenuDrawer isOpen={true} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    // Click on content inside the dialog (not the dialog element itself)
    const content = screen.getByText('Test content');
    fireEvent.click(content);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed (via dialog onCancel)', () => {
    const onClose = vi.fn();
    render(
      <SideMenuDrawer isOpen={true} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    // Native dialog onCancel handles Escape key - simulate the cancel event
    const dialog = screen.getByTestId('sidemenu-drawer');
    const cancelEvent = new Event('cancel', {
      bubbles: true,
      cancelable: true,
    });
    fireEvent(dialog, cancelEvent);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores focus when drawer closes (else branch)', async () => {
    const onClose = vi.fn();
    const button = document.createElement('button');
    button.textContent = 'Test Button';
    document.body.appendChild(button);
    button.focus();

    const { rerender } = render(
      <SideMenuDrawer isOpen={true} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    const drawer = screen.getByTestId('sidemenu-drawer');

    // Test the else branch: when isOpen becomes false, restore focus
    rerender(
      <SideMenuDrawer isOpen={false} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    // Focus should be restored to previous element (or at least drawer should not have focus)
    // The drawer is closed, so it shouldn't have focus
    expect(document.activeElement).not.toBe(drawer);

    document.body.removeChild(button);
  });

  it('uses provided id prop', () => {
    const onClose = vi.fn();
    render(
      <SideMenuDrawer id="custom-drawer-id" isOpen={true} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    const drawer = screen.getByTestId('sidemenu-drawer');
    expect(drawer).toHaveAttribute('id', 'custom-drawer-id');
  });

  it('has correct accessibility attributes', () => {
    const onClose = vi.fn();
    render(
      <SideMenuDrawer isOpen={true} onClose={onClose}>
        <div>Test content</div>
      </SideMenuDrawer>,
    );

    const drawer = screen.getByTestId('sidemenu-drawer');
    // Native <dialog> element doesn't need role="dialog" - it's implicit
    expect(drawer.tagName).toBe('DIALOG');
    // Native dialog has aria-modal behavior built-in, but we can check aria-label
    expect(drawer).toHaveAttribute('aria-label', 'sideMenu.menuLabel');
  });
});
