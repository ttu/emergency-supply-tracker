import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCloudSync } from './useCloudSync';
import { CloudSyncContext } from '../context';
import type { CloudSyncContextValue } from '../types';
import type { ReactNode } from 'react';

describe('useCloudSync', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for expected error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useCloudSync());
    }).toThrow('useCloudSync must be used within a CloudSyncProvider');

    consoleSpy.mockRestore();
  });

  it('should return context value when used within provider', () => {
    const mockContextValue: CloudSyncContextValue = {
      state: {
        provider: 'google-drive',
        lastSyncTimestamp: null,
        remoteFileId: null,
        state: 'connected',
        error: null,
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      syncNow: vi.fn(),
      clearError: vi.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <CloudSyncContext.Provider value={mockContextValue}>
        {children}
      </CloudSyncContext.Provider>
    );

    const { result } = renderHook(() => useCloudSync(), { wrapper });

    expect(result.current).toBe(mockContextValue);
    expect(result.current.state.state).toBe('connected');
    expect(result.current.state.provider).toBe('google-drive');
  });
});
