/**
 * Error logger utility functions.
 */

import type { LogEntry, LogLevel } from './types';
import { addLogEntry, getLogEntries, getSessionInfo } from './storage';

/**
 * Generate a unique log entry ID.
 */
function generateLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract error details from an Error object or unknown value.
 */
function extractErrorDetails(error: unknown): LogEntry['error'] | undefined {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (error !== undefined && error !== null) {
    return {
      name: 'UnknownError',
      message: String(error),
    };
  }
  return undefined;
}

/**
 * Create and store a log entry.
 */
function log(
  level: LogLevel,
  message: string,
  options?: {
    context?: string;
    error?: unknown;
    metadata?: Record<string, unknown>;
  },
): void {
  const entry: LogEntry = {
    id: generateLogId(),
    level,
    message,
    timestamp: new Date().toISOString(),
    context: options?.context,
    error: extractErrorDetails(options?.error),
    metadata: options?.metadata,
  };

  try {
    addLogEntry(entry);
  } catch (storageError) {
    console.error(
      `[ErrorLogger] Failed to persist log entry (id: ${entry.id}, context: ${entry.context ?? 'none'}):`,
      storageError,
    );
  }

  // Also log to console for development
  const consoleMethod = level === 'debug' ? 'log' : level;
  const prefix = `[${level.toUpperCase()}]${options?.context ? ` [${options.context}]` : ''}`;

  if (options?.error) {
    console[consoleMethod](`${prefix} ${message}`, options.error);
  } else {
    console[consoleMethod](`${prefix} ${message}`);
  }
}

/**
 * Log a debug message.
 */
export function debug(
  message: string,
  options?: {
    context?: string;
    metadata?: Record<string, unknown>;
  },
): void {
  log('debug', message, options);
}

/**
 * Log an info message.
 */
export function info(
  message: string,
  options?: {
    context?: string;
    metadata?: Record<string, unknown>;
  },
): void {
  log('info', message, options);
}

/**
 * Log a warning message.
 */
export function warn(
  message: string,
  options?: {
    context?: string;
    error?: unknown;
    metadata?: Record<string, unknown>;
  },
): void {
  log('warn', message, options);
}

/**
 * Log an error message.
 */
export function error(
  message: string,
  options?: {
    context?: string;
    error?: unknown;
    metadata?: Record<string, unknown>;
  },
): void {
  log('error', message, options);
}

/**
 * Log an error from an Error Boundary.
 */
export function logErrorBoundary(
  err: Error,
  errorInfo: { componentStack?: string },
): void {
  log('error', 'React Error Boundary caught an error', {
    context: 'ErrorBoundary',
    error: err,
    metadata: {
      componentStack: errorInfo.componentStack,
    },
  });
}

/**
 * Get all log entries.
 */
export function getLogs(): LogEntry[] {
  return getLogEntries();
}

/**
 * Get session information.
 */
export function getSession(): { id: string; start: string } {
  return getSessionInfo();
}
