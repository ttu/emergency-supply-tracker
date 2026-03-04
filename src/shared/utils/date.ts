/**
 * Format a Date as YYYY-MM-DD using local timezone.
 *
 * Use this instead of `date.toISOString().split('T')[0]` which returns the UTC
 * date. Near midnight, UTC and local dates can disagree — this function always
 * returns the local calendar date, consistent with how the app stores and
 * compares dates.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
