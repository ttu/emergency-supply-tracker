/**
 * Re-export formatLocalDate as toLocalDateString for test convenience.
 *
 * Tests should use this instead of `date.toISOString().split('T')[0]` when
 * creating date strings for comparison with production code. See
 * src/shared/utils/date.ts for the canonical implementation.
 */
export { formatLocalDate as toLocalDateString } from '@/shared/utils/date';
