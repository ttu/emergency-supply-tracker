import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackupTracking } from './useBackupTracking';
import * as localStorage from '@/shared/utils/storage/localStorage';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';
import { BACKUP_REMINDER_DAYS_THRESHOLD } from '@/shared/utils/constants';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage', () => ({
  getAppData: vi.fn(),
  saveAppData: vi.fn(),
  createDefaultAppData: vi.fn(() => ({
    version: CURRENT_SCHEMA_VERSION,
    household: {
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    },
    settings: {
      language: 'en',
      theme: 'light',
      highContrast: false,
      advancedFeatures: {},
    },
    items: [],
    customCategories: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    lastModified: new Date().toISOString(),
  })),
}));

describe('useBackupTracking', () => {
  const mockGetAppData = vi.mocked(localStorage.getAppData);
  const mockSaveAppData = vi.mocked(localStorage.saveAppData);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAppData.mockReturnValue(undefined);
  });

  afterEach(() => {
    // Restore real Date
    vi.useRealTimers();
  });

  describe('shouldShowBackupReminder', () => {
    it('should return false when there are no items', () => {
      const { result } = renderHook(() => useBackupTracking());

      const shouldShow = result.current.shouldShowBackupReminder(
        0,
        new Date().toISOString(),
      );
      expect(shouldShow).toBe(false);
    });

    it('should return true when never backed up and has items', () => {
      // No lastBackupDate stored
      mockGetAppData.mockReturnValue(undefined);

      const { result } = renderHook(() => useBackupTracking());

      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        new Date().toISOString(),
      );
      expect(shouldShow).toBe(true);
    });

    it('should return false when data was not modified after last backup', () => {
      const backupDate = '2024-01-15';
      const lastModified = '2024-01-14T12:00:00.000Z'; // Before backup

      mockGetAppData.mockReturnValue({
        lastBackupDate: backupDate,
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        lastModified,
      );
      expect(shouldShow).toBe(false);
    });

    it('should return false when reminder is dismissed until future date', () => {
      // Set up a future dismissal date
      const now = new Date('2024-01-15T12:00:00.000Z');
      vi.setSystemTime(now);

      mockGetAppData.mockReturnValue({
        backupReminderDismissedUntil: '2024-02-01', // Dismissed until Feb 1
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        '2024-01-10T12:00:00.000Z',
      );
      expect(shouldShow).toBe(false);
    });

    it('should return true when modification threshold is exceeded', () => {
      const now = new Date('2024-03-01T12:00:00.000Z');
      vi.setSystemTime(now);

      // Last backup was before modification
      mockGetAppData.mockReturnValue({
        lastBackupDate: '2024-01-01',
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      // Last modified more than BACKUP_REMINDER_DAYS_THRESHOLD ago
      const oldModified = new Date(now);
      oldModified.setDate(
        oldModified.getDate() - BACKUP_REMINDER_DAYS_THRESHOLD - 1,
      );

      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        oldModified.toISOString(),
      );
      expect(shouldShow).toBe(true);
    });
  });

  describe('recordBackupDate', () => {
    it('should save current date as last backup date', async () => {
      const now = new Date('2024-06-15T12:00:00.000Z');
      vi.setSystemTime(now);

      mockGetAppData.mockReturnValue({
        version: CURRENT_SCHEMA_VERSION,
        lastModified: now.toISOString(),
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      act(() => {
        result.current.recordBackupDate();
      });

      // The hook uses useLocalStorageSync which saves automatically
      expect(mockSaveAppData).toHaveBeenCalled();
      const savedData = mockSaveAppData.mock.calls[0][0];
      expect(savedData.lastBackupDate).toBe('2024-06-15');
    });
  });

  describe('dismissBackupReminder', () => {
    it('should dismiss until first day of next month', async () => {
      const now = new Date('2024-06-15T12:00:00.000Z');
      vi.setSystemTime(now);

      mockGetAppData.mockReturnValue({
        version: CURRENT_SCHEMA_VERSION,
        lastModified: now.toISOString(),
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      act(() => {
        result.current.dismissBackupReminder();
      });

      expect(mockSaveAppData).toHaveBeenCalled();
      const savedData = mockSaveAppData.mock.calls[0][0];
      expect(savedData.backupReminderDismissedUntil).toBe('2024-07-01');
    });

    it('should handle year rollover correctly', async () => {
      const now = new Date('2024-12-15T12:00:00.000Z');
      vi.setSystemTime(now);

      mockGetAppData.mockReturnValue({
        version: CURRENT_SCHEMA_VERSION,
        lastModified: now.toISOString(),
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      act(() => {
        result.current.dismissBackupReminder();
      });

      expect(mockSaveAppData).toHaveBeenCalled();
      const savedData = mockSaveAppData.mock.calls[0][0];
      expect(savedData.backupReminderDismissedUntil).toBe('2025-01-01');
    });
  });
});
