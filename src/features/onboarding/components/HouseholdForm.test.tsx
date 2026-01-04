import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HouseholdForm } from './HouseholdForm';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'household.title': 'Household Configuration',
        'household.adults': 'Adults',
        'household.children': 'Children',
        'household.supplyDays': 'Supply Duration (days)',
        'household.useFreezer': 'Use Freezer',
        'household.errors.adultsMin': 'At least {{min}} adult is required',
        'household.errors.adultsMax': 'Maximum {{max}} adults allowed',
        'household.errors.childrenNegative': 'Cannot be negative',
        'household.errors.childrenMax': 'Maximum {{max}} children allowed',
        'household.errors.supplyDaysMin': 'At least {{min}} day is required',
        'household.errors.supplyDaysMax': 'Maximum {{max}} days allowed',
        'actions.save': 'Save',
        'actions.cancel': 'Cancel',
      };
      let result = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          result = result.replace(`{{${paramKey}}}`, String(value));
        });
      }
      return result;
    },
  }),
}));

describe('HouseholdForm', () => {
  it('renders form fields', () => {
    const onSubmit = jest.fn();
    render(<HouseholdForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/Adults/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Children/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Supply Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Use Freezer')).toBeInTheDocument();
  });

  it('displays initial data when provided', () => {
    const onSubmit = jest.fn();
    render(
      <HouseholdForm
        onSubmit={onSubmit}
        initialData={{
          adults: 3,
          children: 2,
          supplyDays: 14,
          useFreezer: true,
        }}
      />,
    );

    expect(screen.getByLabelText(/Adults/i)).toHaveValue(3);
    expect(screen.getByLabelText(/Children/i)).toHaveValue(2);
    expect(screen.getByLabelText(/Supply Duration/i)).toHaveValue(14);
    expect(screen.getByLabelText('Use Freezer')).toBeChecked();
  });

  it('calls onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    const { container } = render(<HouseholdForm onSubmit={onSubmit} />);

    const adultsInput = screen.getByLabelText(/Adults/i);
    const childrenInput = screen.getByLabelText(/Children/i);
    const supplyDaysInput = screen.getByLabelText(/Supply Duration/i);
    const freezerCheckbox = screen.getByLabelText('Use Freezer');
    const form = container.querySelector('form');

    fireEvent.change(adultsInput, { target: { value: '2' } });
    fireEvent.change(childrenInput, { target: { value: '1' } });
    fireEvent.change(supplyDaysInput, { target: { value: '10' } });
    await user.click(freezerCheckbox);

    fireEvent.submit(form!);

    expect(onSubmit).toHaveBeenCalledWith({
      adults: 2,
      children: 1,
      supplyDays: 10,
      useFreezer: true,
    });
  });

  it('shows validation error for too many adults', () => {
    const onSubmit = jest.fn();
    const { container } = render(<HouseholdForm onSubmit={onSubmit} />);

    const adultsInput = screen.getByLabelText(/Adults/i);
    const form = container.querySelector('form');

    fireEvent.change(adultsInput, { target: { value: '25' } });
    // Submit form directly to bypass browser validation
    fireEvent.submit(form!);

    expect(screen.getByText('Maximum 20 adults allowed')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for too many children', () => {
    const onSubmit = jest.fn();
    const { container } = render(<HouseholdForm onSubmit={onSubmit} />);

    const childrenInput = screen.getByLabelText(/Children/i);
    const form = container.querySelector('form');

    fireEvent.change(childrenInput, { target: { value: '25' } });
    // already set
    fireEvent.submit(form!);

    expect(screen.getByText('Maximum 20 children allowed')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for too many supply days', () => {
    const onSubmit = jest.fn();
    const { container } = render(<HouseholdForm onSubmit={onSubmit} />);

    const supplyDaysInput = screen.getByLabelText(/Supply Duration/i);
    const form = container.querySelector('form');

    fireEvent.change(supplyDaysInput, { target: { value: '400' } });
    fireEvent.submit(form!);

    expect(screen.getByText('Maximum 365 days allowed')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears error when user corrects invalid input', () => {
    const onSubmit = jest.fn();
    const { container } = render(<HouseholdForm onSubmit={onSubmit} />);

    const adultsInput = screen.getByLabelText(/Adults/i);
    const form = container.querySelector('form');

    // Enter invalid value (too many)
    fireEvent.change(adultsInput, { target: { value: '25' } });
    fireEvent.submit(form!);

    expect(screen.getByText('Maximum 20 adults allowed')).toBeInTheDocument();

    // Correct the value
    fireEvent.change(adultsInput, { target: { value: '2' } });

    expect(
      screen.queryByText('Maximum 20 adults allowed'),
    ).not.toBeInTheDocument();
  });

  it('renders cancel button when onCancel is provided', () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    render(<HouseholdForm onSubmit={onSubmit} onCancel={onCancel} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    render(<HouseholdForm onSubmit={onSubmit} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
