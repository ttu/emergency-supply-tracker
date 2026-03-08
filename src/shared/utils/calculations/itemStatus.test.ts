import { describe, it, expect } from 'vitest';
import {
  getItemStatus,
  getDaysUntilExpiration,
  isItemExpired,
  getStatusFromPercentage,
  getStatusFromScore,
  getStatusVariant,
} from './itemStatus';
import { createDateOnly } from '@/shared/types';
import { toLocalDateString } from '@/shared/utils/test/date-helpers';

describe('getItemStatus', () => {
  it('returns critical when quantity is 0', () => {
    expect(getItemStatus(0, 10)).toBe('critical');
  });

  it('returns warning when quantity < 50% of recommended', () => {
    expect(getItemStatus(4, 10)).toBe('warning');
  });

  it('returns ok when quantity >= recommended', () => {
    expect(getItemStatus(10, 10)).toBe('ok');
  });

  it('returns critical when expired', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateOnly = createDateOnly(toLocalDateString(yesterday));
    expect(getItemStatus(10, 10, yesterdayDateOnly)).toBe('critical');
  });

  it('returns warning when expiring within 30 days', () => {
    const in20Days = new Date();
    in20Days.setDate(in20Days.getDate() + 20);
    const in20DaysDateOnly = createDateOnly(toLocalDateString(in20Days));
    expect(getItemStatus(10, 10, in20DaysDateOnly)).toBe('warning');
  });

  it('ignores expiration when neverExpires is true', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateOnly = createDateOnly(toLocalDateString(yesterday));
    expect(getItemStatus(10, 10, yesterdayDateOnly, true)).toBe('ok');
  });

  // Boundary: exactly at expiration threshold (30 days) — should be warning
  it('returns warning when expiring in exactly 30 days', () => {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysDateOnly = createDateOnly(toLocalDateString(in30Days));
    expect(getItemStatus(10, 10, in30DaysDateOnly)).toBe('warning');
  });

  // Boundary: 31 days out — should be ok (past threshold)
  it('returns ok when expiring in 31 days', () => {
    const in31Days = new Date();
    in31Days.setDate(in31Days.getDate() + 31);
    const in31DaysDateOnly = createDateOnly(toLocalDateString(in31Days));
    expect(getItemStatus(10, 10, in31DaysDateOnly)).toBe('ok');
  });

  // Boundary: exactly 0 days until expiration (today) — should be warning (not expired yet)
  it('returns warning when expiring today (0 days)', () => {
    const today = new Date();
    const todayDateOnly = createDateOnly(toLocalDateString(today));
    expect(getItemStatus(10, 10, todayDateOnly)).toBe('warning');
  });

  // Boundary: quantity exactly at 50% threshold
  it('returns ok when quantity is exactly at 50% of recommended', () => {
    // LOW_QUANTITY_WARNING_RATIO = 0.5, so 5 < 10 * 0.5 is false
    expect(getItemStatus(5, 10)).toBe('ok');
  });

  // Boundary: quantity just below 50% threshold
  it('returns warning when quantity is just below 50% of recommended', () => {
    expect(getItemStatus(4, 10)).toBe('warning');
  });

  // neverExpires=false but no expirationDate — checks quantity only
  it('checks quantity when neverExpires is false but no expirationDate', () => {
    expect(getItemStatus(0, 10, undefined, false)).toBe('critical');
    expect(getItemStatus(10, 10, undefined, false)).toBe('ok');
  });

  // markedAsEnough — should return ok even with low quantity (but not expired)
  it('returns ok when markedAsEnough even with low quantity', () => {
    expect(getItemStatus(1, 100, undefined, false, true)).toBe('ok');
  });

  it('returns ok when markedAsEnough even with zero quantity', () => {
    expect(getItemStatus(0, 100, undefined, false, true)).toBe('ok');
  });

  // markedAsEnough does NOT override expired status
  it('returns critical when expired even if markedAsEnough', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateOnly = createDateOnly(toLocalDateString(yesterday));
    expect(getItemStatus(10, 10, yesterdayDateOnly, false, true)).toBe(
      'critical',
    );
  });

  // markedAsEnough does NOT override expiring soon
  it('returns warning when expiring soon even if markedAsEnough', () => {
    const in20Days = new Date();
    in20Days.setDate(in20Days.getDate() + 20);
    const in20DaysDateOnly = createDateOnly(toLocalDateString(in20Days));
    expect(getItemStatus(10, 10, in20DaysDateOnly, false, true)).toBe(
      'warning',
    );
  });
});

describe('getDaysUntilExpiration', () => {
  it('returns undefined when neverExpires is true', () => {
    expect(
      getDaysUntilExpiration(createDateOnly('2025-12-31'), true),
    ).toBeUndefined();
  });

  it('returns undefined when no expiration date', () => {
    expect(getDaysUntilExpiration(undefined, false)).toBeUndefined();
  });

  it('returns positive days for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const futureDateOnly = createDateOnly(toLocalDateString(future));
    expect(getDaysUntilExpiration(futureDateOnly, false)).toBe(10);
  });

  it('returns negative days for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const pastDateOnly = createDateOnly(toLocalDateString(past));
    expect(getDaysUntilExpiration(pastDateOnly, false)).toBe(-5);
  });

  it('returns 0 for today', () => {
    const today = new Date();
    const todayDateOnly = createDateOnly(toLocalDateString(today));
    expect(getDaysUntilExpiration(todayDateOnly, false)).toBe(0);
  });

  it('handles date-only strings correctly regardless of timezone', () => {
    // Test with explicit date-only string to ensure timezone doesn't affect comparison
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateOnly = createDateOnly(toLocalDateString(tomorrow));
    expect(getDaysUntilExpiration(tomorrowDateOnly, false)).toBe(1);
  });
});

describe('isItemExpired', () => {
  it('returns false when neverExpires is true', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const pastDateOnly = createDateOnly(toLocalDateString(past));
    expect(isItemExpired(pastDateOnly, true)).toBe(false);
  });

  it('returns false when no expiration date', () => {
    expect(isItemExpired(undefined, false)).toBe(false);
  });

  it('returns true for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const pastDateOnly = createDateOnly(toLocalDateString(past));
    expect(isItemExpired(pastDateOnly, false)).toBe(true);
  });

  it('returns false for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const futureDateOnly = createDateOnly(toLocalDateString(future));
    expect(isItemExpired(futureDateOnly, false)).toBe(false);
  });

  it('returns false for today (not expired yet)', () => {
    const today = new Date();
    const todayDateOnly = createDateOnly(toLocalDateString(today));
    expect(isItemExpired(todayDateOnly, false)).toBe(false);
  });

  it('handles date-only strings correctly regardless of timezone', () => {
    // Test with explicit date-only string to ensure timezone doesn't affect comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateOnly = createDateOnly(toLocalDateString(yesterday));
    expect(isItemExpired(yesterdayDateOnly, false)).toBe(true);
  });
});

describe('getStatusFromPercentage', () => {
  it('returns critical when percentage < 30', () => {
    expect(getStatusFromPercentage(0)).toBe('critical');
    expect(getStatusFromPercentage(29)).toBe('critical');
  });

  it('returns warning when percentage >= 30 and < 70', () => {
    expect(getStatusFromPercentage(30)).toBe('warning');
    expect(getStatusFromPercentage(69)).toBe('warning');
  });

  it('returns ok when percentage >= 70', () => {
    expect(getStatusFromPercentage(70)).toBe('ok');
    expect(getStatusFromPercentage(100)).toBe('ok');
  });
});

describe('getStatusFromScore', () => {
  it('returns critical when score < 50', () => {
    expect(getStatusFromScore(0)).toBe('critical');
    expect(getStatusFromScore(49)).toBe('critical');
  });

  it('returns warning when score >= 50 and < 80', () => {
    expect(getStatusFromScore(50)).toBe('warning');
    expect(getStatusFromScore(79)).toBe('warning');
  });

  it('returns ok when score >= 80', () => {
    expect(getStatusFromScore(80)).toBe('ok');
    expect(getStatusFromScore(100)).toBe('ok');
  });
});

describe('getStatusVariant', () => {
  it('returns success for ok status', () => {
    expect(getStatusVariant('ok')).toBe('success');
  });

  it('returns warning for warning status', () => {
    expect(getStatusVariant('warning')).toBe('warning');
  });

  it('returns danger for critical status', () => {
    expect(getStatusVariant('critical')).toBe('danger');
  });
});
