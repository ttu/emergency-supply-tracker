import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSeenNotifications } from './useSeenNotifications';
import { createAlertId } from '@/shared/types';

const STORAGE_KEY = 'emergencySupplyTracker_notifications_seen';

describe('useSeenNotifications', () => {
  let getItemSpy: ReturnType<typeof vi.spyOn>;
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    getItemSpy.mockReturnValue(null);
  });

  afterEach(() => {
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it('should return empty set when nothing is stored', () => {
    getItemSpy.mockReturnValue(null);

    const { result } = renderHook(() => useSeenNotifications());

    expect(result.current.seenNotificationIds.size).toBe(0);
  });

  it('should load seen IDs from localStorage on mount', () => {
    const id = createAlertId('app-notification-release-testing');
    getItemSpy.mockImplementation((key: string) => {
      if (key === STORAGE_KEY) return JSON.stringify([String(id)]);
      return null;
    });

    const { result } = renderHook(() => useSeenNotifications());

    expect(result.current.seenNotificationIds.has(id)).toBe(true);
    expect(result.current.seenNotificationIds.size).toBe(1);
  });

  it('should mark notification as seen and persist', () => {
    getItemSpy.mockReturnValue(null);

    const { result } = renderHook(() => useSeenNotifications());
    const id = createAlertId('app-notification-release-testing');

    expect(result.current.seenNotificationIds.has(id)).toBe(false);

    act(() => {
      result.current.markNotificationSeen(id);
    });

    expect(result.current.seenNotificationIds.has(id)).toBe(true);
    expect(setItemSpy).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify([String(id)]),
    );
  });

  it('should not duplicate id when marking same notification seen twice', () => {
    getItemSpy.mockReturnValue(null);

    const { result } = renderHook(() => useSeenNotifications());
    const id = createAlertId('app-notification-release-testing');

    act(() => {
      result.current.markNotificationSeen(id);
      result.current.markNotificationSeen(id);
    });

    expect(result.current.seenNotificationIds.size).toBe(1);
    expect(setItemSpy).toHaveBeenLastCalledWith(
      STORAGE_KEY,
      JSON.stringify([String(id)]),
    );
  });
});
