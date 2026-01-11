/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationItem } from './NotificationItem';

describe('NotificationItem', () => {
  // Ensure timers are always restored after each test to avoid leaks
  afterEach(() => {
    vi.useRealTimers();
  });
  it('renders notification with message', () => {
    const onClose = vi.fn();
    render(<NotificationItem message="Test message" onClose={onClose} />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders success variant with correct icon', () => {
    const onClose = vi.fn();
    render(
      <NotificationItem
        message="Success message"
        variant="success"
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Success message')).toBeInTheDocument();
    const icon = screen.getByText('✓');
    expect(icon).toBeInTheDocument();
  });

  it('renders error variant with correct icon', () => {
    const onClose = vi.fn();
    render(
      <NotificationItem
        message="Error message"
        variant="error"
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Error message')).toBeInTheDocument();
    const icon = screen.getByText('✕');
    expect(icon).toBeInTheDocument();
  });

  it('renders info variant with correct icon', () => {
    const onClose = vi.fn();
    render(
      <NotificationItem
        message="Info message"
        variant="info"
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Info message')).toBeInTheDocument();
    const icon = screen.getByText('ℹ');
    expect(icon).toBeInTheDocument();
  });

  it('defaults to success variant when variant is not provided', () => {
    const onClose = vi.fn();
    render(<NotificationItem message="Default message" onClose={onClose} />);

    const icon = screen.getByText('✓');
    expect(icon).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<NotificationItem message="Test message" onClose={onClose} />);

    // Query by accessible name (works with both translation key and fallback text)
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after duration', async () => {
    vi.useFakeTimers();
    try {
      const onClose = vi.fn();
      render(
        <NotificationItem
          message="Test message"
          duration={1000}
          onClose={onClose}
        />,
      );

      expect(screen.getByText('Test message')).toBeInTheDocument();

      vi.advanceTimersByTime(1000);

      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not auto-dismiss when duration is 0', () => {
    vi.useFakeTimers();
    try {
      const onClose = vi.fn();
      render(
        <NotificationItem
          message="Test message"
          duration={0}
          onClose={onClose}
        />,
      );

      expect(screen.getByText('Test message')).toBeInTheDocument();

      vi.advanceTimersByTime(5000);

      expect(onClose).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('cleans up timeout on unmount', () => {
    vi.useFakeTimers();
    try {
      const onClose = vi.fn();
      const { unmount } = render(
        <NotificationItem
          message="Test message"
          duration={1000}
          onClose={onClose}
        />,
      );

      unmount();

      vi.advanceTimersByTime(1000);

      expect(onClose).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('has proper accessibility attributes', () => {
    const onClose = vi.fn();
    render(<NotificationItem message="Test message" onClose={onClose} />);

    // div with role="status" for live region announcements
    const notification = screen.getByRole('status');
    expect(notification).toHaveAttribute('aria-live', 'polite');
    expect(notification).toHaveAttribute('aria-atomic', 'true');
  });
});
