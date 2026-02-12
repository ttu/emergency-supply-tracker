import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useLocalStorageSync,
  notifyStorageChange,
} from './useLocalStorageSync';
import * as localStorage from '@/shared/utils/storage/localStorage';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';
import type { AppData, HouseholdConfig } from '@/shared/types';
import {
  createMockHousehold as createFactoryHousehold,
  createMockSettings as createFactorySettings,
  createMockAppData as createFactoryAppData,
} from '@/shared/utils/test/factories';

// Create deterministic mock data for tests (not random like factories)
function createMockSettings(overrides?: Partial<AppData['settings']>) {
  return createFactorySettings({
    language: 'en',
    theme: 'light',
    highContrast: false,
    advancedFeatures: {
      calorieTracking: false,
      powerManagement: false,
      waterTracking: false,
    },
    ...overrides,
  });
}

function createMockHousehold(
  overrides?: Partial<HouseholdConfig>,
): HouseholdConfig {
  return createFactoryHousehold({
    adults: 2,
    children: 0,
    pets: 0,
    supplyDurationDays: 7,
    useFreezer: false,
    ...overrides,
  });
}

function createMockAppData(overrides?: Partial<AppData>): AppData {
  return createFactoryAppData({
    version: CURRENT_SCHEMA_VERSION,
    household: createMockHousehold(overrides?.household),
    settings: createMockSettings(overrides?.settings),
    items: [],
    customCategories: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    lastModified: new Date().toISOString(),
    ...overrides,
  });
}

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage', () => ({
  getAppData: vi.fn(),
  saveAppData: vi.fn(),
  createDefaultAppData: vi.fn(() => ({
    version: CURRENT_SCHEMA_VERSION,
    household: {
      adults: 2,
      children: 0,
      pets: 0,
      supplyDurationDays: 7,
      useFreezer: false,
    },
    settings: {
      language: 'en',
      theme: 'light',
      highContrast: false,
      advancedFeatures: {
        calorieTracking: false,
        powerManagement: false,
        waterTracking: false,
      },
    },
    items: [],
    customCategories: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    lastModified: new Date().toISOString(),
  })),
}));

describe('useLocalStorageSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize state from localStorage when data exists', () => {
      const mockHousehold = createMockHousehold({
        adults: 3,
        children: 2,
        supplyDurationDays: 7,
        useFreezer: true,
      });

      vi.mocked(localStorage.getAppData).mockReturnValue(
        createMockAppData({ household: mockHousehold }),
      );

      const { result } = renderHook(() =>
        useLocalStorageSync('household', mockHousehold),
      );

      expect(result.current[0]).toEqual(mockHousehold);
      // getAppData called during initialization and useEffect
      expect(localStorage.getAppData).toHaveBeenCalled();
    });

    it('should use default value when localStorage has no data', () => {
      const defaultHousehold = createMockHousehold({
        adults: 1,
        children: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      });

      vi.mocked(localStorage.getAppData).mockReturnValue(undefined);

      const { result } = renderHook(() =>
        useLocalStorageSync('household', defaultHousehold),
      );

      expect(result.current[0]).toEqual(defaultHousehold);
      // getAppData called during initialization and useEffect
      expect(localStorage.getAppData).toHaveBeenCalled();
    });

    it('should use default value when localStorage data is missing the key', () => {
      const defaultHousehold = createMockHousehold({
        adults: 1,
        children: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      });

      // Mock AppData without household to test fallback to default
      vi.mocked(localStorage.getAppData).mockReturnValue(
        createMockAppData({
          household: undefined as unknown as HouseholdConfig,
        }) as AppData,
      );

      const { result } = renderHook(() =>
        useLocalStorageSync('household', defaultHousehold),
      );

      expect(result.current[0]).toEqual(defaultHousehold);
    });

    it('should support custom initializer function', () => {
      const mockSettings = createMockSettings({
        language: 'fi' as const,
        theme: 'dark' as const,
        highContrast: true,
        advancedFeatures: {
          calorieTracking: true,
          powerManagement: false,
          waterTracking: true,
        },
      });

      vi.mocked(localStorage.getAppData).mockReturnValue(
        createMockAppData({
          household: createMockHousehold({
            supplyDurationDays: 3,
          }),
          settings: mockSettings,
        }),
      );

      const initializer = (data: AppData | undefined) => {
        if (data?.settings) {
          return {
            ...data.settings,
            theme: 'light' as const, // Override theme
          };
        }
        return {
          language: 'en' as const,
          theme: 'light' as const,
          highContrast: false,
          advancedFeatures: {
            calorieTracking: false,
            powerManagement: false,
            waterTracking: false,
          },
        };
      };

      const { result } = renderHook(() =>
        useLocalStorageSync('settings', initializer),
      );

      expect(result.current[0]).toEqual({
        ...mockSettings,
        theme: 'light',
      });
    });
  });

  describe('state updates and persistence', () => {
    it('should save to localStorage when state is updated', () => {
      const defaultHousehold = createMockHousehold({
        supplyDurationDays: 3,
      });

      const mockAppData = createMockAppData({
        household: defaultHousehold,
      });

      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(mockAppData);

      const { result } = renderHook(() =>
        useLocalStorageSync('household', defaultHousehold),
      );

      const updatedHousehold = createMockHousehold({
        adults: 4,
        children: 2,
        supplyDurationDays: 7,
        useFreezer: true,
      });

      act(() => {
        result.current[1](updatedHousehold);
      });

      expect(result.current[0]).toEqual(updatedHousehold);
      expect(localStorage.saveAppData).toHaveBeenCalledWith(
        expect.objectContaining({
          household: updatedHousehold,
          lastModified: expect.any(String),
        }),
      );
    });

    it('should call createDefaultAppData when getAppData returns undefined in useEffect', () => {
      const defaultHousehold = createMockHousehold({
        adults: 1,
        children: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      });

      const mockDefaultAppData = createMockAppData({
        household: defaultHousehold,
      });

      // Mock getAppData to return undefined (simulating empty localStorage)
      vi.mocked(localStorage.getAppData).mockReturnValue(undefined);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(
        mockDefaultAppData,
      );

      renderHook(() => useLocalStorageSync('household', defaultHousehold));

      // Verify createDefaultAppData was called in useEffect
      expect(localStorage.createDefaultAppData).toHaveBeenCalled();

      // Verify saveAppData was called with the default app data
      expect(localStorage.saveAppData).toHaveBeenCalledWith(
        expect.objectContaining({
          household: defaultHousehold,
        }),
      );
    });

    it('should support functional state updates', () => {
      const defaultHousehold = createMockHousehold({
        supplyDurationDays: 3,
      });

      const mockAppData = createMockAppData({
        household: defaultHousehold,
      });

      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(mockAppData);

      const { result } = renderHook(() =>
        useLocalStorageSync('household', defaultHousehold),
      );

      act(() => {
        result.current[1]((prev: HouseholdConfig) => ({
          ...prev,
          adults: prev.adults + 1,
        }));
      });

      expect(result.current[0].adults).toBe(3);
      expect(localStorage.saveAppData).toHaveBeenCalledWith(
        expect.objectContaining({
          household: expect.objectContaining({ adults: 3 }),
        }),
      );
    });

    it('should update lastModified timestamp on each save', () => {
      const defaultHousehold = createMockHousehold({
        supplyDurationDays: 3,
      });

      const initialTimestamp = '2024-01-01T00:00:00.000Z';
      const mockAppData = createMockAppData({
        household: defaultHousehold,
        lastModified: initialTimestamp,
      });

      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(mockAppData);

      const { result } = renderHook(() =>
        useLocalStorageSync('household', defaultHousehold),
      );

      act(() => {
        result.current[1]({ ...defaultHousehold, adults: 3 });
      });

      expect(localStorage.saveAppData).toHaveBeenCalledWith(
        expect.objectContaining({
          lastModified: expect.not.stringMatching(initialTimestamp),
        }),
      );
    });
  });

  describe('multiple state slices', () => {
    it('should support syncing multiple independent properties', () => {
      const mockAppData = createMockAppData({
        household: createMockHousehold({
          supplyDurationDays: 3,
        }),
      });

      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(mockAppData);

      const { result: householdResult } = renderHook(() =>
        useLocalStorageSync('household', mockAppData.household),
      );

      const { result: settingsResult } = renderHook(() =>
        useLocalStorageSync('settings', mockAppData.settings),
      );

      expect(householdResult.current[0]).toEqual(mockAppData.household);
      expect(settingsResult.current[0]).toEqual(mockAppData.settings);

      act(() => {
        householdResult.current[1]({ ...mockAppData.household, adults: 3 });
      });

      expect(localStorage.saveAppData).toHaveBeenCalledWith(
        expect.objectContaining({
          household: expect.objectContaining({ adults: 3 }),
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully during initialization', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const defaultHousehold = createMockHousehold({
        supplyDurationDays: 3,
      });

      vi.mocked(localStorage.getAppData).mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const { result } = renderHook(() =>
        useLocalStorageSync('household', defaultHousehold),
      );

      // Should fall back to default value
      expect(result.current[0]).toEqual(defaultHousehold);

      consoleErrorSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully during save', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const defaultHousehold = createMockHousehold({
        supplyDurationDays: 3,
      });

      const mockAppData = createMockAppData({
        household: defaultHousehold,
      });

      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.saveAppData).mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      const { result } = renderHook(() =>
        useLocalStorageSync('household', defaultHousehold),
      );

      // State update should still work, just save fails
      act(() => {
        result.current[1]({ ...defaultHousehold, adults: 3 });
      });

      expect(result.current[0].adults).toBe(3);
      // saveAppData is mocked to throw, error already handled by localStorage.saveAppData

      consoleErrorSpy.mockRestore();
    });
  });

  describe('notifyStorageChange', () => {
    it('should refresh state when notifyStorageChange is called', () => {
      const initialHousehold = createMockHousehold({
        adults: 2,
        supplyDurationDays: 3,
      });

      const updatedHousehold = createMockHousehold({
        adults: 5,
        supplyDurationDays: 14,
      });

      const mockAppData = createMockAppData({
        household: initialHousehold,
      });

      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(mockAppData);

      const { result } = renderHook(() =>
        useLocalStorageSync('household', initialHousehold),
      );

      expect(result.current[0]).toEqual(initialHousehold);

      // Simulate external localStorage change
      const updatedAppData = createMockAppData({
        household: updatedHousehold,
      });
      vi.mocked(localStorage.getAppData).mockReturnValue(updatedAppData);

      // Dispatch the storage sync event
      act(() => {
        notifyStorageChange();
      });

      // State should now reflect the updated localStorage value
      expect(result.current[0]).toEqual(updatedHousehold);
    });

    it('should refresh multiple hooks when notifyStorageChange is called', () => {
      const mockAppData = createMockAppData({
        household: createMockHousehold({ adults: 2 }),
        settings: createMockSettings({ theme: 'light' }),
      });

      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(mockAppData);

      const { result: householdResult } = renderHook(() =>
        useLocalStorageSync('household', mockAppData.household),
      );

      const { result: settingsResult } = renderHook(() =>
        useLocalStorageSync('settings', mockAppData.settings),
      );

      expect(householdResult.current[0].adults).toBe(2);
      expect(settingsResult.current[0].theme).toBe('light');

      // Simulate external localStorage change affecting both
      const updatedAppData = createMockAppData({
        household: createMockHousehold({ adults: 4 }),
        settings: createMockSettings({ theme: 'dark' }),
      });
      vi.mocked(localStorage.getAppData).mockReturnValue(updatedAppData);

      // Dispatch the storage sync event
      act(() => {
        notifyStorageChange();
      });

      // Both hooks should have refreshed
      expect(householdResult.current[0].adults).toBe(4);
      expect(settingsResult.current[0].theme).toBe('dark');
    });

    it('should call initializer function on refresh when provided', () => {
      const mockSettings = createMockSettings({
        language: 'en' as const,
        theme: 'light' as const,
      });

      vi.mocked(localStorage.getAppData).mockReturnValue(
        createMockAppData({ settings: mockSettings }),
      );

      const initializer = vi.fn((data: AppData | undefined) => {
        if (data?.settings) {
          return {
            ...data.settings,
            theme: 'dark' as const, // Always override to dark
          };
        }
        return mockSettings;
      });

      const { result } = renderHook(() =>
        useLocalStorageSync('settings', initializer),
      );

      // Initial call during initialization
      expect(initializer).toHaveBeenCalledTimes(1);
      expect(result.current[0].theme).toBe('dark');

      // Update localStorage
      const updatedSettings = createMockSettings({
        language: 'fi' as const,
        theme: 'light' as const,
      });
      vi.mocked(localStorage.getAppData).mockReturnValue(
        createMockAppData({ settings: updatedSettings }),
      );

      // Trigger refresh
      act(() => {
        notifyStorageChange();
      });

      // Initializer should be called again
      expect(initializer).toHaveBeenCalledTimes(2);
      // Theme should still be overridden to dark by initializer
      expect(result.current[0].theme).toBe('dark');
      // But language should reflect the updated value
      expect(result.current[0].language).toBe('fi');
    });

    it('should handle errors gracefully during refresh', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const defaultHousehold = createMockHousehold({ adults: 2 });
      const mockAppData = createMockAppData({ household: defaultHousehold });

      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(mockAppData);

      const { result } = renderHook(() =>
        useLocalStorageSync('household', defaultHousehold),
      );

      expect(result.current[0]).toEqual(defaultHousehold);

      // Make getAppData throw on refresh
      vi.mocked(localStorage.getAppData).mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      // Dispatch the storage sync event - should not throw
      act(() => {
        notifyStorageChange();
      });

      // State should remain unchanged due to error
      expect(result.current[0]).toEqual(defaultHousehold);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to refresh state'),
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should cleanup event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(
        globalThis,
        'removeEventListener',
      );
      const defaultHousehold = createMockHousehold({ adults: 2 });
      const mockAppData = createMockAppData({ household: defaultHousehold });

      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(mockAppData);

      const { unmount } = renderHook(() =>
        useLocalStorageSync('household', defaultHousehold),
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'app-storage-sync',
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
