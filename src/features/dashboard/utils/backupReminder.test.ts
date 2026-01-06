import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type MockedFunction,
} from 'vitest';
import {
  shouldShowBackupReminder,
  dismissBackupReminder,
  recordBackupDate,
} from './backupReminder';
import {
  createMockAppData,
  createMockInventoryItem,
} from '@/shared/utils/test/factories';
import * as localStorage from '@/shared/utils/storage/localStorage';

vi.mock('@/shared/utils/storage/localStorage');

describe('shouldShowBackupReminder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('should return false when changes were made less than 30 days ago', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-02-01T12:00:00.000Z', // 14 days ago
      lastModified: '2025-02-10T12:00:00.000Z', // Modified 5 days ago (after backup)
    });
    expect(shouldShowBackupReminder(appData)).toBe(false);
  });

  it('should return true when changes were made more than 30 days ago', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-01T12:00:00.000Z', // 45 days ago
      lastModified: '2025-01-10T12:00:00.000Z', // Modified 36 days ago (after backup)
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

  it('should return false when changes were made but less than 30 days ago', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-01T12:00:00.000Z', // 45 days ago
      lastModified: '2025-02-10T12:00:00.000Z', // Modified 5 days ago (after backup)
    });
    expect(shouldShowBackupReminder(appData)).toBe(false);
  });

  it('should return false when reminder was dismissed for current month', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-01T12:00:00.000Z', // 45 days ago
      lastModified: '2025-01-10T12:00:00.000Z', // Modified 36 days ago (after backup)
      backupReminderDismissedUntil: '2025-03-01T00:00:00.000Z', // Dismissed until next month
    });
    expect(shouldShowBackupReminder(appData)).toBe(false);
  });

  it('should return true when dismissed date has passed', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-01T12:00:00.000Z', // 45 days ago
      lastModified: '2025-01-10T12:00:00.000Z', // Modified 36 days ago (after backup)
      backupReminderDismissedUntil: '2025-02-01T00:00:00.000Z', // Dismissed until Feb 1, now is Feb 15
    });
    expect(shouldShowBackupReminder(appData)).toBe(true);
  });

  it('should return true at exactly 30 days since last modification', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-01T12:00:00.000Z', // 45 days ago
      lastModified: '2025-01-16T12:00:00.000Z', // Modified exactly 30 days ago (after backup)
    });
    expect(shouldShowBackupReminder(appData)).toBe(true);
  });

  it('should return false at 29 days since last modification', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-01T12:00:00.000Z', // 45 days ago
      lastModified: '2025-01-17T12:00:00.000Z', // Modified 29 days ago (after backup)
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

describe('dismissBackupReminder', () => {
  const mockGetAppData = localStorage.getAppData as MockedFunction<
    typeof localStorage.getAppData
  >;
  const mockSaveAppData = localStorage.saveAppData as MockedFunction<
    typeof localStorage.saveAppData
  >;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-15T12:00:00.000Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should set backupReminderDismissedUntil to first day of next month', () => {
    const appData = createMockAppData();
    mockGetAppData.mockReturnValue(appData);

    dismissBackupReminder();

    expect(mockSaveAppData).toHaveBeenCalledTimes(1);
    const savedData = mockSaveAppData.mock.calls[0][0];
    // Verify the date is the first day of next month (March 2025)
    expect(savedData.backupReminderDismissedUntil).toBeDefined();
    const dismissedDate = new Date(savedData.backupReminderDismissedUntil!);
    expect(dismissedDate.getFullYear()).toBe(2025);
    expect(dismissedDate.getMonth()).toBe(2); // March (0-indexed)
    expect(dismissedDate.getDate()).toBe(1);
  });

  it('should not call saveAppData when appData is null', () => {
    mockGetAppData.mockReturnValue(null);

    dismissBackupReminder();

    expect(mockSaveAppData).not.toHaveBeenCalled();
  });

  it('should calculate correct next month at year boundary', () => {
    vi.setSystemTime(new Date('2025-12-15T12:00:00.000Z'));
    const appData = createMockAppData();
    mockGetAppData.mockReturnValue(appData);

    dismissBackupReminder();

    expect(mockSaveAppData).toHaveBeenCalledTimes(1);
    const savedData = mockSaveAppData.mock.calls[0][0];
    // Verify the date is the first day of January 2026
    expect(savedData.backupReminderDismissedUntil).toBeDefined();
    const dismissedDate = new Date(savedData.backupReminderDismissedUntil!);
    expect(dismissedDate.getFullYear()).toBe(2026);
    expect(dismissedDate.getMonth()).toBe(0); // January (0-indexed)
    expect(dismissedDate.getDate()).toBe(1);
  });

  it('should preserve existing appData fields', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      lastBackupDate: '2025-01-01T00:00:00.000Z',
    });
    mockGetAppData.mockReturnValue(appData);

    dismissBackupReminder();

    const savedData = mockSaveAppData.mock.calls[0][0];
    expect(savedData.items).toEqual(appData.items);
    expect(savedData.lastBackupDate).toBe('2025-01-01T00:00:00.000Z');
  });
});

describe('recordBackupDate', () => {
  const mockGetAppData = localStorage.getAppData as MockedFunction<
    typeof localStorage.getAppData
  >;
  const mockSaveAppData = localStorage.saveAppData as MockedFunction<
    typeof localStorage.saveAppData
  >;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-02-15T12:00:00.000Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should set lastBackupDate to current date', () => {
    const appData = createMockAppData();
    mockGetAppData.mockReturnValue(appData);

    recordBackupDate();

    expect(mockSaveAppData).toHaveBeenCalledTimes(1);
    const savedData = mockSaveAppData.mock.calls[0][0];
    expect(savedData.lastBackupDate).toBe('2025-02-15T12:00:00.000Z');
  });

  it('should not call saveAppData when appData is null', () => {
    mockGetAppData.mockReturnValue(null);

    recordBackupDate();

    expect(mockSaveAppData).not.toHaveBeenCalled();
  });

  it('should overwrite existing lastBackupDate', () => {
    const appData = createMockAppData({
      lastBackupDate: '2025-01-01T00:00:00.000Z',
    });
    mockGetAppData.mockReturnValue(appData);

    recordBackupDate();

    const savedData = mockSaveAppData.mock.calls[0][0];
    expect(savedData.lastBackupDate).toBe('2025-02-15T12:00:00.000Z');
  });

  it('should preserve existing appData fields', () => {
    const appData = createMockAppData({
      items: [createMockInventoryItem()],
      backupReminderDismissedUntil: '2025-03-01T00:00:00.000Z',
    });
    mockGetAppData.mockReturnValue(appData);

    recordBackupDate();

    const savedData = mockSaveAppData.mock.calls[0][0];
    expect(savedData.items).toEqual(appData.items);
    expect(savedData.backupReminderDismissedUntil).toBe(
      '2025-03-01T00:00:00.000Z',
    );
  });
});
