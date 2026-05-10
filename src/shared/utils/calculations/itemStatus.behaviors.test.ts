/**
 * Mutation-killing tests for itemStatus.ts
 *
 * Targets surviving mutants:
 * - L29 ArithmeticOperator: month + 1 instead of month - 1 (parseDateOnly)
 * - L79 ConditionalExpression: true (condition in getItemStatus)
 * - L79 LogicalOperator: !neverExpires || expirationDate instead of && (getItemStatus)
 */
import { describe, it, expect } from 'vitest';
import {
  getDaysUntilExpiration,
  isItemExpired,
  getItemStatus,
} from './itemStatus';
import { createDateOnly } from '@/shared/types';
import { formatLocalDate } from '@/shared/utils/date';

describe('itemStatus mutation killers', () => {
  describe('L29 ArithmeticOperator: month - 1 vs month + 1 in parseDateOnly', () => {
    it('parses January correctly (month index 0, not 2)', () => {
      // Date '2025-01-15': month=1, correct: new Date(2025, 0, 15) = Jan 15
      // Mutant (month+1): new Date(2025, 2, 15) = Mar 15 -> wrong month
      // We test by checking days until expiration for a known date
      const today = new Date();
      const todayStr = formatLocalDate(today);

      // Set expiration to today -> should be 0 days
      const result = getDaysUntilExpiration(createDateOnly(todayStr), false);
      expect(result).toBe(0);
    });

    it('correctly identifies an expired item from yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatLocalDate(yesterday);

      const expired = isItemExpired(createDateOnly(yesterdayStr), false);
      expect(expired).toBe(true);
    });

    it('correctly identifies a non-expired item for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatLocalDate(tomorrow);

      const expired = isItemExpired(createDateOnly(tomorrowStr), false);
      expect(expired).toBe(false);

      const days = getDaysUntilExpiration(createDateOnly(tomorrowStr), false);
      expect(days).toBe(1);
    });
  });

  describe('L79 ConditionalExpression true + LogicalOperator || vs &&', () => {
    it('does NOT check expiration when neverExpires is true', () => {
      // L79: `if (!neverExpires && expirationDate)`
      // Mutant `true`: always enters expiration block -> would return critical/warning
      // Mutant `||`: `!neverExpires || expirationDate` -> when neverExpires=true and expirationDate exists,
      //   !true || date = false || truthy = true -> enters block (wrong)
      // Correct: !true && date = false && date = false -> skip block

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expiredDate = createDateOnly(formatLocalDate(yesterday));

      // neverExpires=true with an expired date should still return 'ok' (not 'critical')
      const status = getItemStatus(10, 5, expiredDate, true);
      expect(status).toBe('ok');
    });

    it('checks expiration when neverExpires is false and date exists', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expiredDate = createDateOnly(formatLocalDate(yesterday));

      // neverExpires=false with expired date -> should be 'critical'
      const status = getItemStatus(10, 5, expiredDate, false);
      expect(status).toBe('critical');
    });

    it('skips expiration when no expirationDate provided', () => {
      // !neverExpires && expirationDate: !false && undefined = true && false = false
      // Mutant true: always enters -> would try to get days and fail/return wrong
      const status = getItemStatus(10, 5, undefined, false);
      expect(status).toBe('ok');
    });

    it('returns ok for markedAsEnough when not expired', () => {
      // Ensures the markedAsEnough path works after skipping expiration
      const status = getItemStatus(0, 5, undefined, false, true);
      expect(status).toBe('ok');
    });
  });
});
