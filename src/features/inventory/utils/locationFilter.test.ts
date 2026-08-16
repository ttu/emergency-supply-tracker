import { describe, it, expect } from 'vitest';
import { LOCATION_FILTER_NONE } from '@/features/inventory';
import { matchesLocationFilter } from './locationFilter';

describe('matchesLocationFilter', () => {
  it('matches everything when the filter is undefined', () => {
    expect(matchesLocationFilter('Garage', undefined)).toBe(true);
    expect(matchesLocationFilter(undefined, undefined)).toBe(true);
    expect(matchesLocationFilter('', undefined)).toBe(true);
  });

  it('matches only items without a location when the filter is the "none" sentinel', () => {
    expect(matchesLocationFilter(undefined, LOCATION_FILTER_NONE)).toBe(true);
    expect(matchesLocationFilter('', LOCATION_FILTER_NONE)).toBe(true);
    expect(matchesLocationFilter('   ', LOCATION_FILTER_NONE)).toBe(true);
    expect(matchesLocationFilter('Garage', LOCATION_FILTER_NONE)).toBe(false);
  });

  it('matches only the exact location for a concrete filter value', () => {
    expect(matchesLocationFilter('Garage', 'Garage')).toBe(true);
    expect(matchesLocationFilter('Pantry', 'Garage')).toBe(false);
    expect(matchesLocationFilter(undefined, 'Garage')).toBe(false);
  });

  it('lets a location literally named "none" or "all" round-trip through the sentinel', () => {
    // The sentinel is a value no real location can collide with, not the
    // literal word — a location named after either keyword must still only
    // match itself.
    expect(matchesLocationFilter('none', LOCATION_FILTER_NONE)).toBe(false);
    expect(matchesLocationFilter('none', 'none')).toBe(true);
    expect(matchesLocationFilter('all', 'all')).toBe(true);
  });
});
