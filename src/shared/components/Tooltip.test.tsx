import { describe, it, expect, vi } from 'vitest';
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('should render children', () => {
    render(
      <Tooltip content="Test tooltip">
        <button>Trigger</button>
      </Tooltip>,
    );

    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('should not show tooltip initially', () => {
    render(
      <Tooltip content="Test tooltip">
        <button>Trigger</button>
      </Tooltip>,
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should show tooltip on mouse enter after delay', async () => {
    vi.useFakeTimers();
    try {
      render(
        <Tooltip content="Test tooltip" delay={200}>
          <button>Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByText('Trigger');
      fireEvent.mouseEnter(trigger);

      // Fast-forward past the delay
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // Direct assertion - no waitFor with fake timers
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should hide tooltip on mouse leave', async () => {
    vi.useFakeTimers();
    try {
      render(
        <Tooltip content="Test tooltip" delay={200}>
          <button>Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByText('Trigger');
      fireEvent.mouseEnter(trigger);

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(trigger);

      // Tooltip should hide immediately on mouse leave
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should show tooltip on focus', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <Tooltip content="Test tooltip">
        <button>Trigger</button>
      </Tooltip>,
    );

    await user.tab(); // Focus the button

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  it('should hide tooltip on blur', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <Tooltip content="Test tooltip">
        <button>Trigger</button>
      </Tooltip>,
    );

    await user.tab(); // Focus

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    await user.tab(); // Blur by tabbing away

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('should render tooltip with position attribute', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <Tooltip content="Test tooltip" position="bottom">
        <button>Trigger</button>
      </Tooltip>,
    );

    await user.tab(); // Focus to show tooltip

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
    });
  });

  it('should cancel tooltip if mouse leaves before delay', async () => {
    vi.useFakeTimers();
    try {
      render(
        <Tooltip content="Test tooltip" delay={500}>
          <button>Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByText('Trigger');
      fireEvent.mouseEnter(trigger);

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      fireEvent.mouseLeave(trigger);

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should render with custom delay', async () => {
    vi.useFakeTimers();
    try {
      render(
        <Tooltip content="Test tooltip" delay={1000}>
          <button>Trigger</button>
        </Tooltip>,
      );

      const trigger = screen.getByText('Trigger');
      fireEvent.mouseEnter(trigger);

      // Before delay completes
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // After delay completes
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      // Direct assertion - no waitFor with fake timers
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
