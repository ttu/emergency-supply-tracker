/**
 * Debug log export functionality.
 */

import type { LogEntry } from './types';
import { getErrorLogData, clearErrorLogs as clearLogs } from './storage';
import { getAnalyticsData } from '@/shared/utils/analytics/storage';

export interface DebugExportData {
  exportedAt: string;
  appVersion: string;
  userAgent: string;
  session: {
    id: string;
    start: string;
  };
  logs: LogEntry[];
  analytics: {
    events: unknown[];
    stats: unknown;
  };
}

/**
 * Generate a debug export containing all logs and analytics data.
 */
export function generateDebugExport(): DebugExportData {
  const errorLogData = getErrorLogData();
  const analyticsData = getAnalyticsData();

  return {
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    userAgent: navigator.userAgent,
    session: {
      id: errorLogData.sessionId,
      start: errorLogData.sessionStart,
    },
    logs: errorLogData.logs,
    analytics: {
      events: analyticsData.events,
      stats: analyticsData.stats,
    },
  };
}

/**
 * Export debug data as a downloadable JSON file.
 */
export function downloadDebugExport(): void {
  const data = generateDebugExport();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `emergency-supply-tracker-debug-${timestamp}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Clear all error logs.
 */
export function clearErrorLogs(): void {
  clearLogs();
}

/**
 * Get the count of log entries.
 */
export function getLogCount(): number {
  return getErrorLogData().logs.length;
}
