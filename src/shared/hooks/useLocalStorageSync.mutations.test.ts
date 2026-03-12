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

describe('useLocalStorageSync - mutation killing tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('L75 StringLiteral: error message includes key name on init failure', () => {
    it('logs error message containing the key name when initialization fails', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      vi.mocked(localStorage.getAppData).mockImplementation(() => {
        throw new Error('storage broken');
      });

      renderHook(() => useLocalStorageSync('household', createMockHousehold()));

      // The error message must contain the key "household" - kills StringLiteral mutant on L75
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('household'),
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('L95 StringLiteral: error message includes key name on save failure', () => {
    it('logs error message containing the key name when save fails', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockAppData = createMockAppData();
      // First call succeeds (init), subsequent calls in useEffect will also succeed for getAppData
      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.saveAppData).mockImplementation(() => {
        throw new Error('quota exceeded');
      });

      renderHook(() => useLocalStorageSync('items', []));

      // The save error message must contain the key "items" - kills StringLiteral mutant on L95
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('items'),
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('L94 BlockStatement: catch block on save must not be empty', () => {
    it('catches save errors and logs them rather than swallowing silently', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const mockAppData = createMockAppData();
      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.saveAppData).mockImplementation(() => {
        throw new Error('save failed');
      });

      // The hook should not throw - the catch block handles it
      expect(() => {
        renderHook(() =>
          useLocalStorageSync('household', createMockHousehold()),
        );
      }).not.toThrow();

      // The catch block must actually DO something (call console.error)
      // If the block were empty {}, console.error would NOT be called
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save state'),
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('L116 ArrayDeclaration: refreshFromStorage useCallback deps', () => {
    it('refreshFromStorage updates when key changes by using correct dependencies', () => {
      const household1 = createMockHousehold({ adults: 1 });
      const household2 = createMockHousehold({ adults: 5 });

      const mockAppData1 = createMockAppData({ household: household1 });
      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData1);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(
        mockAppData1,
      );

      const { result, rerender } = renderHook(
        ({ key, defaultVal }) => useLocalStorageSync(key, defaultVal),
        {
          initialProps: {
            key: 'household' as const,
            defaultVal: household1,
          },
        },
      );

      expect(result.current[0]).toEqual(household1);

      // Update localStorage and trigger refresh
      const mockAppData2 = createMockAppData({ household: household2 });
      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData2);

      // Re-render with same key to trigger event-based refresh
      rerender({ key: 'household' as const, defaultVal: household1 });

      act(() => {
        notifyStorageChange();
      });

      // If deps were [] instead of [key, defaultValueOrInitializer],
      // refreshFromStorage would use stale closure values
      expect(result.current[0]).toEqual(household2);
    });
  });

  describe('L128 ArrayDeclaration: event listener useEffect deps', () => {
    it('re-registers event listener when refreshFromStorage changes', () => {
      const addEventListenerSpy = vi.spyOn(globalThis, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(
        globalThis,
        'removeEventListener',
      );

      const household = createMockHousehold({ adults: 2 });
      const mockAppData = createMockAppData({ household });
      vi.mocked(localStorage.getAppData).mockReturnValue(mockAppData);
      vi.mocked(localStorage.createDefaultAppData).mockReturnValue(mockAppData);

      // Use an initializer function so we can change defaultValueOrInitializer
      const initializer1 = (data: AppData | undefined) =>
        data?.household ?? household;
      const initializer2 = (data: AppData | undefined) =>
        data?.household ?? createMockHousehold({ adults: 99 });

      const { rerender } = renderHook(
        ({ init }) => useLocalStorageSync('household', init),
        { initialProps: { init: initializer1 } },
      );

      const initialAddCount = addEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'app-storage-sync',
      ).length;

      // Re-render with a different initializer, which should change refreshFromStorage
      // and thus re-register the event listener (cleanup old + add new)
      rerender({ init: initializer2 });

      const afterReregisterAddCount = addEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'app-storage-sync',
      ).length;

      // If deps were [], the listener would never be re-registered
      // With [refreshFromStorage], changing the initializer causes re-registration
      expect(afterReregisterAddCount).toBeGreaterThan(initialAddCount);

      // Cleanup should have been called for the old listener
      expect(
        removeEventListenerSpy.mock.calls.filter(
          (call) => call[0] === 'app-storage-sync',
        ).length,
      ).toBeGreaterThanOrEqual(1);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});
