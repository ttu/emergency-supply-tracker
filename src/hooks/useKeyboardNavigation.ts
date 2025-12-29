import { useCallback, useRef } from 'react';

interface UseKeyboardNavigationOptions {
  itemCount: number;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
  loop?: boolean;
}

/**
 * Hook for implementing keyboard navigation in lists with arrow keys.
 * Implements the roving tabindex pattern for accessible navigation.
 *
 * @param options Configuration for keyboard navigation
 * @returns Object with refs and handlers for implementing keyboard navigation
 */
export function useKeyboardNavigation({
  itemCount,
  currentIndex,
  onIndexChange,
  orientation = 'horizontal',
  loop = true,
}: UseKeyboardNavigationOptions) {
  const containerRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
      const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

      let newIndex = currentIndex;

      switch (event.key) {
        case prevKey:
          event.preventDefault();
          if (currentIndex > 0) {
            newIndex = currentIndex - 1;
          } else if (loop) {
            newIndex = itemCount - 1;
          }
          break;

        case nextKey:
          event.preventDefault();
          if (currentIndex < itemCount - 1) {
            newIndex = currentIndex + 1;
          } else if (loop) {
            newIndex = 0;
          }
          break;

        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;

        case 'End':
          event.preventDefault();
          newIndex = itemCount - 1;
          break;

        default:
          return;
      }

      if (newIndex !== currentIndex) {
        onIndexChange(newIndex);
        // Focus the new item
        const container = containerRef.current;
        if (container) {
          const items = container.querySelectorAll<HTMLElement>(
            '[role="tab"], [role="menuitem"], button, [tabindex]',
          );
          items[newIndex]?.focus();
        }
      }
    },
    [currentIndex, itemCount, onIndexChange, orientation, loop],
  );

  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: index === currentIndex ? 0 : -1,
      'aria-selected': index === currentIndex,
    }),
    [currentIndex],
  );

  return {
    containerRef,
    handleKeyDown,
    getItemProps,
  };
}
