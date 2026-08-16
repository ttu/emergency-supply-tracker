import { calculatePreparednessScoreFromCategoryStatuses } from './preparedness';
import type { CategoryStatusSummary } from './categoryStatus';

describe('calculatePreparednessScoreFromCategoryStatuses', () => {
  it('should return 0 when no categories', () => {
    const categoryStatuses: CategoryStatusSummary[] = [];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    expect(score).toBe(0);
  });

  it('should return 0 when all categories are critical', () => {
    const categoryStatuses: CategoryStatusSummary[] = [
      {
        categoryId: 'water',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
        hasRecommendations: true,
      },
      {
        categoryId: 'food',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
        hasRecommendations: true,
      },
    ];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    expect(score).toBe(0);
  });

  it('should return 50 when half categories are ok', () => {
    const categoryStatuses: CategoryStatusSummary[] = [
      {
        categoryId: 'water',
        status: 'ok',
        itemCount: 0,
        completionPercentage: 100,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 10,
        totalNeeded: 10,
        hasRecommendations: true,
      },
      {
        categoryId: 'food',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 10,
        hasRecommendations: true,
      },
    ];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    expect(score).toBe(50);
  });

  it('should return 100 when all categories are ok', () => {
    const categoryStatuses: CategoryStatusSummary[] = [
      {
        categoryId: 'water',
        status: 'ok',
        itemCount: 0,
        completionPercentage: 100,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 10,
        totalNeeded: 10,
        hasRecommendations: true,
      },
      {
        categoryId: 'food',
        status: 'ok',
        itemCount: 0,
        completionPercentage: 100,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 20,
        totalNeeded: 20,
        hasRecommendations: true,
      },
    ];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    expect(score).toBe(100);
  });

  it('should exclude categories with totalNeeded === 0 from calculation', () => {
    const categoryStatuses: CategoryStatusSummary[] = [
      {
        categoryId: 'water',
        status: 'ok',
        itemCount: 1,
        completionPercentage: 100,
        criticalCount: 0,
        warningCount: 0,
        okCount: 1,
        shortages: [],
        totalActual: 10,
        totalNeeded: 10,
        hasRecommendations: true,
      },
      {
        categoryId: 'pets',
        status: 'ok',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0, // No pets, excluded from calculation
        hasRecommendations: false,
      },
    ];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    // Only water counts (totalNeeded > 0), and it's ok → 100%
    expect(score).toBe(100);
  });

  it('should return 0 when all categories have totalNeeded === 0', () => {
    const categoryStatuses: CategoryStatusSummary[] = [
      {
        categoryId: 'pets',
        status: 'ok',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
        hasRecommendations: false,
      },
    ];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    expect(score).toBe(0);
  });

  it('should distinguish warning from ok (only ok counts)', () => {
    const categoryStatuses: CategoryStatusSummary[] = [
      {
        categoryId: 'water',
        status: 'warning',
        itemCount: 1,
        completionPercentage: 60,
        criticalCount: 0,
        warningCount: 1,
        okCount: 0,
        shortages: [],
        totalActual: 6,
        totalNeeded: 10,
        hasRecommendations: true,
      },
    ];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    // Warning is NOT ok, so score = 0/1 = 0
    expect(score).toBe(0);
  });

  it('should round correctly for 2 out of 9 categories', () => {
    const categoryStatuses: CategoryStatusSummary[] = [
      {
        categoryId: 'water',
        status: 'ok',
        itemCount: 0,
        completionPercentage: 100,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 10,
        totalNeeded: 10,
        hasRecommendations: true,
      },
      {
        categoryId: 'food',
        status: 'ok',
        itemCount: 0,
        completionPercentage: 100,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 20,
        totalNeeded: 20,
        hasRecommendations: true,
      },
      {
        categoryId: 'cooking',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 5,
        hasRecommendations: true,
      },
      {
        categoryId: 'light',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 5,
        hasRecommendations: true,
      },
      {
        categoryId: 'communication',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 3,
        hasRecommendations: true,
      },
      {
        categoryId: 'medical',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 8,
        hasRecommendations: true,
      },
      {
        categoryId: 'hygiene',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 10,
        hasRecommendations: true,
      },
      {
        categoryId: 'tools',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 11,
        hasRecommendations: true,
      },
      {
        categoryId: 'cash',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 3,
        hasRecommendations: true,
      },
    ];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    // 2 out of 9 = 22.22%, rounded to 22%
    expect(score).toBe(22);
  });
});
