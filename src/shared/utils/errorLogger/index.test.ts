import {
  debug,
  info,
  warn,
  error,
  logErrorBoundary,
  getLogs,
  getSession,
  generateDebugExport,
  downloadDebugExport,
  clearErrorLogs,
  getLogCount,
  getErrorLogData,
  getLogEntries,
} from './index';

describe('errorLogger index exports', () => {
  it('exports logger functions', () => {
    expect(typeof debug).toBe('function');
    expect(typeof info).toBe('function');
    expect(typeof warn).toBe('function');
    expect(typeof error).toBe('function');
    expect(typeof logErrorBoundary).toBe('function');
    expect(typeof getLogs).toBe('function');
    expect(typeof getSession).toBe('function');
  });

  it('exports export functions', () => {
    expect(typeof generateDebugExport).toBe('function');
    expect(typeof downloadDebugExport).toBe('function');
    expect(typeof clearErrorLogs).toBe('function');
    expect(typeof getLogCount).toBe('function');
  });

  it('exports storage functions', () => {
    expect(typeof getErrorLogData).toBe('function');
    expect(typeof getLogEntries).toBe('function');
  });
});
