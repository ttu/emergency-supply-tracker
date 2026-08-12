import { useTranslation } from 'react-i18next';
import {
  Caption,
  Panel,
  StatusDot,
  StatusPill,
} from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';
import { selectPriorityRows } from '../../utils/priorityRows';
import styles from './PriorityQueue.module.css';

interface PriorityQueueProps {
  onViewAll: () => void;
  /** How many priority rows to show. Defaults to 5. */
  limit?: number;
}

export function PriorityQueue({
  onViewAll,
  limit = 5,
}: Readonly<PriorityQueueProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { rows } = useDesignData();
  const priority = selectPriorityRows(rows, limit);

  return (
    <Panel padding={0}>
      <div className={styles.header}>
        <Caption>{t(`v2.dashboard.priorityTitle.${themeKey}`)}</Caption>
        <button
          type="button"
          onClick={onViewAll}
          className={styles.viewAllButton}
        >
          {t('v2.dashboard.priorityViewAll')}
        </button>
      </div>
      {priority.length === 0 && (
        <div className={styles.empty}>
          {t(`v2.dashboard.priorityEmpty.${themeKey}`)}
        </div>
      )}
      {priority.map((r, i) => (
        <div
          key={String(r.item.id)}
          className={`${styles.row} ${i === priority.length - 1 ? styles.rowLast : ''}`}
        >
          <StatusDot status={r.status} size={7} />
          <div>
            <div className={styles.itemName}>{r.item.name}</div>
            <div className={styles.itemMeta}>
              {t('v2.dashboard.priorityMeta', {
                code: r.categoryCode,
                quantity: r.item.quantity,
                recommended: r.recommended || '—',
                unit: t(r.item.unit, { ns: 'units' }),
              })}
              {r.item.expirationDate
                ? t('v2.dashboard.priorityExpires', {
                    date: r.item.expirationDate,
                  })
                : ''}
            </div>
          </div>
          <StatusPill status={r.status} />
        </div>
      ))}
    </Panel>
  );
}
