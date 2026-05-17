import {
  Caption,
  NumberDisplay,
  Panel,
  StatusBar,
  StatusDot,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { DesignStatus } from '@/shared/utils/designStatus';

interface ItemStatusPanelProps {
  status: DesignStatus;
  pct: number;
  quantity: number;
  recommended: number;
  unit: string;
}

/** Side panel: status dot + percentage + qty/rec + 1-row status bar. */
export function ItemStatusPanel({
  status,
  pct,
  quantity,
  recommended,
  unit,
}: Readonly<ItemStatusPanelProps>) {
  const { themeKey } = useDesignTheme();
  return (
    <Panel padding={20}>
      <Caption>{themeKey === 'pantry' ? 'Status' : 'CURRENT STATUS'}</Caption>
      <div
        style={{
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <StatusDot status={status} size={14} />
        <NumberDisplay value={pct} suffix="%" size={42} tone={status} />
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-2)',
          }}
        >
          {themeKey === 'pantry' ? 'of recommended' : 'OF RECOMMENDED'}
          <br />
          {quantity} / {recommended || '—'} {unit}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <StatusBar
          ok={status === 'ok' ? 1 : 0}
          warn={status === 'warn' ? 1 : 0}
          crit={status === 'crit' ? 1 : 0}
          total={1}
          height={4}
        />
      </div>
    </Panel>
  );
}
