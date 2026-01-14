import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorageSync } from './useLocalStorageSync';
import * as localStorage from '@/shared/utils/storage/localStorage';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';
import type { AppData, HouseholdConfig } from '@/shared/types';

// Helper functions to create mock data (reduces nesting depth)
function createMockSettings(overrides?: Partial<AppData['settings']>) {
  return {
    language: 'en' as const,
    theme: 'light' as const,
    highContrast: false,
    advancedFeatures: {
      calorieTracking: false,
      powerManagement: false,
      waterTracking: false,
    },
    ...overrides,
  };
}

function createMockHousehold(
  overrides?: Partial<HouseholdConfig>,
): HouseholdConfig {
  return {
    adults: 2,
    children: 0,
    supplyDurationDays: 7,
    useFreezer: false,
    ...overrides,
  };
}

function createMockAppData(overrides?: Partial<AppData>): AppData {
  return {
    version: CURRENT_SCHEMA_VERSION,
    household: createMockHousehold(),
    settings: createMockSettings(),
    items: [],
    customCategories: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    lastModified: new Date().toISOString(),
    ...overrides,
  };
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
});
