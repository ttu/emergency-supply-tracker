/**
 * Mutation-killing tests for useSeenNotifications.ts
 *
 * Targets surviving mutants:
 * - L13 MethodExpression: `raw` (filter replaced with different method)
 * - L14 ConditionalExpression: `true` (filter always returns true)
 * - L48 ArrayDeclaration: `["Stryker was here"]` (spread replaced)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSeenNotifications } from './useSeenNotifications';
import { createAlertId } from '@/shared/types';

const STORAGE_KEY = 'emergencySupplyTracker_notifications_seen';

describe('useSeenNotifications mutation killers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('L13 MethodExpression raw + L14 ConditionalExpression true: filter non-strings from stored data', () => {
    it('filters out non-string values from localStorage', () => {
      // Store data with non-string values (numbers, booleans, null)
      // If filter is replaced or condition always returns true,
      // non-strings would be included and map(createAlertId) would fail or produce wrong results
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([42, true, null, 'valid-id']),
      );

      const { result } = renderHook(() => useSeenNotifications());

      // Only the valid string should survive filtering
      expect(result.current.seenNotificationIds.size).toBe(1);
      expect(
        result.current.seenNotificationIds.has(createAlertId('valid-id')),
      ).toBe(true);
    });

    it('returns empty set when all values are non-strings', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([42, true, null, { id: 'obj' }]),
      );

      const { result } = renderHook(() => useSeenNotifications());

      expect(result.current.seenNotificationIds.size).toBe(0);
    });
  });

  describe('L48 ArrayDeclaration: markNotificationSeen appends the new id', () => {
    it('appends the correct id, not a garbage value', () => {
      const { result } = renderHook(() => useSeenNotifications());
      const id = createAlertId('test-notification-1');

      act(() => {
        result.current.markNotificationSeen(id);
      });

      // The set must contain exactly the id we added
      expect(result.current.seenNotificationIds.size).toBe(1);
      expect(result.current.seenNotificationIds.has(id)).toBe(true);

      // Verify it persisted to localStorage with the correct value
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toEqual(['test-notification-1']);
    });

    it('does not duplicate an already-seen id', () => {
      const { result } = renderHook(() => useSeenNotifications());
      const id = createAlertId('dup-id');

      act(() => {
        result.current.markNotificationSeen(id);
      });
      act(() => {
        result.current.markNotificationSeen(id);
      });

      expect(result.current.seenNotificationIds.size).toBe(1);
    });

    it('appends multiple distinct ids correctly', () => {
      const { result } = renderHook(() => useSeenNotifications());
      const id1 = createAlertId('id-1');
      const id2 = createAlertId('id-2');

      act(() => {
        result.current.markNotificationSeen(id1);
      });
      act(() => {
        result.current.markNotificationSeen(id2);
      });

      expect(result.current.seenNotificationIds.size).toBe(2);
      expect(result.current.seenNotificationIds.has(id1)).toBe(true);
      expect(result.current.seenNotificationIds.has(id2)).toBe(true);
    });
  });
});
