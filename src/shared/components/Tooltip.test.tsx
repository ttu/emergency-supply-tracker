import { render, screen, waitFor, act } from '@testing-library/react';
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
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(
      <Tooltip content="Test tooltip" delay={200}>
        <button>Trigger</button>
      </Tooltip>,
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    // Fast-forward past the delay
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('should hide tooltip on mouse leave', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(
      <Tooltip content="Test tooltip" delay={200}>
        <button>Trigger</button>
      </Tooltip>,
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    await user.unhover(trigger);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
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
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(
      <Tooltip content="Test tooltip" delay={500}>
        <button>Trigger</button>
      </Tooltip>,
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    await user.unhover(trigger);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should render with custom delay', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(
      <Tooltip content="Test tooltip" delay={1000}>
        <button>Trigger</button>
      </Tooltip>,
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    // Before delay completes
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // After delay completes
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
