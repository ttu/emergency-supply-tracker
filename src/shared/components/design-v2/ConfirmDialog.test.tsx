import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';

const setup = (
  overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {},
) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = renderWithProviders(
    <ConfirmDialog
      open
      title="Clear everything"
      message="This cannot be undone."
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
    {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    },
  );
  return { ...view, onConfirm, onCancel };
};

describe('ConfirmDialog (v2)', () => {
  it('renders nothing while closed', () => {
    setup({ open: false });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('announces itself as a modal alert dialog', () => {
    setup();
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByText('Clear everything')).toBeInTheDocument();
    expect(
      within(dialog).getByText('This cannot be undone.'),
    ).toBeInTheDocument();
  });

  it('confirms and cancels through its own buttons', () => {
    const { onConfirm, onCancel } = setup({
      confirmLabel: 'Wipe it',
      cancelLabel: 'Back out',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Wipe it' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Back out' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels on Escape', () => {
    const { onCancel } = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels when the scrim is clicked', () => {
    const { onCancel } = setup();
    // The scrim is a real button so it is reachable by keyboard too; it is
    // labelled "dismiss" to avoid colliding with the Cancel button's name.
    fireEvent.click(screen.getByRole('button', { name: 'actions.dismiss' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('keeps Tab inside the dialog', () => {
    setup();
    const dialog = screen.getByRole('alertdialog');
    const buttons = within(dialog).getAllByRole('button');
    const last = buttons[buttons.length - 1];

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('wraps backwards on Shift+Tab', () => {
    setup();
    const dialog = screen.getByRole('alertdialog');
    const buttons = within(dialog).getAllByRole('button');

    buttons[0].focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('locks body scroll while open and restores it after', () => {
    const { unmount } = setup();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('traps tab on a link inside the message, not only on the buttons', () => {
    setup({
      message: (
        <span>
          Read the <a href="https://example.test">backup guide</a> first.
        </span>
      ),
    });
    const link = screen.getByRole('link', { name: 'backup guide' });
    const dialog = screen.getByRole('alertdialog');

    // The link is the first thing that can hold focus, so shift+tab from it
    // has to wrap to the end of the dialog rather than escaping behind it.
    link.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    const buttons = within(dialog).getAllByRole('button');
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('paints the confirm button as destructive in danger tone', () => {
    setup({ tone: 'danger', confirmLabel: 'Delete' });
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  describe('focus restoration', () => {
    // The dialog is rendered conditionally by its caller (open flips false,
    // or the caller unmounts it outright), so both paths have to hand focus
    // back rather than leaving it on a button that's gone.
    const trigger = () => {
      const button = document.createElement('button');
      button.textContent = 'Open dialog';
      document.body.appendChild(button);
      button.focus();
      return button;
    };

    it('restores focus to the triggering element once the dialog closes', () => {
      const opener = trigger();
      const { rerender, onConfirm, onCancel } = setup();
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      rerender(
        <ConfirmDialog
          open={false}
          title="Clear everything"
          message="This cannot be undone."
          onConfirm={onConfirm}
          onCancel={onCancel}
        />,
      );

      expect(document.activeElement).toBe(opener);
      opener.remove();
    });

    it('restores focus to the triggering element on unmount', () => {
      const opener = trigger();
      const { unmount } = setup();
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      unmount();

      expect(document.activeElement).toBe(opener);
      opener.remove();
    });
  });
});
