import { screen, fireEvent, waitFor } from '@testing-library/react';
import { HouseholdForm } from './HouseholdForm';
import { renderWithHousehold } from '@/test';

describe('HouseholdForm', () => {
  it('should render household form fields', () => {
    renderWithHousehold(<HouseholdForm />);

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
      screen.getByLabelText('settings.household.useFreezer'),
    ).toBeInTheDocument();
  });

  it('should render preset buttons', () => {
    renderWithHousehold(<HouseholdForm />);

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
    renderWithHousehold(<HouseholdForm />);

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
    renderWithHousehold(<HouseholdForm />);

    const adultsInput = screen.getByLabelText(
      'settings.household.adults',
    ) as HTMLInputElement;
    fireEvent.change(adultsInput, { target: { value: '3' } });

    // Value is updated through context provider
    expect(adultsInput.value).toBe('3');
  });

  it('should show freezer hold time when freezer is checked', async () => {
    renderWithHousehold(<HouseholdForm />);

    const freezerCheckbox = screen.getByLabelText(
      'settings.household.useFreezer',
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
    renderWithHousehold(<HouseholdForm />);

    const freezerCheckbox = screen.getByLabelText(
      'settings.household.useFreezer',
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

  it('should apply single preset', () => {
    renderWithHousehold(<HouseholdForm />);

    const singleButton = screen.getByText('settings.household.presets.single');
    fireEvent.click(singleButton);

    const adultsInput = screen.getByLabelText(
      'settings.household.adults',
    ) as HTMLInputElement;
    expect(adultsInput.value).toBe('1');
  });

  it('should apply couple preset', () => {
    renderWithHousehold(<HouseholdForm />);

    const coupleButton = screen.getByText('settings.household.presets.couple');
    fireEvent.click(coupleButton);

    const adultsInput = screen.getByLabelText(
      'settings.household.adults',
    ) as HTMLInputElement;
    expect(adultsInput.value).toBe('2');
  });

  it('should apply family preset', () => {
    renderWithHousehold(<HouseholdForm />);

    const familyButton = screen.getByText('settings.household.presets.family');
    fireEvent.click(familyButton);

    const adultsInput = screen.getByLabelText(
      'settings.household.adults',
    ) as HTMLInputElement;
    const childrenInput = screen.getByLabelText(
      'settings.household.children',
    ) as HTMLInputElement;
    expect(adultsInput.value).toBe('2');
    expect(childrenInput.value).toBe('2');
  });

  it('should update children value', () => {
    renderWithHousehold(<HouseholdForm />);

    const childrenInput = screen.getByLabelText(
      'settings.household.children',
    ) as HTMLInputElement;
    fireEvent.change(childrenInput, { target: { value: '4' } });

    expect(childrenInput.value).toBe('4');
  });

  it('should update supply days value', () => {
    renderWithHousehold(<HouseholdForm />);

    const supplyDaysInput = screen.getByLabelText(
      'settings.household.supplyDays',
    ) as HTMLInputElement;
    fireEvent.change(supplyDaysInput, { target: { value: '7' } });

    expect(supplyDaysInput.value).toBe('7');
  });

  it('should handle empty adults value as 0', () => {
    renderWithHousehold(<HouseholdForm />);

    const adultsInput = screen.getByLabelText(
      'settings.household.adults',
    ) as HTMLInputElement;
    fireEvent.change(adultsInput, { target: { value: '' } });

    expect(adultsInput.value).toBe('0');
  });

  it('should handle empty children value as 0', () => {
    renderWithHousehold(<HouseholdForm />);

    const childrenInput = screen.getByLabelText(
      'settings.household.children',
    ) as HTMLInputElement;
    fireEvent.change(childrenInput, { target: { value: '' } });

    expect(childrenInput.value).toBe('0');
  });

  it('should handle empty supply days value as 1', () => {
    renderWithHousehold(<HouseholdForm />);

    const supplyDaysInput = screen.getByLabelText(
      'settings.household.supplyDays',
    ) as HTMLInputElement;
    fireEvent.change(supplyDaysInput, { target: { value: '' } });

    expect(supplyDaysInput.value).toBe('1');
  });
});
