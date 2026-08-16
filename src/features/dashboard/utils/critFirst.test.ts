import { describe, it, expect } from 'vitest';
import { critFirst } from './priorityRows';

const row = (id: string, status: string) => ({ id, status });

describe('critFirst', () => {
  it('compares equal statuses as equal in both directions', () => {
    const warnA = row('a', 'warn');
    const warnB = row('b', 'warn');
    expect(critFirst(warnA, warnB)).toBe(0);
    expect(critFirst(warnB, warnA)).toBe(0);
  });

  it('orders critical ahead of anything else', () => {
    expect(critFirst(row('a', 'crit'), row('b', 'warn'))).toBeLessThan(0);
    expect(critFirst(row('a', 'warn'), row('b', 'crit'))).toBeGreaterThan(0);
  });
});
