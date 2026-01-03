/**
 * Error logging type definitions.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface ErrorLogData {
  logs: LogEntry[];
  sessionId: string;
  sessionStart: string;
}
