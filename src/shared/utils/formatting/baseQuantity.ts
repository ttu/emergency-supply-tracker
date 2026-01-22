/**
 * Formats baseQuantity for display in the UI.
 * Since calculations use Math.ceil(), fractional values are rounded up.
 * This formatter shows the rounded value and includes a note when the original value is fractional.
 *
 * @param baseQuantity - The base quantity value (may be fractional)
 * @param unit - The unit of measurement (e.g., "cans", "liters")
 * @param roundingNote - Translated note about rounding (e.g., "{{value}} per person, rounded up in calculations")
 * @param showRoundingNote - Whether to show a note about rounding for fractional values
 * @returns Formatted string for display
 *
 * @example
 * formatBaseQuantity(0.67, "cans", "0.67 per person, rounded up in calculations", true)
 * // Returns: "1 cans (0.67 per person, rounded up in calculations)"
 *
 * @example
 * formatBaseQuantity(5, "liters", "...", true)
 * // Returns: "5 liters"
 */
export function formatBaseQuantity(
  baseQuantity: number,
  unit: string,
  roundingNote: string,
  showRoundingNote: boolean = true,
): string {
  const rounded = Math.ceil(baseQuantity);
  const isFractional = baseQuantity !== rounded && baseQuantity % 1 !== 0;

  if (isFractional) {
    // Always round up fractional values for display
    if (showRoundingNote) {
      // Show rounded value with original fractional value and rounding note
      // The roundingNote should already contain the baseQuantity value via interpolation
      return `${rounded} ${unit} (${roundingNote})`;
    }
    // When note is disabled, still show rounded value (not raw fractional)
    return `${rounded} ${unit}`;
  }

  // For whole numbers, just show the value
  return `${baseQuantity} ${unit}`;
}

/**
 * Formats baseQuantity for display in a compact format (without rounding note).
 * Shows the rounded value for fractional quantities.
 *
 * @param baseQuantity - The base quantity value (may be fractional)
 * @param unit - The unit of measurement
 * @returns Formatted string for display
 *
 * @example
 * formatBaseQuantityCompact(0.67, "cans")
 * // Returns: "1 cans"
 *
 * @example
 * formatBaseQuantityCompact(5, "liters")
 * // Returns: "5 liters"
 */
export function formatBaseQuantityCompact(
  baseQuantity: number,
  unit: string,
): string {
  const rounded = Math.ceil(baseQuantity);
  return `${rounded} ${unit}`;
}
