import { describe, it, expect } from 'vitest';
import { isValidUnit } from './unitValidation';
import { VALID_UNITS, type Unit } from '@/shared/types';

describe('unitValidation', () => {
  describe('VALID_UNITS', () => {
    it('should export all valid unit types', () => {
      const expectedUnits: Unit[] = [
        'pieces',
        'liters',
        'kilograms',
        'grams',
        'cans',
        'bottles',
        'packages',
        'jars',
        'canisters',
        'boxes',
        'days',
        'rolls',
        'tubes',
        'meters',
        'pairs',
        'euros',
        'sets',
      ];

      expect(VALID_UNITS).toEqual(expectedUnits);
      expect(VALID_UNITS).toHaveLength(17);
    });

    it('should be a readonly array', () => {
      // This test ensures VALID_UNITS is properly typed as readonly
      // TypeScript will catch if we try to modify it
      const units: readonly Unit[] = VALID_UNITS;
      expect(units).toBeDefined();
    });
  });

  describe('isValidUnit', () => {
    describe('valid units', () => {
      it('should return true for "pieces"', () => {
        expect(isValidUnit('pieces')).toBe(true);
      });

      it('should return true for "liters"', () => {
        expect(isValidUnit('liters')).toBe(true);
      });

      it('should return true for "kilograms"', () => {
        expect(isValidUnit('kilograms')).toBe(true);
      });

      it('should return true for all valid units', () => {
        VALID_UNITS.forEach((unit) => {
          expect(isValidUnit(unit)).toBe(true);
        });
      });
    });

    describe('invalid units', () => {
      it('should return false for invalid string', () => {
        expect(isValidUnit('invalid')).toBe(false);
      });

      it('should return false for empty string', () => {
        expect(isValidUnit('')).toBe(false);
      });

      it('should return false for whitespace string', () => {
        expect(isValidUnit('   ')).toBe(false);
      });

      it('should return false for undefined when cast to string', () => {
        // TypeScript prevents passing undefined, but test runtime behavior
        expect(isValidUnit(undefined as unknown as string)).toBe(false);
      });

      it('should return false for null when cast to string', () => {
        // TypeScript prevents passing null, but test runtime behavior
        expect(isValidUnit(null as unknown as string)).toBe(false);
      });

      it('should return false for number when cast to string', () => {
        expect(isValidUnit(123 as unknown as string)).toBe(false);
      });

      it('should return false for object when cast to string', () => {
        expect(isValidUnit({} as unknown as string)).toBe(false);
      });
    });

    describe('case sensitivity', () => {
      it('should return false for uppercase unit', () => {
        expect(isValidUnit('PIECES')).toBe(false);
      });

      it('should return false for mixed case unit', () => {
        expect(isValidUnit('Pieces')).toBe(false);
      });
    });

    describe('type guard behavior', () => {
      it('should narrow type to Unit when true', () => {
        const input: string = 'pieces';
        if (isValidUnit(input)) {
          // Type should be narrowed to Unit
          const unit: Unit = input;
          expect(unit).toBe('pieces');
        }
      });
    });
  });
});
