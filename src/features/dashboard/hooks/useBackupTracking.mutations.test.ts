/**
 * Mutation-killing tests for useBackupTracking.ts
 *
 * These tests target specific surviving mutants identified by Stryker mutation testing.
 * Each test is designed to fail if the corresponding mutation is applied.
 */
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

describe('useBackupTracking mutation tests', () => {
  const mockGetAppData = vi.mocked(localStorage.getAppData);
  const mockSaveAppData = vi.mocked(localStorage.saveAppData);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAppData.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // L60: EqualityOperator - `now < dismissedUntil` mutated to `now <= dismissedUntil`
  // Kill: when now equals dismissedUntil exactly, the original returns true (not dismissed),
  // but the mutant with <= would return false (still dismissed)
  // ============================================================================
  describe('L60 - EqualityOperator: now < dismissedUntil boundary', () => {
    it('should show reminder when now equals the dismissedUntil date (dismissal expired)', () => {
      // Set "now" to exactly 2024-02-01 midnight local time
      const now = new Date(2024, 1, 1, 0, 0, 0, 0); // Feb 1, 2024 local
      vi.setSystemTime(now);

      // Dismissed until 2024-02-01 — so on Feb 1 the dismissal should have expired
      mockGetAppData.mockReturnValue({
        backupReminderDismissedUntil: '2024-02-01',
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      // No lastBackupDate, has items => should show reminder (dismissal expired)
      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        '2024-01-10T12:00:00.000Z',
      );
      expect(shouldShow).toBe(true);
    });
  });

  // ============================================================================
  // L60: ConditionalExpression - `now < dismissedUntil` mutated to `true`
  // Kill: when dismissed date is in the past, original should NOT return false early,
  // but the mutant always returns false
  // ============================================================================
  describe('L60 - ConditionalExpression: now < dismissedUntil always true', () => {
    it('should show reminder when dismissal date is in the past', () => {
      const now = new Date(2024, 2, 15, 12, 0, 0, 0); // Mar 15, 2024
      vi.setSystemTime(now);

      // Dismissed until 2024-02-01 — far in the past
      mockGetAppData.mockReturnValue({
        backupReminderDismissedUntil: '2024-02-01',
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      // No lastBackupDate, has items => should show
      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        '2024-01-10T12:00:00.000Z',
      );
      expect(shouldShow).toBe(true);
    });
  });

  // ============================================================================
  // L59: ArithmeticOperator - `month - 1` mutated to `month + 1` in date parsing
  // (dismissedUntil parsing: new Date(year, month - 1, day))
  // Kill: if month-1 becomes month+1, the parsed date would be 2 months off
  // ============================================================================
  describe('L59 - ArithmeticOperator: month - 1 in dismissedUntil parsing', () => {
    it('should correctly parse dismissedUntil month for dismissal check', () => {
      // Set now to Jan 20, 2024. Dismiss until Feb 1, 2024.
      // With correct parsing: dismissedUntil = Feb 1 => now < Feb 1 is false (Jan 20 < Feb 1 = true, so dismissed)
      // Wait, we want to detect month+1 vs month-1.
      // If dismissedUntil = '2024-03-01', and now = Feb 15:
      //   correct: new Date(2024, 2, 1) = Mar 1. now < Mar 1 => true => dismissed (return false)
      //   mutant:  new Date(2024, 4, 1) = May 1. now < May 1 => true => dismissed (return false) - same!
      // We need a case where the mutation changes the outcome.
      // If dismissedUntil = '2024-02-01', and now = Mar 15:
      //   correct: new Date(2024, 1, 1) = Feb 1. now < Feb 1 => false => NOT dismissed
      //   mutant:  new Date(2024, 3, 1) = Apr 1. now < Apr 1 => true => dismissed (returns false)
      const now = new Date(2024, 2, 15, 12, 0, 0, 0); // Mar 15, 2024
      vi.setSystemTime(now);

      mockGetAppData.mockReturnValue({
        backupReminderDismissedUntil: '2024-02-01',
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      // Dismissal expired (Feb 1 is past). No backup date, has items => should show.
      // Mutant would incorrectly parse as Apr 1 and still consider it dismissed.
      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        '2024-01-10T12:00:00.000Z',
      );
      expect(shouldShow).toBe(true);
    });
  });

  // ============================================================================
  // L88: EqualityOperator - `lastModifiedDateOnly <= lastBackupDateOnly` mutated to `<`
  // Kill: when lastModified date equals lastBackup date, original returns false (no reminder),
  // but mutant with < would NOT return false (would continue to threshold check)
  // ============================================================================
  describe('L88 - EqualityOperator: <= vs < for modification date check', () => {
    it('should return false when last modified date equals last backup date', () => {
      const now = new Date(2024, 5, 15, 12, 0, 0, 0); // Jun 15, 2024
      vi.setSystemTime(now);

      // Backup on Jan 15, modification also on Jan 15 (same day)
      mockGetAppData.mockReturnValue({
        lastBackupDate: '2024-01-15',
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      // Modified on same day as backup => should NOT show reminder
      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        '2024-01-15T18:00:00.000Z',
      );
      expect(shouldShow).toBe(false);
    });
  });

  // ============================================================================
  // L97: EqualityOperator - `daysSinceModification >= BACKUP_REMINDER_DAYS_THRESHOLD`
  // mutated to `>`
  // Kill: when exactly BACKUP_REMINDER_DAYS_THRESHOLD days have passed, original returns true,
  // but mutant with > returns false
  // ============================================================================
  describe('L97 - EqualityOperator: >= vs > for days threshold', () => {
    it('should show reminder when exactly BACKUP_REMINDER_DAYS_THRESHOLD days have passed', () => {
      // Set now to exactly BACKUP_REMINDER_DAYS_THRESHOLD days after modification
      const modificationDate = new Date(2024, 0, 1, 12, 0, 0, 0); // Jan 1, 2024
      const now = new Date(modificationDate);
      now.setDate(now.getDate() + BACKUP_REMINDER_DAYS_THRESHOLD);
      now.setHours(13, 0, 0, 0); // A bit after to ensure Math.floor gives exact threshold
      vi.setSystemTime(now);

      // Backup before modification
      mockGetAppData.mockReturnValue({
        lastBackupDate: '2023-12-01',
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        modificationDate.toISOString(),
      );
      expect(shouldShow).toBe(true);
    });

    it('should NOT show reminder when less than BACKUP_REMINDER_DAYS_THRESHOLD days', () => {
      const modificationDate = new Date(2024, 0, 1, 12, 0, 0, 0);
      const now = new Date(modificationDate);
      now.setDate(now.getDate() + BACKUP_REMINDER_DAYS_THRESHOLD - 1);
      now.setHours(13, 0, 0, 0);
      vi.setSystemTime(now);

      mockGetAppData.mockReturnValue({
        lastBackupDate: '2023-12-01',
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        modificationDate.toISOString(),
      );
      expect(shouldShow).toBe(false);
    });
  });

  // ============================================================================
  // L97: ConditionalExpression - `daysSinceModification >= THRESHOLD` mutated to `true`
  // Kill: when modification was recent (< threshold days), original returns false,
  // but mutant always returns true
  // ============================================================================
  describe('L97 - ConditionalExpression: threshold check always true', () => {
    it('should NOT show reminder when modification was very recent', () => {
      const now = new Date(2024, 2, 1, 12, 0, 0, 0); // Mar 1, 2024
      vi.setSystemTime(now);

      // Backup was before modification, but modification was yesterday
      mockGetAppData.mockReturnValue({
        lastBackupDate: '2024-02-01',
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      // Modified yesterday — well within threshold
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        yesterday.toISOString(),
      );
      expect(shouldShow).toBe(false);
    });
  });

  // ============================================================================
  // L94: ArithmeticOperator - `(now - lastModified) / MS_PER_DAY` mutated to
  // `(now - lastModified) * MS_PER_DAY` or `(now + lastModified) / MS_PER_DAY`
  // Kill: these mutations would produce wildly wrong daysSinceModification values
  // A test with a known number of days verifies the arithmetic is correct
  // ============================================================================
  describe('L94 - ArithmeticOperator: days calculation arithmetic', () => {
    it('should correctly calculate days since modification using subtraction and division', () => {
      // Modification was exactly 31 days ago (just over threshold of 30)
      const modDate = new Date(2024, 0, 1, 12, 0, 0, 0); // Jan 1
      const now = new Date(2024, 1, 1, 12, 0, 0, 0); // Feb 1 (31 days later)
      vi.setSystemTime(now);

      mockGetAppData.mockReturnValue({
        lastBackupDate: '2023-12-01',
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      // 31 days >= 30 threshold => should show
      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        modDate.toISOString(),
      );
      expect(shouldShow).toBe(true);
    });

    it('should return false for 29 days (just under threshold) proving correct arithmetic', () => {
      const modDate = new Date(2024, 0, 3, 12, 0, 0, 0); // Jan 3
      const now = new Date(2024, 1, 1, 12, 0, 0, 0); // Feb 1 (29 days later)
      vi.setSystemTime(now);

      mockGetAppData.mockReturnValue({
        lastBackupDate: '2023-12-01',
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      // 29 days < 30 threshold => should NOT show
      const shouldShow = result.current.shouldShowBackupReminder(
        5,
        modDate.toISOString(),
      );
      expect(shouldShow).toBe(false);
    });
  });

  // ============================================================================
  // L99, L114, L128, L138: ArrayDeclaration - dependency arrays replaced with []
  // Kill: verify that hooks update when their dependencies change
  // ============================================================================
  describe('ArrayDeclaration - dependency arrays', () => {
    // L99: shouldShowBackupReminder depends on [lastBackupDate, backupReminderDismissedUntil]
    it('L99 - shouldShowBackupReminder should update when lastBackupDate changes', () => {
      const now = new Date(2024, 5, 15, 12, 0, 0, 0);
      vi.setSystemTime(now);

      // Start with no backup date
      mockGetAppData.mockReturnValue(undefined);

      const { result, rerender } = renderHook(() => useBackupTracking());

      // No backup date + items => should show
      expect(
        result.current.shouldShowBackupReminder(5, '2024-06-15T12:00:00.000Z'),
      ).toBe(true);

      // Now record a backup (which sets lastBackupDate to today)
      act(() => {
        result.current.recordBackupDate();
      });

      // After recording backup, re-read: getAppData now returns backup date
      mockGetAppData.mockReturnValue({
        lastBackupDate: '2024-06-15',
      } as ReturnType<typeof localStorage.getAppData>);

      rerender();

      // Modified today, backup today => modified <= backup => false
      expect(
        result.current.shouldShowBackupReminder(5, '2024-06-15T08:00:00.000Z'),
      ).toBe(false);
    });

    // L114: recordBackupDate depends on [setLastBackupDate]
    it('L114 - recordBackupDate should produce correct date format', () => {
      // Test with a single-digit month and day to verify padStart
      const now = new Date(2024, 0, 5, 12, 0, 0, 0); // Jan 5, 2024
      vi.setSystemTime(now);

      mockGetAppData.mockReturnValue({
        version: CURRENT_SCHEMA_VERSION,
        lastModified: now.toISOString(),
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      act(() => {
        result.current.recordBackupDate();
      });

      expect(mockSaveAppData).toHaveBeenCalled();
      const savedData = mockSaveAppData.mock.calls[0][0];
      expect(savedData.lastBackupDate).toBe('2024-01-05');
    });

    // L128: dismissBackupReminder depends on [setBackupReminderDismissedUntil]
    it('L128 - dismissBackupReminder should set correct next month date', () => {
      const now = new Date(2024, 2, 15, 12, 0, 0, 0); // Mar 15
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
      expect(savedData.backupReminderDismissedUntil).toBe('2024-04-01');
    });

    // L138: useMemo dependency array - verify returned object updates when deps change
    it('L138 - returned object identity changes when backing data changes', () => {
      const now = new Date(2024, 5, 15, 12, 0, 0, 0);
      vi.setSystemTime(now);

      mockGetAppData.mockReturnValue(undefined);

      const { result, rerender } = renderHook(() => useBackupTracking());
      const firstResult = result.current;

      // Record a backup, which changes lastBackupDate
      act(() => {
        result.current.recordBackupDate();
      });

      // After recording, the backing data changes
      mockGetAppData.mockReturnValue({
        lastBackupDate: '2024-06-15',
      } as ReturnType<typeof localStorage.getAppData>);

      rerender();

      // If useMemo dep array is [], the returned object won't update
      // With correct deps, lastBackupDate should now be defined
      expect(result.current.lastBackupDate).toBe('2024-06-15');
      // The object identity should change since deps changed
      expect(result.current).not.toBe(firstResult);
    });
  });

  // ============================================================================
  // L111: StringLiteral - `'0'` in padStart(2, '0') mutated to `""`
  // Kill: single-digit months/days would not be zero-padded, producing e.g. "2024-1-5"
  // ============================================================================
  describe('L111 - StringLiteral: padStart with "0"', () => {
    it('should zero-pad single-digit month in recordBackupDate', () => {
      const now = new Date(2024, 0, 15, 12, 0, 0, 0); // Jan 15 (month = 0+1 = 1)
      vi.setSystemTime(now);

      mockGetAppData.mockReturnValue({
        version: CURRENT_SCHEMA_VERSION,
        lastModified: now.toISOString(),
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      act(() => {
        result.current.recordBackupDate();
      });

      const savedData = mockSaveAppData.mock.calls[0][0];
      // Must be '01' not '1' or ' 1'
      expect(savedData.lastBackupDate).toBe('2024-01-15');
      expect(savedData.lastBackupDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should zero-pad single-digit day in recordBackupDate', () => {
      const now = new Date(2024, 5, 3, 12, 0, 0, 0); // Jun 3
      vi.setSystemTime(now);

      mockGetAppData.mockReturnValue({
        version: CURRENT_SCHEMA_VERSION,
        lastModified: now.toISOString(),
      } as ReturnType<typeof localStorage.getAppData>);

      const { result } = renderHook(() => useBackupTracking());

      act(() => {
        result.current.recordBackupDate();
      });

      const savedData = mockSaveAppData.mock.calls[0][0];
      expect(savedData.lastBackupDate).toBe('2024-06-03');
      expect(savedData.lastBackupDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
