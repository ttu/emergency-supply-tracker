import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardAlerts } from './useDashboardAlerts';
import { createAlertId, createDateOnly } from '@/shared/types';

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

const mockIsLocalStorageNearLimit = vi.fn();
const mockGetLocalStorageUsageMB = vi.fn();
vi.mock('@/shared/utils/storage/storageUsage', () => ({
  getLocalStorageUsageMB: () => mockGetLocalStorageUsageMB(),
  isLocalStorageNearLimit: () => mockIsLocalStorageNearLimit(),
}));

vi.mock('@/features/alerts', () => ({
  generateDashboardAlerts: vi.fn(),
}));

const mockShowNotification = vi.fn();
vi.mock('@/shared/hooks/useNotification', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
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

const mockMarkNotificationSeen = vi.fn();
vi.mock('./useSeenNotifications', () => ({
  useSeenNotifications: vi.fn(() => ({
    seenNotificationIds: new Set(),
    markNotificationSeen: mockMarkNotificationSeen,
  })),
}));

import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { getAppData } from '@/shared/utils/storage/localStorage';
import { generateDashboardAlerts } from '@/features/alerts';
import { APP_NOTIFICATIONS } from '../constants/notifications';
import { useBackupTracking } from './useBackupTracking';
import { useSeenNotifications } from './useSeenNotifications';

describe('useDashboardAlerts', () => {
  const mockDismissAlert = vi.fn();
  const mockDismissAlerts = vi.fn();
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
      dismissAlerts: mockDismissAlerts,
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
      customCategories: [],
      addCustomCategory: vi.fn(),
      updateCustomCategory: vi.fn(),
      deleteCustomCategory: vi.fn(() => ({ success: true })),
      customTemplates: [],
      addCustomTemplate: vi.fn(),
      updateCustomTemplate: vi.fn(),
      deleteCustomTemplate: vi.fn(),
    });

    vi.mocked(useHousehold).mockReturnValue({
      household: {
        enabled: true,
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
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set(),
      markNotificationSeen: mockMarkNotificationSeen,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks();
    mockIsLocalStorageNearLimit.mockReturnValue(false);
    mockGetLocalStorageUsageMB.mockReturnValue(0);
  });

  it('should return empty active alerts when no alerts exist and all notifications seen', () => {
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set([
        createAlertId('app-notification-release-testing'),
      ]),
      markNotificationSeen: mockMarkNotificationSeen,
    });

    const { result } = renderHook(() => useDashboardAlerts());

    expect(result.current.activeAlerts).toEqual([]);
    expect(result.current.hiddenAlertsCount).toBe(0);
  });

  it('should include app notification when not seen', () => {
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set(),
      markNotificationSeen: mockMarkNotificationSeen,
    });

    const { result } = renderHook(() => useDashboardAlerts());

    const releaseNotification = result.current.activeAlerts.find(
      (a) => String(a.id) === 'app-notification-release-testing',
    );
    expect(releaseNotification).toBeDefined();
    expect(releaseNotification?.type).toBe('info');
    expect(releaseNotification?.message).toBe(
      'alerts.notifications.releaseTesting',
    );
  });

  it('should not include app notification when seen', () => {
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set([
        createAlertId('app-notification-release-testing'),
      ]),
      markNotificationSeen: mockMarkNotificationSeen,
    });

    const { result } = renderHook(() => useDashboardAlerts());

    const releaseNotification = result.current.activeAlerts.find(
      (a) => String(a.id) === 'app-notification-release-testing',
    );
    expect(releaseNotification).toBeUndefined();
  });

  it('should call markNotificationSeen when dismissing app notification', () => {
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set(),
      markNotificationSeen: mockMarkNotificationSeen,
    });

    const { result } = renderHook(() => useDashboardAlerts());
    const notificationId = createAlertId('app-notification-release-testing');

    act(() => {
      result.current.handleDismissAlert(notificationId);
    });

    expect(mockMarkNotificationSeen).toHaveBeenCalledWith(notificationId);
    expect(mockDismissAlert).not.toHaveBeenCalled();
  });

  it('should include backup reminder alert when conditions are met', () => {
    mockShouldShowBackupReminder.mockReturnValue(true);
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set([
        createAlertId('app-notification-release-testing'),
      ]),
      markNotificationSeen: mockMarkNotificationSeen,
    });

    const { result } = renderHook(() => useDashboardAlerts());

    expect(result.current.activeAlerts).toHaveLength(1);
    expect(result.current.activeAlerts[0].id).toBe(
      createAlertId('backup-reminder'),
    );
    expect(result.current.activeAlerts[0].type).toBe('info');
    expect(result.current.activeAlerts[0].message).toBe(
      'alerts.backup.neverBackedUpMessage',
    );
  });

  it('should show reminderMessage when user has already backed up', () => {
    vi.mocked(useBackupTracking).mockReturnValue({
      lastBackupDate: createDateOnly('2025-01-01'),
      backupReminderDismissedUntil: undefined,
      shouldShowBackupReminder: mockShouldShowBackupReminder,
      recordBackupDate: mockRecordBackupDate,
      dismissBackupReminder: mockDismissBackupReminder,
    });
    mockShouldShowBackupReminder.mockReturnValue(true);
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set([
        createAlertId('app-notification-release-testing'),
      ]),
      markNotificationSeen: mockMarkNotificationSeen,
    });

    const { result } = renderHook(() => useDashboardAlerts());

    expect(result.current.activeAlerts).toHaveLength(1);
    expect(result.current.activeAlerts[0].message).toBe(
      'alerts.backup.reminderMessage',
    );
  });

  it('should include generated alerts', () => {
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set([
        createAlertId('app-notification-release-testing'),
      ]),
      markNotificationSeen: mockMarkNotificationSeen,
    });
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
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set([
        createAlertId('app-notification-release-testing'),
      ]),
      markNotificationSeen: mockMarkNotificationSeen,
    });
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
      dismissAlerts: mockDismissAlerts,
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
      customCategories: [],
      addCustomCategory: vi.fn(),
      updateCustomCategory: vi.fn(),
      deleteCustomCategory: vi.fn(() => ({ success: true })),
      customTemplates: [],
      addCustomTemplate: vi.fn(),
      updateCustomTemplate: vi.fn(),
      deleteCustomTemplate: vi.fn(),
    });

    const { result } = renderHook(() => useDashboardAlerts());

    expect(result.current.activeAlerts).toHaveLength(1);
    expect(result.current.activeAlerts[0].id).toBe(
      createAlertId('active-alert'),
    );
    expect(result.current.hiddenAlertsCount).toBe(1);
  });

  it('should handle dismissing regular alerts', () => {
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set([
        createAlertId('app-notification-release-testing'),
      ]),
      markNotificationSeen: mockMarkNotificationSeen,
    });
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
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set([
        createAlertId('app-notification-release-testing'),
      ]),
      markNotificationSeen: mockMarkNotificationSeen,
    });

    const { result } = renderHook(() => useDashboardAlerts());
    const backupReminderId = createAlertId('backup-reminder');

    act(() => {
      result.current.handleDismissAlert(backupReminderId);
    });

    expect(mockDismissBackupReminder).toHaveBeenCalled();
  });

  it('should do nothing when handleDismissAllAlerts is called with no active alerts', () => {
    vi.mocked(generateDashboardAlerts).mockReturnValue([]);
    mockShouldShowBackupReminder.mockReturnValue(false);
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set(
        APP_NOTIFICATIONS.map((n) => n.id).concat([
          createAlertId('app-notification-release-testing'),
        ]),
      ),
      markNotificationSeen: mockMarkNotificationSeen,
    });
    const { result } = renderHook(() => useDashboardAlerts());

    act(() => {
      result.current.handleDismissAllAlerts();
    });

    expect(mockDismissAlerts).not.toHaveBeenCalled();
    expect(mockShowNotification).not.toHaveBeenCalled();
  });

  it('should handle dismissing all alerts', () => {
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set([
        createAlertId('app-notification-release-testing'),
      ]),
      markNotificationSeen: mockMarkNotificationSeen,
    });
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

    expect(mockDismissAlerts).toHaveBeenCalledWith([alert1, alert2]);
    expect(mockDismissAlerts).toHaveBeenCalledTimes(1);
    expect(mockShowNotification).toHaveBeenCalledWith(
      'notifications.allAlertsDismissed',
      'success',
    );
    expect(mockShowNotification).toHaveBeenCalledTimes(1);
  });

  it('should handle dismiss all including backup reminder', () => {
    mockShouldShowBackupReminder.mockReturnValue(true);
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set([
        createAlertId('app-notification-release-testing'),
      ]),
      markNotificationSeen: mockMarkNotificationSeen,
    });
    const alert1 = createAlertId('alert-1');
    vi.mocked(generateDashboardAlerts).mockReturnValue([
      { id: alert1, type: 'warning' as const, message: 'Alert 1' },
    ]);

    const { result } = renderHook(() => useDashboardAlerts());

    act(() => {
      result.current.handleDismissAllAlerts();
    });

    expect(mockDismissBackupReminder).toHaveBeenCalled();
    expect(mockDismissAlerts).toHaveBeenCalledWith([alert1]);
    expect(mockShowNotification).toHaveBeenCalledWith(
      'notifications.allAlertsDismissed',
      'success',
    );
  });

  it('should handle showing all alerts', () => {
    const { result } = renderHook(() => useDashboardAlerts());

    act(() => {
      result.current.handleShowAllAlerts();
    });

    expect(mockReactivateAllAlerts).toHaveBeenCalled();
  });

  it('should include storage near limit alert when over threshold', () => {
    mockIsLocalStorageNearLimit.mockReturnValue(true);
    mockGetLocalStorageUsageMB.mockReturnValue(4.2);
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set([
        createAlertId('app-notification-release-testing'),
      ]),
      markNotificationSeen: mockMarkNotificationSeen,
    });

    const { result } = renderHook(() => useDashboardAlerts());

    const storageAlert = result.current.activeAlerts.find(
      (a) => String(a.id) === 'storage-near-limit',
    );
    expect(storageAlert).toBeDefined();
    expect(storageAlert?.type).toBe('warning');
    expect(storageAlert?.message).toBe('alerts.storage.nearLimit');
  });

  it('should dismiss storage near limit alert when dismissed', () => {
    mockIsLocalStorageNearLimit.mockReturnValue(true);
    mockGetLocalStorageUsageMB.mockReturnValue(4.2);
    vi.mocked(useSeenNotifications).mockReturnValue({
      seenNotificationIds: new Set([
        createAlertId('app-notification-release-testing'),
      ]),
      markNotificationSeen: mockMarkNotificationSeen,
    });

    const { result } = renderHook(() => useDashboardAlerts());
    const storageAlertId = createAlertId('storage-near-limit');
    expect(
      result.current.activeAlerts.some((a) => a.id === storageAlertId),
    ).toBe(true);

    act(() => {
      result.current.handleDismissAlert(storageAlertId);
    });

    expect(
      result.current.activeAlerts.some((a) => a.id === storageAlertId),
    ).toBe(false);
  });
});
