import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
  forwardRef,
  useId,
} from 'react';
import { Input, InputProps } from './Input';
import styles from './AutocompleteInput.module.css';

export interface AutocompleteInputProps extends Omit<
  InputProps,
  'onSelect' | 'onChange'
> {
  suggestions: string[];
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
}

export const AutocompleteInput = forwardRef<
  HTMLInputElement,
  AutocompleteInputProps
>(
  (
    { suggestions, value, onChange, onSelect, id, ...inputProps },
    forwardedRef,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);
    const generatedId = useId();
    const inputId = id || generatedId;
    const listboxId = `${inputId}-listbox`;

    // Filter suggestions based on input value
    const filteredSuggestions = suggestions.filter(
      (suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase()) &&
        suggestion.toLowerCase() !== value.toLowerCase(),
    );

    const showDropdown = isOpen && filteredSuggestions.length > 0;

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll highlighted item into view
    useEffect(() => {
      if (highlightedIndex >= 0 && listboxRef.current) {
        const highlightedItem = listboxRef.current.children[
          highlightedIndex
        ] as HTMLElement;
        // scrollIntoView may not be available in test environment
        if (highlightedItem?.scrollIntoView) {
          highlightedItem.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [highlightedIndex]);

    const handleSelect = useCallback(
      (suggestion: string) => {
        onChange(suggestion);
        onSelect?.(suggestion);
        setIsOpen(false);
        setHighlightedIndex(-1);
      },
      [onChange, onSelect],
    );

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown) {
        if (event.key === 'ArrowDown' && filteredSuggestions.length > 0) {
          setIsOpen(true);
          setHighlightedIndex(0);
          event.preventDefault();
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
          );
          break;
        case 'Enter':
          if (highlightedIndex >= 0) {
            event.preventDefault();
            handleSelect(filteredSuggestions[highlightedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        case 'Tab':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
      setIsOpen(true);
      setHighlightedIndex(-1);
    };

    const handleFocus = () => {
      if (filteredSuggestions.length > 0) {
        setIsOpen(true);
      }
    };

    return (
      <div className={styles.container} ref={containerRef}>
        <Input
          ref={forwardedRef}
          id={inputId}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls={showDropdown ? listboxId : undefined}
          aria-activedescendant={
            showDropdown && highlightedIndex >= 0
              ? `${listboxId}-option-${highlightedIndex}`
              : undefined
          }
          aria-autocomplete="list"
          autoComplete="off"
          {...inputProps}
        />
        {showDropdown && (
          <ul
            id={listboxId}
            ref={listboxRef}
            className={styles.dropdown}
            role="listbox"
            aria-label={inputProps.label || 'Suggestions'}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === highlightedIndex}
                className={`${styles.option} ${index === highlightedIndex ? styles.highlighted : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(suggestion);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);

AutocompleteInput.displayName = 'AutocompleteInput';
