import { render, screen, fireEvent } from '@testing-library/react';
import { ClearDataButton } from './ClearDataButton';
import * as localStorage from '@/shared/utils/storage/localStorage';

// Mock localStorage utilities
jest.mock('@/shared/utils/storage/localStorage');

// Store original console.error to restore later
const originalConsoleError = console.error;

describe('ClearDataButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.confirm = jest.fn(() => false);
    // Suppress the "Not implemented: navigation" error from jsdom
    console.error = jest.fn();
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
    global.confirm = jest.fn(() => false);

    render(<ClearDataButton />);

    const button = screen.getByText('settings.clearData.button');
    fireEvent.click(button);

    expect(global.confirm).toHaveBeenCalledTimes(1);
    expect(localStorage.clearAppData).not.toHaveBeenCalled();
  });

  it('should not clear data if second confirmation is cancelled', () => {
    global.confirm = jest
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    render(<ClearDataButton />);

    const button = screen.getByText('settings.clearData.button');
    fireEvent.click(button);

    expect(global.confirm).toHaveBeenCalledTimes(2);
    expect(localStorage.clearAppData).not.toHaveBeenCalled();
  });

  it('should clear data when both confirmations are accepted', () => {
    global.confirm = jest.fn(() => true);

    render(<ClearDataButton />);

    const button = screen.getByText('settings.clearData.button');
    fireEvent.click(button);

    expect(global.confirm).toHaveBeenCalledTimes(2);
    expect(localStorage.clearAppData).toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith('settings.clearData.success');
    // window.location.reload is called but throws in jsdom - we just verify the error was logged
    expect(console.error).toHaveBeenCalled();
  });
});
