import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from './useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  const mockOnIndexChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('horizontal navigation', () => {
    it('should navigate to next item on ArrowRight', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
          orientation: 'horizontal',
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
    });

    it('should navigate to previous item on ArrowLeft', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 2,
          onIndexChange: mockOnIndexChange,
          orientation: 'horizontal',
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowLeft',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
    });

    it('should loop to last item when at first and pressing ArrowLeft', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
          orientation: 'horizontal',
          loop: true,
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowLeft',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(4);
    });

    it('should loop to first item when at last and pressing ArrowRight', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 4,
          onIndexChange: mockOnIndexChange,
          orientation: 'horizontal',
          loop: true,
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(0);
    });

    it('should not change index when at first and pressing ArrowLeft with loop disabled', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
          orientation: 'horizontal',
          loop: false,
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowLeft',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).not.toHaveBeenCalled();
    });

    it('should not change index when at last and pressing ArrowRight with loop disabled', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 4,
          onIndexChange: mockOnIndexChange,
          orientation: 'horizontal',
          loop: false,
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).not.toHaveBeenCalled();
    });
  });

  describe('vertical navigation', () => {
    it('should navigate to next item on ArrowDown', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
          orientation: 'vertical',
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowDown',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
    });

    it('should navigate to previous item on ArrowUp', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 2,
          onIndexChange: mockOnIndexChange,
          orientation: 'vertical',
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowUp',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
    });

    it('should loop to last item when at first and pressing ArrowUp', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
          orientation: 'vertical',
          loop: true,
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowUp',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(4);
    });

    it('should loop to first item when at last and pressing ArrowDown', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 4,
          onIndexChange: mockOnIndexChange,
          orientation: 'vertical',
          loop: true,
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowDown',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Home and End keys', () => {
    it('should navigate to first item on Home', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 3,
          onIndexChange: mockOnIndexChange,
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'Home',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(0);
    });

    it('should navigate to last item on End', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 1,
          onIndexChange: mockOnIndexChange,
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'End',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(4);
    });

    it('should not call onIndexChange when already at first and pressing Home', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'Home',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).not.toHaveBeenCalled();
    });

    it('should not call onIndexChange when already at last and pressing End', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 4,
          onIndexChange: mockOnIndexChange,
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'End',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).not.toHaveBeenCalled();
    });
  });

  describe('getItemProps', () => {
    it('should return tabIndex 0 for current item', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 2,
          onIndexChange: mockOnIndexChange,
        }),
      );

      const props = result.current.getItemProps(2);
      expect(props.tabIndex).toBe(0);
      expect(props['aria-selected']).toBe(true);
    });

    it('should return tabIndex -1 for non-current items', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 2,
          onIndexChange: mockOnIndexChange,
        }),
      );

      const props = result.current.getItemProps(0);
      expect(props.tabIndex).toBe(-1);
      expect(props['aria-selected']).toBe(false);
    });
  });

  describe('other keys', () => {
    it('should not call onIndexChange for unhandled keys', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 2,
          onIndexChange: mockOnIndexChange,
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'Tab',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).not.toHaveBeenCalled();
    });

    it('should not call onIndexChange for Enter key', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 2,
          onIndexChange: mockOnIndexChange,
        }),
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'Enter',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).not.toHaveBeenCalled();
    });
  });

  describe('default values', () => {
    it('should default to horizontal orientation', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      // ArrowRight should work by default (horizontal)
      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
    });

    it('should default to loop enabled', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      // Pressing ArrowLeft at first should loop to last
      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowLeft',
          preventDefault: jest.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(4);
    });
  });

  describe('containerRef', () => {
    it('should return a containerRef', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull();
    });
  });
});
