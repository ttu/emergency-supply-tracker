import { describe, it, expect } from 'vitest';
import {
  getItemStatus,
  getDaysUntilExpiration,
  isItemExpired,
  getStatusFromPercentage,
  getStatusFromScore,
  getStatusVariant,
} from './status';
import { createDateOnly } from '@/shared/types';

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
    const yesterdayDateOnly = createDateOnly(
      yesterday.toISOString().split('T')[0],
    );
    expect(getItemStatus(10, 10, yesterdayDateOnly)).toBe('critical');
  });

  it('returns warning when expiring within 30 days', () => {
    const in20Days = new Date();
    in20Days.setDate(in20Days.getDate() + 20);
    const in20DaysDateOnly = createDateOnly(
      in20Days.toISOString().split('T')[0],
    );
    expect(getItemStatus(10, 10, in20DaysDateOnly)).toBe('warning');
  });

  it('ignores expiration when neverExpires is true', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateOnly = createDateOnly(
      yesterday.toISOString().split('T')[0],
    );
    expect(getItemStatus(10, 10, yesterdayDateOnly, true)).toBe('ok');
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
    const futureDateOnly = createDateOnly(future.toISOString().split('T')[0]);
    expect(getDaysUntilExpiration(futureDateOnly, false)).toBe(10);
  });

  it('returns negative days for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const pastDateOnly = createDateOnly(past.toISOString().split('T')[0]);
    expect(getDaysUntilExpiration(pastDateOnly, false)).toBe(-5);
  });

  it('returns 0 for today', () => {
    const today = new Date();
    const todayDateOnly = createDateOnly(today.toISOString().split('T')[0]);
    expect(getDaysUntilExpiration(todayDateOnly, false)).toBe(0);
  });

  it('handles date-only strings correctly regardless of timezone', () => {
    // Test with explicit date-only string to ensure timezone doesn't affect comparison
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateOnly = createDateOnly(
      tomorrow.toISOString().split('T')[0],
    );
    expect(getDaysUntilExpiration(tomorrowDateOnly, false)).toBe(1);
  });
});

describe('isItemExpired', () => {
  it('returns false when neverExpires is true', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const pastDateOnly = createDateOnly(past.toISOString().split('T')[0]);
    expect(isItemExpired(pastDateOnly, true)).toBe(false);
  });

  it('returns false when no expiration date', () => {
    expect(isItemExpired(undefined, false)).toBe(false);
  });

  it('returns true for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const pastDateOnly = createDateOnly(past.toISOString().split('T')[0]);
    expect(isItemExpired(pastDateOnly, false)).toBe(true);
  });

  it('returns false for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const futureDateOnly = createDateOnly(future.toISOString().split('T')[0]);
    expect(isItemExpired(futureDateOnly, false)).toBe(false);
  });

  it('returns false for today (not expired yet)', () => {
    const today = new Date();
    const todayDateOnly = createDateOnly(today.toISOString().split('T')[0]);
    expect(isItemExpired(todayDateOnly, false)).toBe(false);
  });

  it('handles date-only strings correctly regardless of timezone', () => {
    // Test with explicit date-only string to ensure timezone doesn't affect comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateOnly = createDateOnly(
      yesterday.toISOString().split('T')[0],
    );
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
