import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './render';
import { useSettings } from '@/features/settings';
import { useHousehold } from '@/features/household';
import { useInventory } from '@/features/inventory';
import { STORAGE_KEY } from '@/shared/utils/storage/localStorage';
import type { AppData } from '@/shared/types';
import {
  createMockAppData,
  createMockInventoryItem,
} from '@/shared/utils/test/factories';

/**
 * Test component that uses all contexts and updates localStorage
 */
function TestComponent() {
  const { settings, updateSettings } = useSettings();
  const { household, updateHousehold } = useHousehold();
  const { items } = useInventory();

  return (
    <div data-testid="test-component">
      <div data-testid="settings-theme">{settings.theme}</div>
      <div data-testid="household-adults">{household.adults}</div>
      <div data-testid="items-count">{items.length}</div>
      <button
        data-testid="update-settings"
        onClick={() => updateSettings({ theme: 'dark' })}
      >
        Update Settings
      </button>
      <button
        data-testid="update-household"
        onClick={() => updateHousehold({ ...household, adults: 3 })}
      >
        Update Household
      </button>
    </div>
  );
}

describe('renderWithProviders localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should load initial data from localStorage', () => {
    const initialData: Partial<AppData> = {
      settings: {
        theme: 'dark',
        language: 'fi',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
      household: {
        adults: 4,
        children: 2,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      items: [createMockInventoryItem({ name: 'Test Item' })],
    };

    const appData = createMockAppData(initialData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));

    const { unmount } = renderWithProviders(<TestComponent />, {
      initialAppData: initialData,
    });

    // Verify data was loaded from localStorage
    expect(screen.getByTestId('settings-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('household-adults')).toHaveTextContent('4');
    expect(screen.getByTestId('items-count')).toHaveTextContent('1');

    unmount();
  });

  it('should save updates to localStorage when providers update', async () => {
    const user = userEvent.setup();

    const { unmount } = renderWithProviders(<TestComponent />, {
      initialAppData: {
        settings: {
          theme: 'light',
          language: 'en',
          highContrast: false,
          advancedFeatures: {
            calorieTracking: false,
            powerManagement: false,
            waterTracking: false,
          },
        },
        household: {
          adults: 1,
          children: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      },
    });

    // Verify initial state
    expect(screen.getByTestId('settings-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('household-adults')).toHaveTextContent('1');

    // Update settings
    await user.click(screen.getByTestId('update-settings'));

    // Wait for localStorage to be updated
    await waitFor(() => {
      const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(savedData.settings?.theme).toBe('dark');
    });

    // Update household
    await user.click(screen.getByTestId('update-household'));

    // Wait for localStorage to be updated
    await waitFor(() => {
      const updatedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(updatedData.household?.adults).toBe(3);
    });

    unmount();
  });

  it('should clean up localStorage after unmount when initialAppData was provided', () => {
    const initialData: Partial<AppData> = {
      settings: {
        theme: 'dark',
        language: 'en',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
    };

    const { unmount } = renderWithProviders(<TestComponent />, {
      initialAppData: initialData,
    });

    // Verify localStorage has data
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();

    // Unmount should clean up
    unmount();

    // Verify localStorage was cleaned up
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should not clean up localStorage if initialAppData was not provided', () => {
    // Manually set localStorage
    const appData = createMockAppData({
      settings: {
        theme: 'dark',
        language: 'en',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));

    const { unmount } = renderWithProviders(<TestComponent />);

    // Verify localStorage still has data
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();

    // Unmount should NOT clean up (since we didn't provide initialAppData)
    unmount();

    // Verify localStorage was NOT cleaned up
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });

  it('should persist data across multiple renders with same initialAppData', () => {
    const initialData: Partial<AppData> = {
      household: {
        adults: 2,
        children: 1,
        supplyDurationDays: 5,
        useFreezer: false,
      },
    };

    const { unmount: unmount1 } = renderWithProviders(<TestComponent />, {
      initialAppData: initialData,
    });

    expect(screen.getByTestId('household-adults')).toHaveTextContent('2');
    unmount1();

    // Render again with same initial data
    const { unmount: unmount2 } = renderWithProviders(<TestComponent />, {
      initialAppData: initialData,
    });

    expect(screen.getByTestId('household-adults')).toHaveTextContent('2');
    unmount2();
  });
});
