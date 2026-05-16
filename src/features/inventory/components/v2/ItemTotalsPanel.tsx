import {
  Caption,
  NumberDisplay,
  Panel,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { InventoryItem } from '@/shared/types';

interface ItemTotalsPanelProps {
  item: InventoryItem;
}

/** Stack totals: total kcal, weight, water, capacity Wh derived from per-unit. */
export function ItemTotalsPanel({ item }: ItemTotalsPanelProps) {
  const { themeKey } = useDesignTheme();

  const totalCalories =
    item.caloriesPerUnit !== undefined
      ? item.caloriesPerUnit * item.quantity
      : undefined;
  const totalWeightG =
    item.weightGrams !== undefined
      ? item.weightGrams * item.quantity
      : undefined;
  const totalWaterL =
    item.requiresWaterLiters !== undefined
      ? item.requiresWaterLiters * item.quantity
      : undefined;
  const totalCapacityWh =
    item.capacityWh !== undefined ? item.capacityWh * item.quantity : undefined;

  const hasTotals =
    totalCalories !== undefined ||
    totalWeightG !== undefined ||
    totalWaterL !== undefined ||
    totalCapacityWh !== undefined;

  if (!hasTotals) return null;

  return (
    <Panel padding={20}>
      <Caption>
        {themeKey === 'pantry' ? 'Stack totals' : 'TOTALS · CURRENT QTY'}
      </Caption>
      <div
        style={{
          marginTop: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {totalCalories !== undefined && (
          <TotalsRow
            label={themeKey === 'pantry' ? 'Total calories' : 'KCAL TOTAL'}
            value={totalCalories.toLocaleString()}
            suffix="kcal"
            detail={`${item.caloriesPerUnit} kcal × ${item.quantity} ${item.unit}`}
          />
        )}
        {totalWeightG !== undefined && (
          <TotalsRow
            label={themeKey === 'pantry' ? 'Total weight' : 'WEIGHT TOTAL'}
            value={
              totalWeightG >= 1000
                ? (totalWeightG / 1000).toFixed(1)
                : String(totalWeightG)
            }
            suffix={totalWeightG >= 1000 ? 'kg' : 'g'}
            detail={`${item.weightGrams} g × ${item.quantity} ${item.unit}`}
          />
        )}
        {totalWaterL !== undefined && (
          <TotalsRow
            label={
              themeKey === 'pantry' ? 'Water needed to prepare' : 'WATER · PREP'
            }
            value={totalWaterL.toFixed(1)}
            suffix="L"
            detail={`${item.requiresWaterLiters} L × ${item.quantity} ${item.unit}`}
          />
        )}
        {totalCapacityWh !== undefined && (
          <TotalsRow
            label={themeKey === 'pantry' ? 'Total capacity' : 'CAPACITY TOTAL'}
            value={totalCapacityWh.toLocaleString()}
            suffix="Wh"
            detail={`${item.capacityWh} Wh × ${item.quantity} ${item.unit}`}
          />
        )}
      </div>
    </Panel>
  );
}

function TotalsRow({
  label,
  value,
  suffix,
  detail,
}: {
  label: string;
  value: string;
  suffix: string;
  detail: string;
}) {
  return (
    <div>
      <Caption>{label}</Caption>
      <div
        style={{
          marginTop: 4,
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
        }}
      >
        <NumberDisplay value={value} size={28} />
        <span style={{ fontSize: 12, color: 'var(--color-text-2)' }}>
          {suffix}
        </span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--color-text-3)',
          marginTop: 2,
          letterSpacing: '0.04em',
        }}
      >
        {detail}
      </div>
    </div>
  );
}
