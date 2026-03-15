/**
 * Mutation-killing tests for backupReminder.ts
 *
 * Targets surviving mutants:
 * - L31 EqualityOperator: now <= dismissedUntil instead of now < dismissedUntil
 * - L98 StringLiteral: "" instead of '0' in padStart for day formatting
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shouldShowBackupReminder, recordBackupDate } from './backupReminder';
import {
  createDateOnly,
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import { saveAppData, getAppData } from '@/shared/utils/storage/localStorage';
import {
  createMockAppData,
  createMockInventoryItem,
} from '@/shared/utils/test/factories';

describe('backupReminder mutation killers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('L31 EqualityOperator: now < vs now <= dismissedUntil', () => {
    it('shows reminder when now equals dismissedUntil (kills <= mutant)', () => {
      // Set time to Jan 15 2025
      vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));

      const appData = createMockAppData({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Test',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            itemType: createProductTemplateId('canned-vegetables'),
            unit: 'pieces',
          }),
        ],
        // Dismissed until today (Jan 15) - with `<` this means dismissal has expired
        backupReminderDismissedUntil: createDateOnly('2025-01-15'),
        lastBackupDate: undefined,
        lastModified: new Date(2025, 0, 1).toISOString(), // Modified 14 days ago
      });

      // Original: now < dismissedUntil -> false (15 < 15 = false) -> continues checking
      // Mutant: now <= dismissedUntil -> true (15 <= 15 = true) -> returns false (still dismissed)
      const result = shouldShowBackupReminder(appData);
      expect(result).toBe(true);
    });

    it('hides reminder when now is before dismissedUntil', () => {
      vi.setSystemTime(new Date(2025, 0, 14, 12, 0, 0));

      const appData = createMockAppData({
        items: [
          createMockInventoryItem({
            id: createItemId('item-1'),
            name: 'Test',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            itemType: createProductTemplateId('canned-vegetables'),
            unit: 'pieces',
          }),
        ],
        backupReminderDismissedUntil: createDateOnly('2025-01-15'),
        lastBackupDate: undefined,
        lastModified: new Date(2025, 0, 1).toISOString(),
      });

      const result = shouldShowBackupReminder(appData);
      expect(result).toBe(false);
    });
  });

  describe('L98 StringLiteral: "" vs "0" in padStart for recordBackupDate', () => {
    it('records backup date with correct zero-padded format', () => {
      // Jan 5 2025 - single-digit day
      vi.setSystemTime(new Date(2025, 0, 5, 12, 0, 0));

      // Save initial app data so recordBackupDate can read it
      const appData = createMockAppData();
      saveAppData(appData);

      recordBackupDate();

      const stored = getAppData();
      // Mutant replaces '0' with '' in padStart -> "2025-01- 5" or "2025- 1- 5"
      expect(stored?.lastBackupDate).toBe('2025-01-05');
    });

    it('records backup date correctly for single-digit month', () => {
      // Mar 15 2025
      vi.setSystemTime(new Date(2025, 2, 15, 12, 0, 0));

      const appData = createMockAppData();
      saveAppData(appData);

      recordBackupDate();

      const stored = getAppData();
      expect(stored?.lastBackupDate).toBe('2025-03-15');
    });
  });
});
