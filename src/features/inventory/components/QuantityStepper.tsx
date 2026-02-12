import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Unit } from '@/shared/types';
import styles from './QuantityStepper.module.css';

export interface QuantityStepperProps {
  quantity: number;
  unit: Unit;
  min?: number;
  onChange: (newQuantity: number) => void;
  disabled?: boolean;
  showPulse?: boolean;
}

const QuantityStepperComponent = ({
  quantity,
  unit,
  min = 0,
  onChange,
  disabled = false,
  showPulse = false,
}: QuantityStepperProps) => {
  const { t } = useTranslation(['common', 'units']);

  const isAtMin = quantity <= min;

  const handleDecrease = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isAtMin && !disabled) {
        onChange(quantity - 1);
      }
    },
    [quantity, isAtMin, disabled, onChange],
  );

  const handleIncrease = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) {
        onChange(quantity + 1);
      }
    },
    [quantity, disabled, onChange],
  );

  const containerClass = [styles.stepper, showPulse && styles.pulse]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.button}
          onClick={handleDecrease}
          disabled={isAtMin || disabled}
          aria-disabled={isAtMin || disabled}
          aria-label={t('inventory.quantityStepper.decrease')}
        >
          −
        </button>
        <output className={styles.value} aria-live="polite" aria-atomic="true">
          {quantity}
        </output>
        <button
          type="button"
          className={styles.button}
          onClick={handleIncrease}
          disabled={disabled}
          aria-label={t('inventory.quantityStepper.increase')}
        >
          +
        </button>
      </div>
      <span className={styles.unit}>{t(unit, { ns: 'units' })}</span>
    </div>
  );
};

export const QuantityStepper = memo(QuantityStepperComponent);
