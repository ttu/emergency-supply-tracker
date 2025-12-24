import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('renders without title', () => {
    render(
      <Modal isOpen={true} onClose={onClose}>
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    const closeButton = screen.getByLabelText('Close modal');
    await user.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    const overlay = container.querySelector('[class*="overlay"]');
    if (overlay) {
      await user.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    await user.click(screen.getByText('Modal content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets correct ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('does not set aria-labelledby when no title is provided', () => {
    render(
      <Modal isOpen={true} onClose={onClose}>
        <p>Modal content</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveAttribute('aria-labelledby');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={onClose} size="small">
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={onClose} size="medium">
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={onClose} size="large">
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('disables body scroll when open', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={onClose}>
        <p>Modal content</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={onClose}>
        <p>Modal content</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('renders using portal', () => {
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    const modal = screen.getByRole('dialog');
    expect(modal.parentElement?.parentElement).toBe(document.body);
  });
});
