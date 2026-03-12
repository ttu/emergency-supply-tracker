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
import { useSeenNotifications } from './useSeenNotifications';

const mockDismissAlert = vi.fn();
const mockDismissAlerts = vi.fn();
const mockReactivateAllAlerts = vi.fn();

function createInventoryMock(overrides = {}) {
  return {
    items: [],
    categories: [],
    addItem: vi.fn(),
    addItems: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    deleteItems: vi.fn(),
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
    ...overrides,
  };
}

function defaultMocks() {
  vi.mocked(useInventory).mockReturnValue(createInventoryMock());

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
  mockShouldShowBackupReminder.mockReturnValue(false);
  vi.mocked(getAppData).mockReturnValue(undefined);
  vi.mocked(useSeenNotifications).mockReturnValue({
    seenNotificationIds: new Set(APP_NOTIFICATIONS.map((n) => n.id)),
    markNotificationSeen: mockMarkNotificationSeen,
  });
  mockIsLocalStorageNearLimit.mockReturnValue(false);
  mockGetLocalStorageUsageMB.mockReturnValue(0);
}

describe('useDashboardAlerts - mutation killing tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks();
  });

  describe('L65: backupReminderDismissed conditional', () => {
    it('should remove backup reminder from activeAlerts after dismissing it', () => {
      // Kills L65 (ConditionalExpression false) and L147 (BooleanLiteral false for setBackupReminderDismissed)
      // Setup: backup reminder is showing
      mockShouldShowBackupReminder.mockReturnValue(true);

      const { result } = renderHook(() => useDashboardAlerts());

      const backupReminderId = createAlertId('backup-reminder');
      // Verify backup reminder is present
      expect(
        result.current.activeAlerts.some((a) => a.id === backupReminderId),
      ).toBe(true);

      // Dismiss it
      act(() => {
        result.current.handleDismissAlert(backupReminderId);
      });

      // After dismissal, backup reminder should be gone
      // If the mutant replaces setBackupReminderDismissed(true) with false,
      // or if the conditional check is replaced with false, the alert won't disappear
      expect(
        result.current.activeAlerts.some((a) => a.id === backupReminderId),
      ).toBe(false);
    });
  });

  describe('L96: storage alert object literal', () => {
    it('should return a properly formed storage alert with all fields', () => {
      // Kills L96 (ObjectLiteral {}) - ensures the return object has real values
      mockIsLocalStorageNearLimit.mockReturnValue(true);
      mockGetLocalStorageUsageMB.mockReturnValue(4.5);

      const { result } = renderHook(() => useDashboardAlerts());

      const storageAlert = result.current.activeAlerts.find(
        (a) => String(a.id) === 'storage-near-limit',
      );
      expect(storageAlert).toBeDefined();
      expect(storageAlert!.id).toBe(createAlertId('storage-near-limit'));
      expect(storageAlert!.type).toBe('warning');
      expect(storageAlert!.message).toBe('alerts.storage.nearLimit');
    });
  });

  describe('L149: showNotification string literal', () => {
    it('should show notification with correct non-empty message when backup reminder dismissed', () => {
      // Kills L149 (StringLiteral "") - verifies the notification message is the t() key, not empty
      mockShouldShowBackupReminder.mockReturnValue(true);

      const { result } = renderHook(() => useDashboardAlerts());

      act(() => {
        result.current.handleDismissAlert(createAlertId('backup-reminder'));
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        'notifications.backup.reminderDismissed',
        'success',
      );
      // Ensure the message is NOT empty
      const calledMessage = mockShowNotification.mock.calls[0][0];
      expect(calledMessage).not.toBe('');
      expect(calledMessage.length).toBeGreaterThan(0);
    });
  });

  describe('L167: setBackupReminderDismissed in dismissAll', () => {
    it('should hide backup reminder after dismissAll and re-render', () => {
      // Kills L167 (BooleanLiteral false for setBackupReminderDismissed in dismissAll)
      mockShouldShowBackupReminder.mockReturnValue(true);

      const { result } = renderHook(() => useDashboardAlerts());
      const backupReminderId = createAlertId('backup-reminder');

      // Verify backup reminder is present
      expect(
        result.current.activeAlerts.some((a) => a.id === backupReminderId),
      ).toBe(true);

      act(() => {
        result.current.handleDismissAllAlerts();
      });

      // After dismissAll, backup reminder should be gone from active alerts
      expect(
        result.current.activeAlerts.some((a) => a.id === backupReminderId),
      ).toBe(false);
    });
  });

  describe('L168: NOTIFICATION_IDS.has in dismissAll', () => {
    it('should call markNotificationSeen for notification alerts during dismissAll', () => {
      // Kills L168 (ConditionalExpression false) - if condition is false, markNotificationSeen won't be called
      vi.mocked(useSeenNotifications).mockReturnValue({
        seenNotificationIds: new Set(), // notifications NOT seen
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

      // Notification should be marked as seen
      const notificationId = APP_NOTIFICATIONS[0].id;
      expect(mockMarkNotificationSeen).toHaveBeenCalledWith(notificationId);
      // The inventory alert should also be dismissed
      expect(mockDismissAlerts).toHaveBeenCalledWith([alert1]);
    });

    it('should NOT pass notification IDs to dismissAlerts when dismissAll is called', () => {
      // Further kills L168 - ensures notification IDs don't leak into inventoryAlertIds
      vi.mocked(useSeenNotifications).mockReturnValue({
        seenNotificationIds: new Set(),
        markNotificationSeen: mockMarkNotificationSeen,
      });
      vi.mocked(generateDashboardAlerts).mockReturnValue([]);

      const { result } = renderHook(() => useDashboardAlerts());

      act(() => {
        result.current.handleDismissAllAlerts();
      });

      // If the notification condition is false (mutant), the notification ID
      // would be pushed to inventoryAlertIds and passed to dismissAlerts
      const notificationId = APP_NOTIFICATIONS[0].id;
      if (mockDismissAlerts.mock.calls.length > 0) {
        const passedIds = mockDismissAlerts.mock.calls[0][0];
        expect(passedIds).not.toContain(notificationId);
      }
      expect(mockMarkNotificationSeen).toHaveBeenCalledWith(notificationId);
    });
  });

  describe('L174: inventoryAlertIds.length > 0 check', () => {
    it('should not call dismissAlerts when only backup and notification alerts are active', () => {
      // Kills L174 (ConditionalExpression true and EqualityOperator >= 0)
      // When there are no inventory alerts, dismissAlerts should NOT be called
      mockShouldShowBackupReminder.mockReturnValue(true);
      vi.mocked(useSeenNotifications).mockReturnValue({
        seenNotificationIds: new Set(APP_NOTIFICATIONS.map((n) => n.id)),
        markNotificationSeen: mockMarkNotificationSeen,
      });
      vi.mocked(generateDashboardAlerts).mockReturnValue([]);

      const { result } = renderHook(() => useDashboardAlerts());

      act(() => {
        result.current.handleDismissAllAlerts();
      });

      // No inventory alerts to dismiss, so dismissAlerts should not be called
      // Mutant L174 (true) would call dismissAlerts([]) always
      // Mutant L174 (>= 0) would call dismissAlerts([]) since 0 >= 0 is true
      expect(mockDismissAlerts).not.toHaveBeenCalled();
    });
  });

  describe('L59: useMemo dependency array for allAlerts', () => {
    it('should update allAlerts when generateDashboardAlerts returns new values on rerender', () => {
      // Kills L59 ArrayDeclaration [] - if deps are [], allAlerts won't update
      const alert1 = {
        id: createAlertId('alert-1'),
        type: 'warning' as const,
        message: 'Alert 1',
      };
      vi.mocked(generateDashboardAlerts).mockReturnValue([alert1]);

      const { result, rerender } = renderHook(() => useDashboardAlerts());
      expect(result.current.activeAlerts).toContainEqual(alert1);

      // Change what generateDashboardAlerts returns
      const alert2 = {
        id: createAlertId('alert-2'),
        type: 'critical' as const,
        message: 'Alert 2',
      };
      vi.mocked(generateDashboardAlerts).mockReturnValue([alert2]);

      // Trigger rerender by changing items (a dependency of useMemo L59)
      vi.mocked(useInventory).mockReturnValue(
        createInventoryMock({
          items: [{ id: 'item-1', name: 'Water' }],
        }),
      );
      rerender();

      expect(result.current.activeAlerts).toContainEqual(alert2);
      expect(result.current.activeAlerts).not.toContainEqual(alert1);
    });
  });

  describe('L127: useMemo dependency array for dismissedSet', () => {
    it('should update dismissed filtering when dismissedAlertIds changes', () => {
      // Kills L127 ArrayDeclaration [] - if deps are [], dismissedSet won't update
      const alertId = createAlertId('test-alert');
      vi.mocked(generateDashboardAlerts).mockReturnValue([
        { id: alertId, type: 'warning' as const, message: 'Test' },
      ]);

      const { result, rerender } = renderHook(() => useDashboardAlerts());
      expect(result.current.activeAlerts).toHaveLength(1);

      // Now simulate that the alert was dismissed
      vi.mocked(useInventory).mockReturnValue(
        createInventoryMock({ dismissedAlertIds: [alertId] }),
      );
      rerender();

      // The alert should now be filtered out
      expect(result.current.activeAlerts.some((a) => a.id === alertId)).toBe(
        false,
      );
      expect(result.current.hiddenAlertsCount).toBe(1);
    });
  });

  describe('L138: useMemo dependency array for hiddenAlertsCount', () => {
    it('should update hiddenAlertsCount when dismissed alerts change', () => {
      // Kills L138 ArrayDeclaration [] - if deps are [], hiddenAlertsCount won't update
      const alertId1 = createAlertId('alert-1');
      const alertId2 = createAlertId('alert-2');
      vi.mocked(generateDashboardAlerts).mockReturnValue([
        { id: alertId1, type: 'warning' as const, message: 'Alert 1' },
        { id: alertId2, type: 'warning' as const, message: 'Alert 2' },
      ]);

      vi.mocked(useInventory).mockReturnValue(
        createInventoryMock({ dismissedAlertIds: [alertId1] }),
      );

      const { result, rerender } = renderHook(() => useDashboardAlerts());
      expect(result.current.hiddenAlertsCount).toBe(1);

      // Dismiss second alert too
      vi.mocked(useInventory).mockReturnValue(
        createInventoryMock({ dismissedAlertIds: [alertId1, alertId2] }),
      );
      rerender();

      expect(result.current.hiddenAlertsCount).toBe(2);
    });
  });

  describe('L158: useMemo dependency array for handleDismissAlert', () => {
    it('should use current dismissAlert function after inventory context changes', () => {
      // Kills L158 ArrayDeclaration [] - if deps are [], handleDismissAlert uses stale closure
      const alertId = createAlertId('test-alert');
      vi.mocked(generateDashboardAlerts).mockReturnValue([
        { id: alertId, type: 'warning' as const, message: 'Test' },
      ]);

      const dismissAlert1 = vi.fn();
      vi.mocked(useInventory).mockReturnValue(
        createInventoryMock({ dismissAlert: dismissAlert1 }),
      );

      const { result, rerender } = renderHook(() => useDashboardAlerts());

      // Switch to a new dismissAlert function
      const dismissAlert2 = vi.fn();
      vi.mocked(useInventory).mockReturnValue(
        createInventoryMock({ dismissAlert: dismissAlert2 }),
      );
      rerender();

      act(() => {
        result.current.handleDismissAlert(alertId);
      });

      // Should use the NEW dismissAlert, not the old one
      expect(dismissAlert2).toHaveBeenCalledWith(alertId);
      expect(dismissAlert1).not.toHaveBeenCalled();
    });
  });

  describe('L178: useMemo dependency array for handleDismissAllAlerts', () => {
    it('should use current activeAlerts when dismissing all after rerender', () => {
      // Kills L178 ArrayDeclaration [] - if deps are [], handleDismissAllAlerts uses stale closure
      const alertId1 = createAlertId('alert-1');
      vi.mocked(generateDashboardAlerts).mockReturnValue([
        { id: alertId1, type: 'warning' as const, message: 'Alert 1' },
      ]);

      const { result, rerender } = renderHook(() => useDashboardAlerts());

      // Add a second alert
      const alertId2 = createAlertId('alert-2');
      vi.mocked(generateDashboardAlerts).mockReturnValue([
        { id: alertId1, type: 'warning' as const, message: 'Alert 1' },
        { id: alertId2, type: 'critical' as const, message: 'Alert 2' },
      ]);
      // Trigger dependency change for allAlerts memo
      vi.mocked(useInventory).mockReturnValue(
        createInventoryMock({
          items: [{ id: 'item-1', name: 'Water' }],
        }),
      );
      rerender();

      act(() => {
        result.current.handleDismissAllAlerts();
      });

      // Should include BOTH alerts, not just the original one
      expect(mockDismissAlerts).toHaveBeenCalledWith([alertId1, alertId2]);
    });
  });

  describe('additional sixth ArrayDeclaration mutant', () => {
    it('should update combinedAlerts when component alerts change', () => {
      // This covers any remaining ArrayDeclaration mutant (e.g., combinedAlerts deps at L121)
      mockIsLocalStorageNearLimit.mockReturnValue(true);
      mockGetLocalStorageUsageMB.mockReturnValue(4.5);

      const { result, rerender } = renderHook(() => useDashboardAlerts());

      // Storage alert should be present
      const storageAlertId = createAlertId('storage-near-limit');
      expect(
        result.current.activeAlerts.some((a) => a.id === storageAlertId),
      ).toBe(true);

      // Now add inventory alerts too
      const alertId = createAlertId('new-alert');
      vi.mocked(generateDashboardAlerts).mockReturnValue([
        { id: alertId, type: 'warning' as const, message: 'New Alert' },
      ]);
      vi.mocked(useInventory).mockReturnValue(
        createInventoryMock({
          items: [{ id: 'item-1', name: 'Water' }],
        }),
      );
      rerender();

      // Both should be present
      expect(
        result.current.activeAlerts.some((a) => a.id === storageAlertId),
      ).toBe(true);
      expect(result.current.activeAlerts.some((a) => a.id === alertId)).toBe(
        true,
      );
    });
  });

  describe('alert ordering in combinedAlerts', () => {
    it('should order: storage first, then backup, then notifications, then inventory', () => {
      // This also helps kill mutants by verifying the spread order matters
      mockIsLocalStorageNearLimit.mockReturnValue(true);
      mockGetLocalStorageUsageMB.mockReturnValue(4.5);
      mockShouldShowBackupReminder.mockReturnValue(true);
      vi.mocked(useSeenNotifications).mockReturnValue({
        seenNotificationIds: new Set(),
        markNotificationSeen: mockMarkNotificationSeen,
      });
      const inventoryAlert = {
        id: createAlertId('inv-alert'),
        type: 'warning' as const,
        message: 'Inventory Alert',
      };
      vi.mocked(generateDashboardAlerts).mockReturnValue([inventoryAlert]);

      const { result } = renderHook(() => useDashboardAlerts());

      const alerts = result.current.activeAlerts;
      expect(alerts.length).toBeGreaterThanOrEqual(4);

      // Verify order
      const storageIdx = alerts.findIndex(
        (a) => String(a.id) === 'storage-near-limit',
      );
      const backupIdx = alerts.findIndex(
        (a) => String(a.id) === 'backup-reminder',
      );
      const notificationIdx = alerts.findIndex(
        (a) => String(a.id) === 'app-notification-release-testing',
      );
      const inventoryIdx = alerts.findIndex(
        (a) => String(a.id) === 'inv-alert',
      );

      expect(storageIdx).toBeLessThan(backupIdx);
      expect(backupIdx).toBeLessThan(notificationIdx);
      expect(notificationIdx).toBeLessThan(inventoryIdx);
    });
  });
});
