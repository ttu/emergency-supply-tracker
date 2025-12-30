// Type declaration for the injected global
declare const __APP_VERSION__: string | undefined;

/**
 * Application version injected at build time via Vite's define.
 * Format: YYYY.MM.DD-shortSha (e.g., 2025.01.15-abc1234)
 * Falls back to 'dev' when running locally without version injection.
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
