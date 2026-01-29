import { screen, fireEvent, waitFor } from '@testing-library/react';
import { HouseholdForm } from './HouseholdForm';
import { useHousehold } from '@/features/household';
import { renderWithHousehold } from '@/test';

// Test probe component to verify household context state
function HouseholdStateProbe() {
  const { household } = useHousehold();
  return (
    <div data-testid="household-state">
      <span data-testid="household-adults">{household.adults}</span>
      <span data-testid="household-children">{household.children}</span>
      <span data-testid="household-pets">{household.pets}</span>
    </div>
  );
}

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
      screen.getByLabelText('settings.household.pets'),
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
    const petsInput = screen.getByLabelText(
      'settings.household.pets',
    ) as HTMLInputElement;
    const supplyDaysInput = screen.getByLabelText(
      'settings.household.supplyDays',
    ) as HTMLInputElement;

    expect(adultsInput.value).toBe('2');
    expect(childrenInput.value).toBe('3');
    expect(petsInput.value).toBe('0');
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

  it('should apply single preset (preset updates underlying household)', async () => {
    renderWithHousehold(
      <>
        <HouseholdForm />
        <HouseholdStateProbe />
      </>,
    );

    const singleButton = screen.getByText('settings.household.presets.single');
    fireEvent.click(singleButton);

    // Verify the household context state actually changed to single preset values
    await waitFor(() => {
      expect(screen.getByTestId('household-adults')).toHaveTextContent('1');
      expect(screen.getByTestId('household-children')).toHaveTextContent('0');
      expect(screen.getByTestId('household-pets')).toHaveTextContent('0');
    });
  });

  it('should apply couple preset (preset updates underlying household)', async () => {
    renderWithHousehold(
      <>
        <HouseholdForm />
        <HouseholdStateProbe />
      </>,
    );

    const coupleButton = screen.getByText('settings.household.presets.couple');
    fireEvent.click(coupleButton);

    // Verify the household context state actually changed to couple preset values
    await waitFor(() => {
      expect(screen.getByTestId('household-adults')).toHaveTextContent('2');
      expect(screen.getByTestId('household-children')).toHaveTextContent('0');
      expect(screen.getByTestId('household-pets')).toHaveTextContent('0');
    });
  });

  it('should apply family preset (preset updates underlying household)', async () => {
    renderWithHousehold(
      <>
        <HouseholdForm />
        <HouseholdStateProbe />
      </>,
    );

    const familyButton = screen.getByText('settings.household.presets.family');
    fireEvent.click(familyButton);

    // Verify the household context state actually changed to family preset values
    await waitFor(() => {
      expect(screen.getByTestId('household-adults')).toHaveTextContent('2');
      expect(screen.getByTestId('household-children')).toHaveTextContent('2');
      expect(screen.getByTestId('household-pets')).toHaveTextContent('0');
    });
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

  it('should handle empty adults value as 0 on blur', () => {
    renderWithHousehold(<HouseholdForm />);

    const adultsInput = screen.getByLabelText(
      'settings.household.adults',
    ) as HTMLInputElement;
    fireEvent.change(adultsInput, { target: { value: '' } });
    // Empty value is allowed during editing
    expect(adultsInput.value).toBe('');
    // But corrected to 0 on blur
    fireEvent.blur(adultsInput);
    expect(adultsInput.value).toBe('0');
  });

  it('should handle empty children value as 0 on blur', () => {
    renderWithHousehold(<HouseholdForm />);

    const childrenInput = screen.getByLabelText(
      'settings.household.children',
    ) as HTMLInputElement;
    fireEvent.change(childrenInput, { target: { value: '' } });
    // Empty value is allowed during editing
    expect(childrenInput.value).toBe('');
    // But corrected to 0 on blur
    fireEvent.blur(childrenInput);
    expect(childrenInput.value).toBe('0');
  });

  it('should update pets value', () => {
    renderWithHousehold(<HouseholdForm />);

    const petsInput = screen.getByLabelText(
      'settings.household.pets',
    ) as HTMLInputElement;
    fireEvent.change(petsInput, { target: { value: '2' } });

    expect(petsInput.value).toBe('2');
  });

  it('should handle empty pets value as 0 on blur', () => {
    renderWithHousehold(<HouseholdForm />);

    const petsInput = screen.getByLabelText(
      'settings.household.pets',
    ) as HTMLInputElement;
    fireEvent.change(petsInput, { target: { value: '' } });
    // Empty value is allowed during editing
    expect(petsInput.value).toBe('');
    // But corrected to 0 on blur
    fireEvent.blur(petsInput);
    expect(petsInput.value).toBe('0');
  });

  it('should handle empty supply days value as 1 on blur', () => {
    renderWithHousehold(<HouseholdForm />);

    const supplyDaysInput = screen.getByLabelText(
      'settings.household.supplyDays',
    ) as HTMLInputElement;
    fireEvent.change(supplyDaysInput, { target: { value: '' } });
    // Empty value is allowed during editing
    expect(supplyDaysInput.value).toBe('');
    // But corrected to 1 (minimum) on blur
    fireEvent.blur(supplyDaysInput);
    expect(supplyDaysInput.value).toBe('1');
  });

  it('should clamp supply days to maximum 365 on blur', () => {
    renderWithHousehold(<HouseholdForm />);

    const supplyDaysInput = screen.getByLabelText(
      'settings.household.supplyDays',
    ) as HTMLInputElement;
    fireEvent.change(supplyDaysInput, { target: { value: '500' } });
    // Value exceeds max during editing
    expect(supplyDaysInput.value).toBe('500');
    // Clamped to 365 on blur
    fireEvent.blur(supplyDaysInput);
    expect(supplyDaysInput.value).toBe('365');
  });

  it('should accept valid supply days value on blur', () => {
    renderWithHousehold(<HouseholdForm />);

    const supplyDaysInput = screen.getByLabelText(
      'settings.household.supplyDays',
    ) as HTMLInputElement;
    fireEvent.change(supplyDaysInput, { target: { value: '30' } });
    fireEvent.blur(supplyDaysInput);
    // Valid value should be accepted as-is
    expect(supplyDaysInput.value).toBe('30');
  });

  it('should handle freezer hours validation on blur', () => {
    // Start with freezer enabled
    renderWithHousehold(<HouseholdForm />, {
      initialAppData: {
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: true,
          freezerHoldTimeHours: 24,
        },
      },
    });

    const freezerInput = screen.getByLabelText(
      'settings.household.freezerHoldTime',
    ) as HTMLInputElement;

    // Test exceeding max (72)
    fireEvent.change(freezerInput, { target: { value: '100' } });
    fireEvent.blur(freezerInput);
    expect(freezerInput.value).toBe('72');
  });

  it('should handle empty freezer hours as undefined on blur', () => {
    // Start with freezer enabled
    renderWithHousehold(<HouseholdForm />, {
      initialAppData: {
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: true,
          freezerHoldTimeHours: 24,
        },
      },
    });

    const freezerInput = screen.getByLabelText(
      'settings.household.freezerHoldTime',
    ) as HTMLInputElement;

    // Clear the input
    fireEvent.change(freezerInput, { target: { value: '' } });
    fireEvent.blur(freezerInput);
    // Empty value should remain empty (undefined in context)
    expect(freezerInput.value).toBe('');
  });

  it('should handle invalid freezer hours on blur', () => {
    // Start with freezer enabled and a valid value
    renderWithHousehold(<HouseholdForm />, {
      initialAppData: {
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: true,
          freezerHoldTimeHours: 24,
        },
      },
    });

    const freezerInput = screen.getByLabelText(
      'settings.household.freezerHoldTime',
    ) as HTMLInputElement;

    // Verify initial value
    expect(freezerInput.value).toBe('24');

    // Enter invalid value (negative)
    fireEvent.change(freezerInput, { target: { value: '-5' } });
    fireEvent.blur(freezerInput);
    // Should reset to previous valid value
    expect(freezerInput.value).toBe('24');
  });
});
