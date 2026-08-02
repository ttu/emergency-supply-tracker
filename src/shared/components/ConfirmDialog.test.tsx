import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const setup = (
  overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {},
) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <ConfirmDialog
      isOpen
      title="Clear everything"
      message="This cannot be undone."
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { ...view, onConfirm, onCancel };
};

const dialogButtons = () => {
  const dialog = screen.getByRole('alertdialog');
  return within(dialog).getAllByRole('button');
};

describe('ConfirmDialog', () => {
  it('renders nothing while closed', () => {
    setup({ isOpen: false });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows its title and message when open', () => {
    setup();
    expect(screen.getByText('Clear everything')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('confirms when the confirm button is pressed', () => {
    const { onConfirm } = setup({ confirmLabel: 'Wipe it' });
    fireEvent.click(screen.getByRole('button', { name: 'Wipe it' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not confirm while loading', () => {
    const { onConfirm } = setup({ confirmLabel: 'Wipe it', isLoading: true });
    fireEvent.click(screen.getByRole('button', { name: /Wipe it|loading/i }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels on Escape', () => {
    const { onCancel } = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape once closed', () => {
    const { onCancel } = setup({ isOpen: false });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('keeps Tab inside the dialog', () => {
    setup();
    const buttons = dialogButtons();
    const last = buttons[buttons.length - 1];

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('wraps backwards on Shift+Tab', () => {
    setup();
    const buttons = dialogButtons();

    buttons[0].focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('leaves focus alone for Tab in the middle of the dialog', () => {
    setup();
    const buttons = dialogButtons();
    if (buttons.length > 2) {
      buttons[1].focus();
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(buttons[1]);
    }
  });

  it('locks body scroll while open and restores it after', () => {
    const { unmount } = setup();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
