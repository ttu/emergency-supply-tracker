import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuantityStepper } from './QuantityStepper';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'inventory.quantityStepper.increase': 'Increase quantity',
        'inventory.quantityStepper.decrease': 'Decrease quantity',
        pieces: 'pieces',
        liters: 'liters',
        kg: 'kg',
      };
      return translations[key] || key;
    },
  }),
}));

describe('QuantityStepper', () => {
  it('renders quantity and unit', () => {
    render(<QuantityStepper quantity={5} unit="pieces" onChange={vi.fn()} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('pieces')).toBeInTheDocument();
  });

  it('renders increase and decrease buttons', () => {
    render(<QuantityStepper quantity={5} unit="pieces" onChange={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Increase quantity' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Decrease quantity' }),
    ).toBeInTheDocument();
  });

  it('calls onChange with incremented value when plus is clicked', () => {
    const onChange = vi.fn();
    render(<QuantityStepper quantity={5} unit="pieces" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('calls onChange with decremented value when minus is clicked', () => {
    const onChange = vi.fn();
    render(<QuantityStepper quantity={5} unit="pieces" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('disables decrease button when quantity is at min (default 0)', () => {
    const onChange = vi.fn();
    render(<QuantityStepper quantity={0} unit="pieces" onChange={onChange} />);

    const decreaseBtn = screen.getByRole('button', {
      name: 'Decrease quantity',
    });
    expect(decreaseBtn).toBeDisabled();
    expect(decreaseBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not call onChange when decrease is clicked at min', () => {
    const onChange = vi.fn();
    render(<QuantityStepper quantity={0} unit="pieces" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('respects custom min value', () => {
    const onChange = vi.fn();
    render(
      <QuantityStepper
        quantity={1}
        unit="pieces"
        onChange={onChange}
        min={1}
      />,
    );

    const decreaseBtn = screen.getByRole('button', {
      name: 'Decrease quantity',
    });
    expect(decreaseBtn).toBeDisabled();
  });

  it('disables both buttons when disabled prop is true', () => {
    render(
      <QuantityStepper
        quantity={5}
        unit="pieces"
        onChange={vi.fn()}
        disabled
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Increase quantity' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Decrease quantity' }),
    ).toBeDisabled();
  });

  it('stops event propagation on button clicks', () => {
    const onChange = vi.fn();
    const parentClick = vi.fn();

    render(
      <button type="button" onClick={parentClick}>
        <QuantityStepper quantity={5} unit="pieces" onChange={onChange} />
      </button>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(onChange).toHaveBeenCalled();
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('shows pulse animation class when showPulse is true', () => {
    const { container } = render(
      <QuantityStepper
        quantity={5}
        unit="pieces"
        onChange={vi.fn()}
        showPulse
      />,
    );

    const stepper = container.firstChild as HTMLElement;
    expect(stepper.className).toContain('pulse');
  });

  it('renders decimal quantities correctly', () => {
    render(
      <QuantityStepper quantity={2.5} unit="kilograms" onChange={vi.fn()} />,
    );
    expect(screen.getByText('2.5')).toBeInTheDocument();
  });
});
