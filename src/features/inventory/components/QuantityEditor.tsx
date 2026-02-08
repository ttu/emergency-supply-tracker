import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Quantity, Unit } from '@/shared/types';
import { Button } from '@/shared/components/Button';
import styles from './QuantityEditor.module.css';

export interface QuantityEditorProps {
  quantity: Quantity;
  unit: Unit;
  onQuantityChange: (newQuantity: Quantity) => void;
  onFullEdit?: () => void;
  onCancel?: () => void;
  /** Whether quantity is a decimal value (for continuous units like kg, L) */
  allowDecimal?: boolean;
}

export function QuantityEditor({
  quantity,
  unit,
  onQuantityChange,
  onFullEdit,
  onCancel,
  allowDecimal = false,
}: QuantityEditorProps) {
  const { t } = useTranslation(['common', 'units']);
  const [localValue, setLocalValue] = useState(quantity.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when component mounts
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleIncrement = useCallback(() => {
    const current = parseFloat(localValue) || 0;
    const newValue = allowDecimal ? current + 1 : Math.floor(current) + 1;
    setLocalValue(newValue.toString());
  }, [localValue, allowDecimal]);

  const handleDecrement = useCallback(() => {
    const current = parseFloat(localValue) || 0;
    const newValue = Math.max(
      0,
      allowDecimal ? current - 1 : Math.floor(current) - 1,
    );
    setLocalValue(newValue.toString());
  }, [localValue, allowDecimal]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Allow empty string for easier editing
      if (value === '') {
        setLocalValue('');
        return;
      }
      // Validate numeric input
      const numValue = allowDecimal ? parseFloat(value) : parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        setLocalValue(value);
      }
    },
    [allowDecimal],
  );

  const handleSave = useCallback(() => {
    const numValue = parseFloat(localValue) || 0;
    const finalValue = Math.max(0, numValue);
    onQuantityChange(finalValue as Quantity);
  }, [localValue, onQuantityChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      }
    },
    [handleSave, onCancel, handleIncrement, handleDecrement],
  );

  return (
    <div className={styles.container} data-testid="quantity-editor">
      <div className={styles.inputGroup}>
        <button
          type="button"
          className={styles.incrementButton}
          onClick={handleDecrement}
          aria-label={t('inventory.quickEdit.decrease')}
          data-testid="quantity-decrease"
        >
          −
        </button>
        <input
          ref={inputRef}
          type="text"
          inputMode={allowDecimal ? 'decimal' : 'numeric'}
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={styles.input}
          aria-label={t('inventory.quickEdit.quantity')}
          data-testid="quantity-input"
        />
        <button
          type="button"
          className={styles.incrementButton}
          onClick={handleIncrement}
          aria-label={t('inventory.quickEdit.increase')}
          data-testid="quantity-increase"
        >
          +
        </button>
        <span className={styles.unit}>{t(unit, { ns: 'units' })}</span>
      </div>
      <div className={styles.actions}>
        <Button
          type="button"
          variant="primary"
          size="small"
          onClick={handleSave}
          data-testid="quantity-save"
        >
          {t('common.save')}
        </Button>
        {onFullEdit && (
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={onFullEdit}
            data-testid="quantity-full-edit"
          >
            {t('inventory.quickEdit.fullEdit')}
          </Button>
        )}
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={onCancel}
            data-testid="quantity-cancel"
          >
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </div>
  );
}
