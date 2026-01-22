import { describe, it, expect } from 'vitest';
import { getCategoryStrategy, getRegisteredStrategyIds } from './registry';
import { FoodCategoryStrategy } from './food';
import { WaterCategoryStrategy } from './water';
import { CommunicationCategoryStrategy } from './communication';
import { DefaultCategoryStrategy } from './default';

describe('Strategy Registry', () => {
  describe('getCategoryStrategy', () => {
    it('should return FoodCategoryStrategy for food category', () => {
      const strategy = getCategoryStrategy('food');
      expect(strategy).toBeInstanceOf(FoodCategoryStrategy);
      expect(strategy.strategyId).toBe('food');
    });

    it('should return WaterCategoryStrategy for water-beverages category', () => {
      const strategy = getCategoryStrategy('water-beverages');
      expect(strategy).toBeInstanceOf(WaterCategoryStrategy);
      expect(strategy.strategyId).toBe('water-beverages');
    });

    it('should return CommunicationCategoryStrategy for communication-info category', () => {
      const strategy = getCategoryStrategy('communication-info');
      expect(strategy).toBeInstanceOf(CommunicationCategoryStrategy);
      expect(strategy.strategyId).toBe('communication-info');
    });

    it('should return DefaultCategoryStrategy for other categories', () => {
      const categories = [
        'tools-supplies',
        'cooking-heat',
        'light-power',
        'medical-health',
        'hygiene-sanitation',
        'cash-documents',
        'pets',
        'unknown-category',
      ];

      categories.forEach((categoryId) => {
        const strategy = getCategoryStrategy(categoryId);
        expect(strategy).toBeInstanceOf(DefaultCategoryStrategy);
        expect(strategy.strategyId).toBe('default');
      });
    });

    it('should return DefaultCategoryStrategy for empty string', () => {
      const strategy = getCategoryStrategy('');
      expect(strategy).toBeInstanceOf(DefaultCategoryStrategy);
    });
  });

  describe('getRegisteredStrategyIds', () => {
    it('should return all registered strategy IDs', () => {
      const ids = getRegisteredStrategyIds();

      expect(ids).toContain('food');
      expect(ids).toContain('water-beverages');
      expect(ids).toContain('communication-info');
      expect(ids).toContain('default');
    });

    it('should have default strategy last', () => {
      const ids = getRegisteredStrategyIds();
      expect(ids[ids.length - 1]).toBe('default');
    });
  });

  describe('Strategy priority', () => {
    it('should check specific strategies before default', () => {
      // Food should use FoodCategoryStrategy, not DefaultCategoryStrategy
      const foodStrategy = getCategoryStrategy('food');
      expect(foodStrategy.strategyId).toBe('food');

      // Both FoodCategoryStrategy and DefaultCategoryStrategy can handle 'food'
      // but FoodCategoryStrategy should be selected first
      const defaultStrategy = new DefaultCategoryStrategy();
      expect(defaultStrategy.canHandle('food')).toBe(true);
    });
  });
});
