/**
 * Error log localStorage operations.
 */

import type { ErrorLogData, LogEntry, LogLevel } from './types';

const ERROR_LOG_STORAGE_KEY = 'emergencySupplyTracker_errorLogs';

/**
 * Maximum number of log entries to store (to prevent localStorage bloat).
 */
const MAX_LOG_ENTRIES = 500;

/**
 * Valid log levels for validation.
 */
const VALID_LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

/**
 * Type guard to validate a LogEntry structure.
 */
function isValidLogEntry(entry: unknown): entry is LogEntry {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.level === 'string' &&
    VALID_LOG_LEVELS.includes(e.level as LogLevel) &&
    typeof e.message === 'string' &&
    typeof e.timestamp === 'string'
  );
}

/**
 * Type guard to validate ErrorLogData structure.
 */
function isValidErrorLogData(data: unknown): data is ErrorLogData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  // logs must be an array (entries validated individually)
  if (!Array.isArray(d.logs)) return false;

  // sessionId and sessionStart are optional (can be populated with current session)
  if (d.sessionId !== undefined && typeof d.sessionId !== 'string')
    return false;
  if (d.sessionStart !== undefined && typeof d.sessionStart !== 'string')
    return false;

  return true;
}

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Current session data (initialized on first access).
 */
let currentSession: { id: string; start: string } | null = null;

function getCurrentSession(): { id: string; start: string } {
  if (!currentSession) {
    currentSession = {
      id: generateSessionId(),
      start: new Date().toISOString(),
    };
  }
  return currentSession;
}

export function getErrorLogData(): ErrorLogData {
  try {
    const json = localStorage.getItem(ERROR_LOG_STORAGE_KEY);
    const session = getCurrentSession();

    if (!json) {
      return {
        logs: [],
        sessionId: session.id,
        sessionStart: session.start,
      };
    }

    const parsed: unknown = JSON.parse(json);

    if (!isValidErrorLogData(parsed)) {
      console.error(
        'Invalid error log data structure in localStorage, resetting to defaults',
      );
      return {
        logs: [],
        sessionId: session.id,
        sessionStart: session.start,
      };
    }

    // Filter out any invalid log entries
    const validLogs = parsed.logs.filter(isValidLogEntry);
    if (validLogs.length !== parsed.logs.length) {
      console.warn(
        `Filtered out ${parsed.logs.length - validLogs.length} invalid log entries`,
      );
    }

    // Preserve original session info if present, otherwise use current session
    return {
      logs: validLogs,
      sessionId: parsed.sessionId || session.id,
      sessionStart: parsed.sessionStart || session.start,
    };
  } catch (error) {
    console.error('Failed to load error log data:', error);
    const session = getCurrentSession();
    return {
      logs: [],
      sessionId: session.id,
      sessionStart: session.start,
    };
  }
}

export function saveErrorLogData(data: ErrorLogData): void {
  try {
    // Create sanitized copy, trimming logs if exceeding max
    const sanitized: ErrorLogData = {
      ...data,
      logs:
        data.logs.length > MAX_LOG_ENTRIES
          ? data.logs.slice(-MAX_LOG_ENTRIES)
          : data.logs,
    };
    const json = JSON.stringify(sanitized);
    localStorage.setItem(ERROR_LOG_STORAGE_KEY, json);
  } catch (error) {
    console.error('Failed to save error log data:', error);
  }
}

export function addLogEntry(entry: LogEntry): void {
  const data = getErrorLogData();
  data.logs.push(entry);
  saveErrorLogData(data);
}

export function getLogEntries(): LogEntry[] {
  return getErrorLogData().logs;
}

export function clearErrorLogs(): void {
  localStorage.removeItem(ERROR_LOG_STORAGE_KEY);
}

export function getSessionInfo(): { id: string; start: string } {
  return getCurrentSession();
}
