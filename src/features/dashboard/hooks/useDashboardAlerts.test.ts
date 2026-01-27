import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardAlerts } from './useDashboardAlerts';
import { createAlertId } from '@/shared/types';

vi.mock('@/features/inventory', () => ({
  useInventory: vi.fn(),
}));

vi.mock('@/features/household', () => ({
  useHousehold: vi.fn(),
}));

vi.mock('@/features/templates', () => ({
  useRecommendedItems: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/shared/utils/storage/localStorage', () => ({
  getAppData: vi.fn(),
}));

vi.mock('@/features/alerts', () => ({
  generateDashboardAlerts: vi.fn(),
}));

// Mock the useBackupTracking hook
const mockShouldShowBackupReminder = vi.fn();
const mockDismissBackupReminder = vi.fn();
const mockRecordBackupDate = vi.fn();

vi.mock('./useBackupTracking', () => ({
  useBackupTracking: vi.fn(() => ({
    lastBackupDate: undefined,
    backupReminderDismissedUntil: undefined,
    shouldShowBackupReminder: mockShouldShowBackupReminder,
    recordBackupDate: mockRecordBackupDate,
    dismissBackupReminder: mockDismissBackupReminder,
  })),
}));

import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { getAppData } from '@/shared/utils/storage/localStorage';
import { generateDashboardAlerts } from '@/features/alerts';

describe('useDashboardAlerts', () => {
  const mockDismissAlert = vi.fn();
  const mockReactivateAllAlerts = vi.fn();

  const defaultMocks = () => {
    vi.mocked(useInventory).mockReturnValue({
      items: [],
      categories: [],
      addItem: vi.fn(),
      addItems: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      dismissedAlertIds: [],
      dismissAlert: mockDismissAlert,
      reactivateAlert: vi.fn(),
      reactivateAllAlerts: mockReactivateAllAlerts,
      disabledRecommendedItems: [],
      disableRecommendedItem: vi.fn(),
      enableRecommendedItem: vi.fn(),
      enableAllRecommendedItems: vi.fn(),
      disabledCategories: [],
      disableCategory: vi.fn(),
      enableCategory: vi.fn(),
      enableAllCategories: vi.fn(),
    });

    vi.mocked(useHousehold).mockReturnValue({
      household: {
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
      updateHousehold: vi.fn(),
      setPreset: vi.fn(),
    });

    vi.mocked(useRecommendedItems).mockReturnValue({
      recommendedItems: [],
      availableKits: [],
      selectedKitId: undefined,
      selectKit: vi.fn(),
      uploadKit: vi.fn(),
      deleteKit: vi.fn(),
      forkBuiltInKit: vi.fn(),
      updateCurrentKitMeta: vi.fn(),
      addItemToKit: vi.fn(),
      updateItemInKit: vi.fn(),
      removeItemFromKit: vi.fn(),
      customRecommendationsInfo: undefined,
      isUsingCustomRecommendations: false,
      importRecommendedItems: vi.fn(),
      exportRecommendedItems: vi.fn(),
      resetToDefaultRecommendations: vi.fn(),
      getItemName: vi.fn(),
    });

    vi.mocked(generateDashboardAlerts).mockReturnValue([]);
    // Default: backup reminder not shown
    mockShouldShowBackupReminder.mockReturnValue(false);
    vi.mocked(getAppData).mockReturnValue(undefined);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks();
  });

  it('should return empty active alerts when no alerts exist', () => {
    const { result } = renderHook(() => useDashboardAlerts());

    expect(result.current.activeAlerts).toEqual([]);
    expect(result.current.hiddenAlertsCount).toBe(0);
  });

  it('should include backup reminder alert when conditions are met', () => {
    mockShouldShowBackupReminder.mockReturnValue(true);

    const { result } = renderHook(() => useDashboardAlerts());

    expect(result.current.activeAlerts).toHaveLength(1);
    expect(result.current.activeAlerts[0].id).toBe(
      createAlertId('backup-reminder'),
    );
    expect(result.current.activeAlerts[0].type).toBe('info');
  });

  it('should include generated alerts', () => {
    const mockAlerts = [
      {
        id: createAlertId('test-alert-1'),
        type: 'warning' as const,
        message: 'Test 1',
      },
      {
        id: createAlertId('test-alert-2'),
        type: 'critical' as const,
        message: 'Test 2',
      },
    ];
    vi.mocked(generateDashboardAlerts).mockReturnValue(mockAlerts);

    const { result } = renderHook(() => useDashboardAlerts());

    expect(result.current.activeAlerts).toHaveLength(2);
  });

  it('should filter out dismissed alerts', () => {
    const dismissedId = createAlertId('dismissed-alert');
    const mockAlerts = [
      { id: dismissedId, type: 'warning' as const, message: 'Dismissed' },
      {
        id: createAlertId('active-alert'),
        type: 'info' as const,
        message: 'Active',
      },
    ];
    vi.mocked(generateDashboardAlerts).mockReturnValue(mockAlerts);
    vi.mocked(useInventory).mockReturnValue({
      items: [],
      categories: [],
      addItem: vi.fn(),
      addItems: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      dismissedAlertIds: [dismissedId],
      dismissAlert: mockDismissAlert,
      reactivateAlert: vi.fn(),
      reactivateAllAlerts: mockReactivateAllAlerts,
      disabledRecommendedItems: [],
      disableRecommendedItem: vi.fn(),
      enableRecommendedItem: vi.fn(),
      enableAllRecommendedItems: vi.fn(),
      disabledCategories: [],
      disableCategory: vi.fn(),
      enableCategory: vi.fn(),
      enableAllCategories: vi.fn(),
    });

    const { result } = renderHook(() => useDashboardAlerts());

    expect(result.current.activeAlerts).toHaveLength(1);
    expect(result.current.activeAlerts[0].id).toBe(
      createAlertId('active-alert'),
    );
    expect(result.current.hiddenAlertsCount).toBe(1);
  });

  it('should handle dismissing regular alerts', () => {
    const alertId = createAlertId('test-alert');
    const mockAlerts = [
      { id: alertId, type: 'warning' as const, message: 'Test' },
    ];
    vi.mocked(generateDashboardAlerts).mockReturnValue(mockAlerts);

    const { result } = renderHook(() => useDashboardAlerts());

    act(() => {
      result.current.handleDismissAlert(alertId);
    });

    expect(mockDismissAlert).toHaveBeenCalledWith(alertId);
  });

  it('should handle dismissing backup reminder', () => {
    mockShouldShowBackupReminder.mockReturnValue(true);

    const { result } = renderHook(() => useDashboardAlerts());
    const backupReminderId = createAlertId('backup-reminder');

    act(() => {
      result.current.handleDismissAlert(backupReminderId);
    });

    expect(mockDismissBackupReminder).toHaveBeenCalled();
  });

  it('should handle dismissing all alerts', () => {
    const alert1 = createAlertId('alert-1');
    const alert2 = createAlertId('alert-2');
    const mockAlerts = [
      { id: alert1, type: 'warning' as const, message: 'Alert 1' },
      { id: alert2, type: 'critical' as const, message: 'Alert 2' },
    ];
    vi.mocked(generateDashboardAlerts).mockReturnValue(mockAlerts);

    const { result } = renderHook(() => useDashboardAlerts());

    act(() => {
      result.current.handleDismissAllAlerts();
    });

    expect(mockDismissAlert).toHaveBeenCalledWith(alert1);
    expect(mockDismissAlert).toHaveBeenCalledWith(alert2);
    expect(mockDismissAlert).toHaveBeenCalledTimes(2);
  });

  it('should handle dismiss all including backup reminder', () => {
    mockShouldShowBackupReminder.mockReturnValue(true);
    const alert1 = createAlertId('alert-1');
    vi.mocked(generateDashboardAlerts).mockReturnValue([
      { id: alert1, type: 'warning' as const, message: 'Alert 1' },
    ]);

    const { result } = renderHook(() => useDashboardAlerts());

    act(() => {
      result.current.handleDismissAllAlerts();
    });

    expect(mockDismissBackupReminder).toHaveBeenCalled();
    expect(mockDismissAlert).toHaveBeenCalledWith(alert1);
  });

  it('should handle showing all alerts', () => {
    const { result } = renderHook(() => useDashboardAlerts());

    act(() => {
      result.current.handleShowAllAlerts();
    });

    expect(mockReactivateAllAlerts).toHaveBeenCalled();
  });
});
