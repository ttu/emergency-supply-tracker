import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HouseholdForm } from './HouseholdForm';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'household.title': 'Household Configuration',
        'household.adults': 'Adults',
        'household.children': 'Children',
        'household.supplyDays': 'Supply Duration (days)',
        'household.hasFreezer': 'Has Freezer',
        'actions.save': 'Save',
        'actions.cancel': 'Cancel',
      };
      return translations[key] || key;
    },
  }),
}));

describe('HouseholdForm', () => {
  it('renders form fields', () => {
    const onSubmit = jest.fn();
    render(<HouseholdForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText('Adults')).toBeInTheDocument();
    expect(screen.getByLabelText('Children')).toBeInTheDocument();
    expect(screen.getByLabelText('Supply Duration (days)')).toBeInTheDocument();
    expect(screen.getByLabelText('Has Freezer')).toBeInTheDocument();
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
          hasFreezer: true,
        }}
      />,
    );

    expect(screen.getByLabelText('Adults')).toHaveValue(3);
    expect(screen.getByLabelText('Children')).toHaveValue(2);
    expect(screen.getByLabelText('Supply Duration (days)')).toHaveValue(14);
    expect(screen.getByLabelText('Has Freezer')).toBeChecked();
  });

  it('calls onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<HouseholdForm onSubmit={onSubmit} />);

    const adultsInput = screen.getByLabelText('Adults');
    const childrenInput = screen.getByLabelText('Children');
    const supplyDaysInput = screen.getByLabelText('Supply Duration (days)');
    const freezerCheckbox = screen.getByLabelText('Has Freezer');
    const submitButton = screen.getByRole('button', { name: 'Save' });

    await user.clear(adultsInput);
    await user.type(adultsInput, '2');
    await user.clear(childrenInput);
    await user.type(childrenInput, '1');
    await user.clear(supplyDaysInput);
    await user.type(supplyDaysInput, '10');
    await user.click(freezerCheckbox);

    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({
      adults: 2,
      children: 1,
      supplyDays: 10,
      hasFreezer: true,
    });
  });

  it('shows validation error for invalid adults', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<HouseholdForm onSubmit={onSubmit} />);

    const adultsInput = screen.getByLabelText('Adults');
    const submitButton = screen.getByRole('button', { name: 'Save' });

    await user.clear(adultsInput);
    await user.type(adultsInput, '0');
    await user.click(submitButton);

    expect(
      screen.getByText('At least 1 adult is required'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for too many children', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<HouseholdForm onSubmit={onSubmit} />);

    const childrenInput = screen.getByLabelText('Children');
    const submitButton = screen.getByRole('button', { name: 'Save' });

    await user.clear(childrenInput);
    await user.type(childrenInput, '25');
    await user.click(submitButton);

    expect(screen.getByText('Maximum 20 children allowed')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid supply days', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<HouseholdForm onSubmit={onSubmit} />);

    const supplyDaysInput = screen.getByLabelText('Supply Duration (days)');
    const submitButton = screen.getByRole('button', { name: 'Save' });

    await user.clear(supplyDaysInput);
    await user.type(supplyDaysInput, '0');
    await user.click(submitButton);

    expect(screen.getByText('At least 1 day is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears error when user corrects invalid input', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<HouseholdForm onSubmit={onSubmit} />);

    const adultsInput = screen.getByLabelText('Adults');
    const submitButton = screen.getByRole('button', { name: 'Save' });

    // Enter invalid value
    await user.clear(adultsInput);
    await user.type(adultsInput, '0');
    await user.click(submitButton);

    expect(
      screen.getByText('At least 1 adult is required'),
    ).toBeInTheDocument();

    // Correct the value
    await user.clear(adultsInput);
    await user.type(adultsInput, '2');

    expect(
      screen.queryByText('At least 1 adult is required'),
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
