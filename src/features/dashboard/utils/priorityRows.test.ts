import { describe, it, expect } from 'vitest';
import { critFirst, selectPriorityRows } from './priorityRows';

const row = (id: string, status: string) => ({ id, status });

describe('selectPriorityRows', () => {
  it('leaves out everything that is already stocked', () => {
    const rows = [row('a', 'ok'), row('b', 'warn'), row('c', 'ok')];
    expect(selectPriorityRows(rows, 5).map((r) => r.id)).toEqual(['b']);
  });

  it('keeps a critical item that sits past the limit in the source rows', () => {
    const rows = [
      row('w1', 'warn'),
      row('w2', 'warn'),
      row('w3', 'warn'),
      row('w4', 'warn'),
      row('late-crit', 'crit'),
    ];

    const selected = selectPriorityRows(rows, 4).map((r) => r.id);

    expect(selected).toContain('late-crit');
    expect(selected[0]).toBe('late-crit');
    expect(selected).toHaveLength(4);
  });

  it('never returns more than the limit', () => {
    const rows = Array.from({ length: 9 }, (_, i) => row(`c${i}`, 'crit'));
    expect(selectPriorityRows(rows, 4)).toHaveLength(4);
  });

  it('preserves the source order among equally urgent rows', () => {
    const rows = [row('a', 'warn'), row('b', 'warn'), row('c', 'warn')];
    expect(selectPriorityRows(rows, 3).map((r) => r.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('does not mutate the rows it was given', () => {
    const rows = [row('w', 'warn'), row('c', 'crit')];
    selectPriorityRows(rows, 2);
    expect(rows.map((r) => r.id)).toEqual(['w', 'c']);
  });
});

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
