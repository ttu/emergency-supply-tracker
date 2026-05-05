/**
 * Mutation-killing tests for communication.ts
 *
 * Targets surviving mutants:
 * - L20 StringLiteral: "" instead of 'communication-info' (COMMUNICATION_CATEGORY_ID constant)
 * - L31 StringLiteral: "" instead of 'communication-info' (strategyId property)
 *
 * Both mutants replace the category ID with an empty string, which would
 * cause canHandle to match empty string instead of 'communication-info',
 * and strategyId to be empty.
 */
import { describe, it, expect } from 'vitest';
import { CommunicationCategoryStrategy } from './communication';

describe('communication strategy mutation killers', () => {
  const strategy = new CommunicationCategoryStrategy();

  describe('L20 StringLiteral "" vs "communication-info" in canHandle', () => {
    it('returns true for communication-info category', () => {
      // If COMMUNICATION_CATEGORY_ID is "", canHandle("communication-info") would be false
      expect(strategy.canHandle('communication-info')).toBe(true);
    });

    it('returns false for empty string category', () => {
      // If COMMUNICATION_CATEGORY_ID is "", canHandle("") would be true (wrong)
      expect(strategy.canHandle('')).toBe(false);
    });

    it('returns false for other categories', () => {
      expect(strategy.canHandle('food-water')).toBe(false);
      expect(strategy.canHandle('medical')).toBe(false);
    });
  });

  describe('L31 StringLiteral "" vs "communication-info" in strategyId', () => {
    it('has non-empty strategyId', () => {
      // Mutant replaces strategyId with ""
      expect(strategy.strategyId).toBe('communication-info');
      expect(strategy.strategyId.length).toBeGreaterThan(0);
    });
  });
});
