/**
 * Which items the dashboard puts in front of the household, and in what order.
 *
 * Both the desktop `PriorityQueue` and the mobile dashboard show a truncated
 * list, so the ordering has to happen before the slice: sorting only what
 * survives an unsorted `slice(0, n)` silently drops critical items that
 * happened to sit further down the source rows.
 */

interface PriorityRow {
  status: string;
}

/**
 * Critical items first, everything else in its original order.
 *
 * Equal statuses must compare 0, or the comparator is inconsistent
 * (compare(a,b) and compare(b,a) both returning -1) and the order among
 * criticals becomes implementation-defined.
 */
export function critFirst(a: PriorityRow, b: PriorityRow): number {
  if (a.status === b.status) return 0;
  if (a.status === 'crit') return -1;
  if (b.status === 'crit') return 1;
  return 0;
}

/** The `limit` most pressing non-OK rows, critical ones first. */
export function selectPriorityRows<T extends PriorityRow>(
  rows: readonly T[],
  limit: number,
): T[] {
  return rows
    .filter((r) => r.status !== 'ok')
    .sort(critFirst)
    .slice(0, limit);
}
