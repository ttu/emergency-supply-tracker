/**
 * Common file download utilities.
 */

/**
 * Downloads content as a file by creating a temporary link and clicking it.
 *
 * @param content - The content to download (string or Blob)
 * @param filename - The filename for the downloaded file
 * @param mimeType - The MIME type of the content (default: 'application/json')
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType = 'application/json',
): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a filename with the current date in ISO format.
 *
 * @param prefix - The prefix for the filename (e.g., 'emergency-supplies')
 * @param extension - The file extension (default: 'json')
 * @returns Filename like 'emergency-supplies-2024-01-15.json'
 */
export function generateDateFilename(
  prefix: string,
  extension = 'json',
): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.${extension}`;
}

/**
 * Generates a filename with a full timestamp.
 *
 * @param prefix - The prefix for the filename
 * @param extension - The file extension (default: 'json')
 * @returns Filename like 'emergency-supplies-2024-01-15T10-30-45.json'
 */
export function generateTimestampFilename(
  prefix: string,
  extension = 'json',
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}.${extension}`;
}
