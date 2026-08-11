import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SectionHeader,
  PanelHeader,
  Caption,
  Toggle,
  ToggleRow,
  StepperRow,
  ReadField,
} from './SettingsRows';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

describe('SectionHeader (v2)', () => {
  it('renders code, title, and optional sub-text', () => {
    // SectionHeader uses the Title primitive which depends on useDesignTheme.
    renderWithProviders(
      <SectionHeader code="§1" title="APPEARANCE" sub="Tweak the look" />,
      {
        initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
      },
    );
    expect(screen.getByText('§1')).toBeInTheDocument();
    expect(screen.getByText('APPEARANCE')).toBeInTheDocument();
    expect(screen.getByText('Tweak the look')).toBeInTheDocument();
  });
});

describe('PanelHeader (v2)', () => {
  it('wraps its children inside a Caption', () => {
    render(<PanelHeader>HEADER</PanelHeader>);
    expect(screen.getByText('HEADER')).toBeInTheDocument();
  });
});

describe('Caption (v2)', () => {
  it('renders its children', () => {
    render(<Caption>CAP</Caption>);
    expect(screen.getByText('CAP')).toBeInTheDocument();
  });
});

describe('Toggle (v2)', () => {
  it('reflects on state via aria-checked', () => {
    render(<Toggle on={true} onChange={vi.fn()} ariaLabel="Mute" />);
    expect(screen.getByRole('switch', { name: 'Mute' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('invokes onChange with the inverted value when clicked', () => {
    const onChange = vi.fn();
    render(<Toggle on={false} onChange={onChange} ariaLabel="Mute" />);
    fireEvent.click(screen.getByRole('switch', { name: 'Mute' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('ToggleRow (v2)', () => {
  it('renders label and hint, and toggles via the switch', () => {
    const onChange = vi.fn();
    render(
      <ToggleRow
        label="Notifications"
        hint="Email me"
        on={false}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Email me')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Notifications' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('StepperRow (v2)', () => {
  it('renders the formatted value with optional suffix', () => {
    render(
      <StepperRow label="Adults" value={3} onChange={vi.fn()} suffix="ppl" />,
    );
    expect(screen.getByText('Adults')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('ppl')).toBeInTheDocument();
  });

  it('clamps decrement at min and disables the − button', () => {
    const onChange = vi.fn();
    render(<StepperRow label="Adults" value={1} min={1} onChange={onChange} />);
    const dec = screen.getByRole('button', {
      name: 'v2.settings.stepperDecreaseAria',
    });
    expect(dec).toBeDisabled();
    fireEvent.click(dec);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('+ button increments by step', () => {
    const onChange = vi.fn();
    render(<StepperRow label="Days" value={5} step={2} onChange={onChange} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.settings.stepperIncreaseAria' }),
    );
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('formats fractional values with decimals option', () => {
    render(
      <StepperRow
        label="Water"
        value={1.5}
        decimals={1}
        onChange={vi.fn()}
        suffix="L"
      />,
    );
    expect(screen.getByText('1.5')).toBeInTheDocument();
  });

  it('clamps an increment that would overshoot max, rather than passing the raw sum', () => {
    // The + button is still enabled here (9 < 10), so the click goes
    // through — clamping has to happen in the handler, not just the
    // disabled check.
    const onChange = vi.fn();
    render(
      <StepperRow
        label="Days"
        value={9}
        step={5}
        max={10}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.settings.stepperIncreaseAria' }),
    );
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('clamps a decrement that would undershoot min, rather than passing the raw difference', () => {
    // The − button is still enabled here (2 > 1).
    const onChange = vi.fn();
    render(
      <StepperRow
        label="Days"
        value={2}
        step={5}
        min={1}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.settings.stepperDecreaseAria' }),
    );
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

describe('ReadField (v2)', () => {
  it('renders label, value, and a static hint when no action provided', () => {
    render(<ReadField label="Location" value="Browser" hint="LOCAL" />);
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Browser')).toBeInTheDocument();
    expect(screen.getByText('LOCAL')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders hint as a button and invokes onAction when provided', () => {
    const onAction = vi.fn();
    render(
      <ReadField
        label="Last sync"
        value="—"
        hint="REFRESH"
        onAction={onAction}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'REFRESH' }));
    expect(onAction).toHaveBeenCalled();
  });
});
