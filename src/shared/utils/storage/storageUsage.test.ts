import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getLocalStorageUsageBytes,
  getLocalStorageUsageMB,
  isLocalStorageNearLimit,
  LOCAL_STORAGE_LIMIT_BYTES,
  STORAGE_WARNING_RATIO,
} from './storageUsage';

describe('storageUsage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getLocalStorageUsageBytes', () => {
    it('returns 0 when localStorage is empty', () => {
      expect(getLocalStorageUsageBytes()).toBe(0);
    });

    it('counts key and value length (UTF-16, 2 bytes per char)', () => {
      localStorage.setItem('ab', 'cd');
      expect(getLocalStorageUsageBytes()).toBe((2 + 2) * 2);
    });

    it('sums all keys and values', () => {
      localStorage.setItem('k1', 'v1');
      localStorage.setItem('k2', 'longerValue');
      expect(getLocalStorageUsageBytes()).toBe((2 + 2) * 2 + (2 + 11) * 2);
    });

    it('handles empty values', () => {
      localStorage.setItem('key', '');
      expect(getLocalStorageUsageBytes()).toBe((3 + 0) * 2);
    });

    it('returns 0 when localStorage throws', () => {
      const getItem = vi
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw new Error('denied');
        });
      localStorage.setItem('x', 'y');
      expect(getLocalStorageUsageBytes()).toBe(0);
      getItem.mockRestore();
    });
  });

  describe('getLocalStorageUsageMB', () => {
    it('returns 0 when empty', () => {
      expect(getLocalStorageUsageMB()).toBe(0);
    });

    it('returns MB with two decimal places', () => {
      const oneMBChars = 512 * 1024;
      localStorage.setItem('x', 'x'.repeat(oneMBChars - 1));
      const mb = getLocalStorageUsageMB();
      expect(mb).toBeGreaterThanOrEqual(0.99);
      expect(mb).toBeLessThanOrEqual(1.01);
    });
  });

  describe('isLocalStorageNearLimit', () => {
    it('returns false when usage is below threshold', () => {
      expect(isLocalStorageNearLimit()).toBe(false);
    });

    it('returns true when usage is at 80% of limit', () => {
      const limit = 1000;
      const threshold = limit * STORAGE_WARNING_RATIO;
      const keyPlusValueBelow = Math.floor(threshold / 2) - 1;
      localStorage.setItem('x', 'x'.repeat(keyPlusValueBelow - 1));
      expect(getLocalStorageUsageBytes()).toBeLessThan(threshold);
      localStorage.clear();
      const keyPlusValueAt = Math.ceil(threshold / 2);
      localStorage.setItem('x', 'x'.repeat(keyPlusValueAt - 1));
      expect(getLocalStorageUsageBytes()).toBeGreaterThanOrEqual(threshold);
      expect(isLocalStorageNearLimit(limit)).toBe(true);
    });

    it('uses custom limit and ratio when provided', () => {
      const limit = 100;
      localStorage.setItem('x', 'x'.repeat(48));
      expect(getLocalStorageUsageBytes()).toBe((1 + 48) * 2);
      expect(isLocalStorageNearLimit(limit, 0.8)).toBe(true);
      expect(isLocalStorageNearLimit(limit, 1)).toBe(false);
    });
  });

  describe('constants', () => {
    it('LOCAL_STORAGE_LIMIT_BYTES is 5 MB', () => {
      expect(LOCAL_STORAGE_LIMIT_BYTES).toBe(5 * 1024 * 1024);
    });

    it('STORAGE_WARNING_RATIO is 0.8', () => {
      expect(STORAGE_WARNING_RATIO).toBe(0.8);
    });
  });
});
