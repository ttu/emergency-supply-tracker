import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClearDataButton } from './ClearDataButton';
import * as localStorage from '@/shared/utils/storage/localStorage';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage');

// Store original console.error to restore later
const originalConsoleError = console.error;

describe('ClearDataButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.alert = vi.fn();
    globalThis.confirm = vi.fn(() => false);
    // Mock globalThis.location.reload to prevent jsdom error
    globalThis.location = {
      reload: vi.fn(),
    } as unknown as Location;
    // Suppress the "Not implemented: navigation" error from jsdom
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should render clear data button', () => {
    render(<ClearDataButton />);

    expect(screen.getByText('settings.clearData.button')).toBeInTheDocument();
    expect(screen.getByText('settings.clearData.warning')).toBeInTheDocument();
  });

  it('should not clear data if first confirmation is cancelled', () => {
    globalThis.confirm = vi.fn(() => false);

    render(<ClearDataButton />);

    const button = screen.getByText('settings.clearData.button');
    fireEvent.click(button);

    expect(globalThis.confirm).toHaveBeenCalledTimes(1);
    expect(localStorage.clearAppData).not.toHaveBeenCalled();
  });

  it('should not clear data if second confirmation is cancelled', () => {
    globalThis.confirm = vi
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    render(<ClearDataButton />);

    const button = screen.getByText('settings.clearData.button');
    fireEvent.click(button);

    expect(globalThis.confirm).toHaveBeenCalledTimes(2);
    expect(localStorage.clearAppData).not.toHaveBeenCalled();
  });

  it('should clear data when both confirmations are accepted', () => {
    globalThis.confirm = vi.fn(() => true);
    const reloadSpy = vi.fn();
    globalThis.location.reload = reloadSpy;

    render(<ClearDataButton />);

    const button = screen.getByText('settings.clearData.button');
    fireEvent.click(button);

    expect(globalThis.confirm).toHaveBeenCalledTimes(2);
    expect(localStorage.clearAppData).toHaveBeenCalled();
    expect(globalThis.alert).toHaveBeenCalledWith('settings.clearData.success');
    // window.location.reload should be called
    expect(reloadSpy).toHaveBeenCalled();
  });
});
