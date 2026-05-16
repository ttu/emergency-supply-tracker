import type { ReactNode } from 'react';
import {
  Caption,
  NumberDisplay,
  Panel,
} from '@/shared/components/design-v2/primitives';
import type { DesignStatus } from '@/shared/utils/designStatus';

interface KpiTileProps {
  label: string;
  value: number | string;
  suffix?: string;
  size?: number;
  tone?: DesignStatus;
  /** Optional content below the number (status bar, sub-label, etc.). */
  children?: ReactNode;
}

/**
 * Single KPI card used in the Dashboard top metrics row. Caption above,
 * big number below, optional supporting content (mini status bar, etc.).
 */
export function KpiTile({
  label,
  value,
  suffix,
  size = 56,
  tone,
  children,
}: KpiTileProps) {
  return (
    <Panel padding={20}>
      <Caption>{label}</Caption>
      <div style={{ marginTop: 12 }}>
        <NumberDisplay value={value} suffix={suffix} size={size} tone={tone} />
      </div>
      {children}
    </Panel>
  );
}
