import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from './useKeyboardNavigation';

/**
 * Mutation-killing tests for useKeyboardNavigation.
 * Targets surviving mutants around:
 * - L63: default case early return (no preventDefault for unhandled keys)
 * - L71: container block (focus must be called on navigation)
 * - L76-77: Array.from + filter logic for focusable elements (tabindex filtering)
 * - L83: handleKeyDown dependency array
 * - L91: getItemProps dependency array
 */
describe('useKeyboardNavigation – mutation kills', () => {
  const mockOnIndexChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('default case early return (L63)', () => {
    it('should NOT call preventDefault for unhandled keys', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 2,
          onIndexChange: mockOnIndexChange,
        }),
      );

      const preventDefault = vi.fn();
      act(() => {
        result.current.handleKeyDown({
          key: 'Tab',
          preventDefault,
        } as unknown as React.KeyboardEvent);
      });

      expect(preventDefault).not.toHaveBeenCalled();
      expect(mockOnIndexChange).not.toHaveBeenCalled();
    });

    it('should call preventDefault for handled keys (ArrowRight)', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      const preventDefault = vi.fn();
      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault,
        } as unknown as React.KeyboardEvent);
      });

      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it('should call preventDefault for Home key', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 2,
          onIndexChange: mockOnIndexChange,
        }),
      );

      const preventDefault = vi.fn();
      act(() => {
        result.current.handleKeyDown({
          key: 'Home',
          preventDefault,
        } as unknown as React.KeyboardEvent);
      });

      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it('should call preventDefault for End key', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 5,
          currentIndex: 2,
          onIndexChange: mockOnIndexChange,
        }),
      );

      const preventDefault = vi.fn();
      act(() => {
        result.current.handleKeyDown({
          key: 'End',
          preventDefault,
        } as unknown as React.KeyboardEvent);
      });

      expect(preventDefault).toHaveBeenCalledTimes(1);
    });
  });

  function createContainer(buttonConfigs: { tabindex?: string }[]) {
    const container = document.createElement('div');
    buttonConfigs.forEach(({ tabindex }) => {
      const btn = document.createElement('button');
      if (tabindex !== undefined) {
        btn.setAttribute('tabindex', tabindex);
      }
      btn.focus = vi.fn();
      container.appendChild(btn);
    });
    document.body.appendChild(container);
    return container;
  }

  describe('focus management with containerRef (L71, L76, L77)', () => {
    it('should focus the new item when navigating and container exists', () => {
      const container = createContainer([
        { tabindex: '0' },
        { tabindex: '0' },
        { tabindex: '0' },
      ]);

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 3,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      // Manually set the containerRef
      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
      // The second button (index 1) should be focused
      const buttons = container.querySelectorAll('button');
      expect(buttons[1].focus).toHaveBeenCalled();
      container.remove();
    });

    it('should focus the correct element when navigating with all focusable buttons', () => {
      const container = createContainer([
        { tabindex: '0' },
        { tabindex: '0' },
        { tabindex: '0' },
      ]);

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 3,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      const buttons = container.querySelectorAll('button');
      expect(buttons[1].focus).toHaveBeenCalled();

      container.remove();
    });

    it('should NOT focus any element when container is null', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 3,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      // containerRef.current is null by default
      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      // Should still call onIndexChange even without container
      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
    });

    it('should filter out elements with tabindex="-1" that are not natively focusable', () => {
      const container = document.createElement('div');

      // A div with tabindex="0" - focusable (getAttribute !== '-1')
      const div1 = document.createElement('div');
      div1.setAttribute('tabindex', '0');
      div1.focus = vi.fn();
      container.appendChild(div1);

      // A div with tabindex="-1" - NOT focusable
      // getAttribute('tabindex') === '-1' → true (first part false)
      // el.tabIndex === -1 → >=0 is false (second part false)
      // Filter returns false → excluded
      const div2 = document.createElement('div');
      div2.setAttribute('tabindex', '-1');
      div2.focus = vi.fn();
      container.appendChild(div2);

      // A div with tabindex="0" - focusable
      const div3 = document.createElement('div');
      div3.setAttribute('tabindex', '0');
      div3.focus = vi.fn();
      container.appendChild(div3);

      document.body.appendChild(container);

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 2, // Only 2 focusable items
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
      // div2 (tabindex="-1") should be skipped, so index 1 maps to div3
      expect(div3.focus).toHaveBeenCalled();
      expect(div2.focus).not.toHaveBeenCalled();

      container.remove();
    });

    it('should include natively focusable buttons even without explicit tabindex', () => {
      const container = document.createElement('div');

      // Button without tabindex attribute - natively focusable
      // getAttribute('tabindex') returns null, !== '-1' is true → included
      const btn1 = document.createElement('button');
      btn1.focus = vi.fn();
      container.appendChild(btn1);

      const btn2 = document.createElement('button');
      btn2.focus = vi.fn();
      container.appendChild(btn2);

      document.body.appendChild(container);

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 2,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(btn2.focus).toHaveBeenCalled();

      container.remove();
    });

    it('should focus correct item on Home key with container', () => {
      const container = createContainer([
        { tabindex: '0' },
        { tabindex: '0' },
        { tabindex: '0' },
      ]);

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 3,
          currentIndex: 2,
          onIndexChange: mockOnIndexChange,
        }),
      );

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      act(() => {
        result.current.handleKeyDown({
          key: 'Home',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      const buttons = container.querySelectorAll('button');
      expect(buttons[0].focus).toHaveBeenCalled();

      container.remove();
    });

    it('should focus correct item on End key with container', () => {
      const container = createContainer([
        { tabindex: '0' },
        { tabindex: '0' },
        { tabindex: '0' },
      ]);

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 3,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      act(() => {
        result.current.handleKeyDown({
          key: 'End',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      const buttons = container.querySelectorAll('button');
      expect(buttons[2].focus).toHaveBeenCalled();

      container.remove();
    });

    it('should use Array.from to convert NodeList before filtering', () => {
      // This test ensures Array.from is actually called on the querySelectorAll result.
      // If Array.from is replaced with identity, filter won't exist on NodeList.
      const container = document.createElement('div');

      const btn1 = document.createElement('button');
      btn1.setAttribute('tabindex', '0');
      btn1.focus = vi.fn();
      container.appendChild(btn1);

      const btn2 = document.createElement('button');
      btn2.setAttribute('tabindex', '0');
      btn2.focus = vi.fn();
      container.appendChild(btn2);

      document.body.appendChild(container);

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 2,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      // Should not throw - Array.from converts NodeList to Array for .filter
      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(btn2.focus).toHaveBeenCalled();

      container.remove();
    });
  });

  describe('tabindex filtering edge cases (L77)', () => {
    it('should include element with tabindex="1" (positive tabindex)', () => {
      const container = document.createElement('div');

      const div1 = document.createElement('div');
      div1.setAttribute('tabindex', '0');
      div1.focus = vi.fn();
      container.appendChild(div1);

      // tabindex="1": getAttribute !== '-1' is true → included
      const div2 = document.createElement('div');
      div2.setAttribute('tabindex', '1');
      div2.focus = vi.fn();
      container.appendChild(div2);

      document.body.appendChild(container);

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 2,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(div2.focus).toHaveBeenCalled();
      container.remove();
    });

    it('should handle getAttribute returning empty string for tabindex=""', () => {
      const container = document.createElement('div');

      const div1 = document.createElement('div');
      div1.setAttribute('tabindex', '0');
      div1.focus = vi.fn();
      container.appendChild(div1);

      // tabindex="": getAttribute !== '-1' is true → included
      // This kills the StringLiteral mutant that replaces '-1' with ''
      const div2 = document.createElement('div');
      div2.setAttribute('tabindex', '');
      div2.focus = vi.fn();
      container.appendChild(div2);

      document.body.appendChild(container);

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 2,
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      // Element with tabindex="" should be included (it's not "-1")
      expect(div2.focus).toHaveBeenCalled();
      container.remove();
    });

    it('should correctly differentiate tabindex="-1" from tabindex="0"', () => {
      const container = document.createElement('div');

      // First: tabindex="0" (focusable)
      const div1 = document.createElement('div');
      div1.setAttribute('tabindex', '0');
      div1.focus = vi.fn();
      container.appendChild(div1);

      // Second: tabindex="-1" (not focusable per filter)
      const divHidden = document.createElement('div');
      divHidden.setAttribute('tabindex', '-1');
      divHidden.focus = vi.fn();
      container.appendChild(divHidden);

      // Third: tabindex="0" (focusable)
      const div2 = document.createElement('div');
      div2.setAttribute('tabindex', '0');
      div2.focus = vi.fn();
      container.appendChild(div2);

      // Fourth: tabindex="-1" (not focusable per filter)
      const divHidden2 = document.createElement('div');
      divHidden2.setAttribute('tabindex', '-1');
      divHidden2.focus = vi.fn();
      container.appendChild(divHidden2);

      document.body.appendChild(container);

      const { result } = renderHook(() =>
        useKeyboardNavigation({
          itemCount: 2, // Only 2 focusable
          currentIndex: 0,
          onIndexChange: mockOnIndexChange,
        }),
      );

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      });

      act(() => {
        result.current.handleKeyDown({
          key: 'End',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      // Index 1 in focusable items should be div2 (third element overall)
      expect(div2.focus).toHaveBeenCalled();
      expect(divHidden.focus).not.toHaveBeenCalled();
      expect(divHidden2.focus).not.toHaveBeenCalled();
      container.remove();
    });
  });

  describe('dependency array mutations (L83, L91)', () => {
    it('should update handleKeyDown when currentIndex changes', () => {
      const onIndexChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ currentIndex }) =>
          useKeyboardNavigation({
            itemCount: 5,
            currentIndex,
            onIndexChange,
            orientation: 'horizontal',
          }),
        { initialProps: { currentIndex: 0 } },
      );

      const handler1 = result.current.handleKeyDown;

      // Change currentIndex
      rerender({ currentIndex: 2 });

      const handler2 = result.current.handleKeyDown;

      // Handler should be recreated when currentIndex changes
      expect(handler1).not.toBe(handler2);
    });

    it('should update handleKeyDown when itemCount changes', () => {
      const onIndexChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ itemCount }) =>
          useKeyboardNavigation({
            itemCount,
            currentIndex: 0,
            onIndexChange,
            orientation: 'horizontal',
          }),
        { initialProps: { itemCount: 5 } },
      );

      const handler1 = result.current.handleKeyDown;

      rerender({ itemCount: 10 });

      const handler2 = result.current.handleKeyDown;
      expect(handler1).not.toBe(handler2);
    });

    it('should update handleKeyDown when onIndexChange changes', () => {
      const onIndexChange1 = vi.fn();
      const onIndexChange2 = vi.fn();
      const { result, rerender } = renderHook(
        ({ onIndexChange }) =>
          useKeyboardNavigation({
            itemCount: 5,
            currentIndex: 0,
            onIndexChange,
            orientation: 'horizontal',
          }),
        { initialProps: { onIndexChange: onIndexChange1 } },
      );

      const handler1 = result.current.handleKeyDown;

      rerender({ onIndexChange: onIndexChange2 });

      const handler2 = result.current.handleKeyDown;
      expect(handler1).not.toBe(handler2);
    });

    it('should update handleKeyDown when orientation changes', () => {
      const onIndexChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ orientation }: { orientation: 'horizontal' | 'vertical' }) =>
          useKeyboardNavigation({
            itemCount: 5,
            currentIndex: 0,
            onIndexChange,
            orientation,
          }),
        {
          initialProps: {
            orientation: 'horizontal' as 'horizontal' | 'vertical',
          },
        },
      );

      const handler1 = result.current.handleKeyDown;

      rerender({ orientation: 'vertical' as const });

      const handler2 = result.current.handleKeyDown;
      expect(handler1).not.toBe(handler2);
    });

    it('should update handleKeyDown when loop changes', () => {
      const onIndexChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ loop }) =>
          useKeyboardNavigation({
            itemCount: 5,
            currentIndex: 0,
            onIndexChange,
            orientation: 'horizontal',
            loop,
          }),
        { initialProps: { loop: true } },
      );

      const handler1 = result.current.handleKeyDown;

      rerender({ loop: false });

      const handler2 = result.current.handleKeyDown;
      expect(handler1).not.toBe(handler2);
    });

    it('should NOT recreate handleKeyDown when nothing changes', () => {
      const onIndexChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ currentIndex }) =>
          useKeyboardNavigation({
            itemCount: 5,
            currentIndex,
            onIndexChange,
            orientation: 'horizontal',
          }),
        { initialProps: { currentIndex: 0 } },
      );

      const handler1 = result.current.handleKeyDown;

      // Re-render with same props
      rerender({ currentIndex: 0 });

      const handler2 = result.current.handleKeyDown;
      expect(handler1).toBe(handler2);
    });

    it('should update getItemProps when currentIndex changes', () => {
      const onIndexChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ currentIndex }) =>
          useKeyboardNavigation({
            itemCount: 5,
            currentIndex,
            onIndexChange,
          }),
        { initialProps: { currentIndex: 0 } },
      );

      const getItemProps1 = result.current.getItemProps;

      rerender({ currentIndex: 2 });

      const getItemProps2 = result.current.getItemProps;
      expect(getItemProps1).not.toBe(getItemProps2);
    });

    it('should NOT recreate getItemProps when currentIndex stays the same', () => {
      const onIndexChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ currentIndex }) =>
          useKeyboardNavigation({
            itemCount: 5,
            currentIndex,
            onIndexChange,
          }),
        { initialProps: { currentIndex: 0 } },
      );

      const getItemProps1 = result.current.getItemProps;

      rerender({ currentIndex: 0 });

      const getItemProps2 = result.current.getItemProps;
      expect(getItemProps1).toBe(getItemProps2);
    });

    it('should reflect updated currentIndex in getItemProps after rerender', () => {
      const onIndexChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ currentIndex }) =>
          useKeyboardNavigation({
            itemCount: 5,
            currentIndex,
            onIndexChange,
          }),
        { initialProps: { currentIndex: 0 } },
      );

      // Initially index 0 is selected
      expect(result.current.getItemProps(0).tabIndex).toBe(0);
      expect(result.current.getItemProps(2).tabIndex).toBe(-1);

      rerender({ currentIndex: 2 });

      // After rerender, index 2 should be selected
      expect(result.current.getItemProps(0).tabIndex).toBe(-1);
      expect(result.current.getItemProps(2).tabIndex).toBe(0);
      expect(result.current.getItemProps(2)['aria-selected']).toBe(true);
      expect(result.current.getItemProps(0)['aria-selected']).toBe(false);
    });
  });

  describe('handleKeyDown uses current values after rerender', () => {
    it('should use updated currentIndex value after rerender', () => {
      const onIndexChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ currentIndex }) =>
          useKeyboardNavigation({
            itemCount: 5,
            currentIndex,
            onIndexChange,
            orientation: 'horizontal',
          }),
        { initialProps: { currentIndex: 0 } },
      );

      // Move to index 2
      rerender({ currentIndex: 2 });

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      // Should go from 2 to 3, not from 0 to 1
      expect(onIndexChange).toHaveBeenCalledWith(3);
    });

    it('should use updated itemCount after rerender', () => {
      const onIndexChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ itemCount }) =>
          useKeyboardNavigation({
            itemCount,
            currentIndex: 0,
            onIndexChange,
            orientation: 'horizontal',
            loop: true,
          }),
        { initialProps: { itemCount: 3 } },
      );

      // Change item count
      rerender({ itemCount: 10 });

      // Press ArrowLeft at index 0 with loop -> should go to last (9, not 2)
      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowLeft',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onIndexChange).toHaveBeenCalledWith(9);
    });
  });
});
