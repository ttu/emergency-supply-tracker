import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders without label', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Item Name" />);
    expect(screen.getByLabelText(/item name/i)).toBeInTheDocument();
  });

  it('shows required asterisk when required', () => {
    render(<Input label="Item Name" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders helper text', () => {
    render(<Input label="Item Name" helperText="Enter a name" />);
    expect(screen.getByText(/enter a name/i)).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Input label="Item Name" error="Name is required" />);
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });

  it('hides helper text when error is shown', () => {
    render(
      <Input
        label="Item Name"
        helperText="Enter a name"
        error="Name is required"
      />,
    );
    expect(screen.queryByText(/enter a name/i)).not.toBeInTheDocument();
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Input label="Item Name" disabled />);
    expect(screen.getByLabelText(/item name/i)).toBeDisabled();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input label="Item Name" />);

    const input = screen.getByLabelText(/item name/i);
    await user.type(input, 'Bottled Water');

    expect(input).toHaveValue('Bottled Water');
  });

  it('supports number input', () => {
    render(<Input type="number" label="Quantity" />);
    const input = screen.getByLabelText(/quantity/i);
    expect(input).toHaveAttribute('type', 'number');
  });

  it('supports date input', () => {
    render(<Input type="date" label="Expiration Date" />);
    const input = screen.getByLabelText(/expiration date/i);
    expect(input).toHaveAttribute('type', 'date');
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input label="Item Name" error="Name is required" />);
    const input = screen.getByLabelText(/item name/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('links error message with aria-describedby', () => {
    render(<Input label="Item Name" error="Name is required" />);
    const input = screen.getByLabelText(/item name/i);
    const errorId = input.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(screen.getByText(/name is required/i)).toHaveAttribute(
      'id',
      errorId,
    );
  });
});
