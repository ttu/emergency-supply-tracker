/**
 * Error log localStorage operations.
 */

import type { ErrorLogData, LogEntry } from './types';

const ERROR_LOG_STORAGE_KEY = 'emergencySupplyTracker_errorLogs';

/**
 * Maximum number of log entries to store (to prevent localStorage bloat).
 */
const MAX_LOG_ENTRIES = 500;

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

    const data = JSON.parse(json) as ErrorLogData;
    // Preserve original session info if present, otherwise use current session
    return {
      ...data,
      sessionId: data.sessionId || session.id,
      sessionStart: data.sessionStart || session.start,
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
    // Trim logs if exceeding max
    if (data.logs.length > MAX_LOG_ENTRIES) {
      data.logs = data.logs.slice(-MAX_LOG_ENTRIES);
    }
    const json = JSON.stringify(data);
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
