import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, SelectOption } from './Select';

const options: SelectOption[] = [
  { value: '', label: 'Select...', disabled: true },
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

describe('Select', () => {
  it('renders with label', () => {
    render(<Select label="Choose option" options={options} />);
    expect(screen.getByLabelText('Choose option')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select options={options} />);
    const select = screen.getByRole('combobox');
    const optionElements = Array.from(select.querySelectorAll('option'));
    expect(optionElements).toHaveLength(4);
    expect(optionElements[0]).toHaveTextContent('Select...');
    expect(optionElements[1]).toHaveTextContent('Option 1');
  });

  it('renders with required indicator', () => {
    render(<Select label="Choose option" options={options} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(
      <Select
        label="Choose option"
        options={options}
        error="This field is required"
      />,
    );
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders with helper text', () => {
    render(
      <Select
        label="Choose option"
        options={options}
        helperText="Select an option"
      />,
    );
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('does not render helper text when error is present', () => {
    render(
      <Select
        label="Choose option"
        options={options}
        error="Error message"
        helperText="Helper text"
      />,
    );
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('sets aria-invalid when error is present', () => {
    render(
      <Select label="Choose option" options={options} error="Error message" />,
    );
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('sets aria-describedby for error message', () => {
    render(
      <Select label="Choose option" options={options} error="Error message" />,
    );
    const select = screen.getByRole('combobox');
    const errorId = select.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(screen.getByText('Error message')).toHaveAttribute('id', errorId);
  });

  it('sets aria-describedby for helper text', () => {
    render(
      <Select
        label="Choose option"
        options={options}
        helperText="Helper text"
      />,
    );
    const select = screen.getByRole('combobox');
    const helperId = select.getAttribute('aria-describedby');
    expect(helperId).toBeTruthy();
    expect(screen.getByText('Helper text')).toHaveAttribute('id', helperId);
  });

  it('can be disabled', () => {
    render(<Select label="Choose option" options={options} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('handles user selection', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <Select
        label="Choose option"
        options={options}
        onChange={handleChange}
      />,
    );

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'option2');

    expect(handleChange).toHaveBeenCalled();
    expect(select).toHaveValue('option2');
  });

  it('renders disabled options', () => {
    render(<Select options={options} />);
    const select = screen.getByRole('combobox');
    const disabledOptions = Array.from(
      select.querySelectorAll('option:disabled'),
    );
    expect(disabledOptions).toHaveLength(2);
    expect(disabledOptions[0]).toHaveValue('');
    expect(disabledOptions[1]).toHaveValue('option3');
  });

  it('uses provided id', () => {
    render(<Select label="Choose option" options={options} id="custom-id" />);
    expect(screen.getByRole('combobox')).toHaveAttribute('id', 'custom-id');
  });

  it('generates unique id when not provided', () => {
    const { container } = render(
      <Select label="Choose option" options={options} />,
    );
    const select = container.querySelector('select');
    expect(select).toHaveAttribute('id');
    expect(select?.getAttribute('id')).toBeTruthy();
  });
});
