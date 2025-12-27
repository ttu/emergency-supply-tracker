import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HouseholdForm } from './HouseholdForm';
import { HouseholdProvider } from '../../contexts/HouseholdProvider';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(<HouseholdProvider>{component}</HouseholdProvider>);
};

describe('HouseholdForm', () => {
  it('should render household form fields', () => {
    renderWithProviders(<HouseholdForm />);

    expect(
      screen.getByLabelText('settings.household.adults'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('settings.household.children'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('settings.household.supplyDays'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('settings.household.hasFreezer'),
    ).toBeInTheDocument();
  });

  it('should render preset buttons', () => {
    renderWithProviders(<HouseholdForm />);

    expect(
      screen.getByText('settings.household.presets.single'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.household.presets.couple'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.household.presets.family'),
    ).toBeInTheDocument();
  });

  it('should show default values', () => {
    renderWithProviders(<HouseholdForm />);

    const adultsInput = screen.getByLabelText(
      'settings.household.adults',
    ) as HTMLInputElement;
    const childrenInput = screen.getByLabelText(
      'settings.household.children',
    ) as HTMLInputElement;
    const supplyDaysInput = screen.getByLabelText(
      'settings.household.supplyDays',
    ) as HTMLInputElement;

    expect(adultsInput.value).toBe('2');
    expect(childrenInput.value).toBe('3');
    expect(supplyDaysInput.value).toBe('3');
  });

  it('should update adults value', () => {
    renderWithProviders(<HouseholdForm />);

    const adultsInput = screen.getByLabelText(
      'settings.household.adults',
    ) as HTMLInputElement;
    fireEvent.change(adultsInput, { target: { value: '3' } });

    // Value is updated through context provider
    expect(adultsInput.value).toBe('3');
  });

  it('should show freezer hold time when freezer is checked', async () => {
    renderWithProviders(<HouseholdForm />);

    const freezerCheckbox = screen.getByLabelText(
      'settings.household.hasFreezer',
    ) as HTMLInputElement;

    // Checkbox starts unchecked by default
    expect(
      screen.queryByLabelText('settings.household.freezerHoldTime'),
    ).not.toBeInTheDocument();

    fireEvent.click(freezerCheckbox);

    await waitFor(() => {
      expect(
        screen.getByLabelText('settings.household.freezerHoldTime'),
      ).toBeInTheDocument();
    });
  });

  it('should toggle freezer checkbox', () => {
    renderWithProviders(<HouseholdForm />);

    const freezerCheckbox = screen.getByLabelText(
      'settings.household.hasFreezer',
    ) as HTMLInputElement;

    // Initial state
    const initialState = freezerCheckbox.checked;

    // Toggle it
    fireEvent.click(freezerCheckbox);
    expect(freezerCheckbox.checked).toBe(!initialState);

    // Toggle back
    fireEvent.click(freezerCheckbox);
    expect(freezerCheckbox.checked).toBe(initialState);
  });
});
