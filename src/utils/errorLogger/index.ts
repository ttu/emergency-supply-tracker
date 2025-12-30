/**
 * Error Logger Module
 * Provides structured logging with localStorage persistence.
 * All data stays local - no external tracking.
 */

// Types
export type { LogLevel, LogEntry, ErrorLogData } from './types';

// Logger functions
export {
  debug,
  info,
  warn,
  error,
  logErrorBoundary,
  getLogs,
  getSession,
} from './logger';

// Export functions
export {
  generateDebugExport,
  downloadDebugExport,
  clearErrorLogs,
  getLogCount,
} from './export';
export type { DebugExportData } from './export';

// Storage functions (for advanced use)
export { getErrorLogData, getLogEntries } from './storage';
