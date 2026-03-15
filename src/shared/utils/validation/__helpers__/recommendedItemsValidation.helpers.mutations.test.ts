import { describe, it, expect } from 'vitest';
import {
  createValidFile,
  createValidItem,
} from './recommendedItemsValidation.helpers';

describe('recommendedItemsValidation helpers - mutation killing tests', () => {
  describe('createValidFile', () => {
    it('default item has scaleWithPeople=true (L25: cannot be false)', () => {
      const file = createValidFile();
      expect(file.items[0].scaleWithPeople).toBe(true);
    });

    it('default item has scaleWithDays=false (L26: cannot be true)', () => {
      const file = createValidFile();
      expect(file.items[0].scaleWithDays).toBe(false);
    });

    it('scaleWithPeople and scaleWithDays have distinct boolean values', () => {
      const file = createValidFile();
      // These must be different - if both are mutated to the same value, this fails
      expect(file.items[0].scaleWithPeople).not.toBe(
        file.items[0].scaleWithDays,
      );
    });
  });

  describe('createValidItem', () => {
    it('default item has scaleWithPeople=true (L41: cannot be false)', () => {
      const item = createValidItem();
      expect(item.scaleWithPeople).toBe(true);
    });

    it('default item has scaleWithDays=false (L42: cannot be true)', () => {
      const item = createValidItem();
      expect(item.scaleWithDays).toBe(false);
    });

    it('scaleWithPeople and scaleWithDays have distinct boolean values', () => {
      const item = createValidItem();
      expect(item.scaleWithPeople).not.toBe(item.scaleWithDays);
    });

    it('overrides are applied to scaleWithPeople', () => {
      const item = createValidItem({ scaleWithPeople: false });
      expect(item.scaleWithPeople).toBe(false);
    });

    it('overrides are applied to scaleWithDays', () => {
      const item = createValidItem({ scaleWithDays: true });
      expect(item.scaleWithDays).toBe(true);
    });
  });
});
