import { shouldShowBackupReminder } from './backupReminder';
import { createMockAppData, createMockInventoryItem } from '../test/factories';

describe('shouldShowBackupReminder', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-02-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return false for null appData', () => {
    expect(shouldShowBackupReminder(null)).toBe(false);
  });

  it('should return false when there are no items', () => {
    const appData = createMockAppData({ items: [] });
    expect(shouldShowBackupReminder(appData)).toBe(false);
  });

  it('should return true when never backed up and has items', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: undefined,
    });
    expect(shouldShowBackupReminder(appData)).toBe(true);
  });

  it('should return false when backup was less than 30 days ago', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-02-01T12:00:00.000Z', // 14 days ago
      lastModified: '2025-02-10T12:00:00.000Z', // Modified after backup
    });
    expect(shouldShowBackupReminder(appData)).toBe(false);
  });

  it('should return true when backup was more than 30 days ago and data was modified', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-01T12:00:00.000Z', // 45 days ago
      lastModified: '2025-02-10T12:00:00.000Z', // Modified after backup
    });
    expect(shouldShowBackupReminder(appData)).toBe(true);
  });

  it('should return false when backup was more than 30 days ago but data was not modified', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-01T12:00:00.000Z', // 45 days ago
      lastModified: '2024-12-20T12:00:00.000Z', // Modified before backup
    });
    expect(shouldShowBackupReminder(appData)).toBe(false);
  });

  it('should return false when reminder was dismissed for current month', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-01T12:00:00.000Z', // 45 days ago
      lastModified: '2025-02-10T12:00:00.000Z', // Modified after backup
      backupReminderDismissedUntil: '2025-03-01T00:00:00.000Z', // Dismissed until next month
    });
    expect(shouldShowBackupReminder(appData)).toBe(false);
  });

  it('should return true when dismissed date has passed', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-01T12:00:00.000Z', // 45 days ago
      lastModified: '2025-02-10T12:00:00.000Z', // Modified after backup
      backupReminderDismissedUntil: '2025-02-01T00:00:00.000Z', // Dismissed until Feb 1, now is Feb 15
    });
    expect(shouldShowBackupReminder(appData)).toBe(true);
  });

  it('should return true at exactly 30 days since backup', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-16T12:00:00.000Z', // Exactly 30 days ago
      lastModified: '2025-02-10T12:00:00.000Z', // Modified after backup
    });
    expect(shouldShowBackupReminder(appData)).toBe(true);
  });

  it('should return false at 29 days since backup', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-17T12:00:00.000Z', // 29 days ago
      lastModified: '2025-02-10T12:00:00.000Z', // Modified after backup
    });
    expect(shouldShowBackupReminder(appData)).toBe(false);
  });

  it('should return false when lastModified equals lastBackupDate', () => {
    const backupDate = '2025-01-01T12:00:00.000Z';
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: backupDate,
      lastModified: backupDate, // Same as backup
    });
    expect(shouldShowBackupReminder(appData)).toBe(false);
  });

  it('should handle multiple items correctly', () => {
    const appData = createMockAppData({
      items: [
        createMockInventoryItem({ id: '1', name: 'Item 1' }),
        createMockInventoryItem({ id: '2', name: 'Item 2' }),
        createMockInventoryItem({ id: '3', name: 'Item 3' }),
      ],
      lastBackupDate: undefined,
    });
    expect(shouldShowBackupReminder(appData)).toBe(true);
  });
});
