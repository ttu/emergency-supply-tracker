import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/components/Card';
import type { KitInfo } from '@/shared/types';
import styles from './KitCard.module.css';

export interface KitCardProps {
  readonly kit: KitInfo;
  readonly isSelected?: boolean;
  readonly onSelect?: (kit: KitInfo) => void;
  readonly onDelete?: (kit: KitInfo) => void;
  readonly showActions?: boolean;
}

export function KitCard({
  kit,
  isSelected = false,
  onSelect,
  onDelete,
  showActions = false,
}: KitCardProps) {
  const { t } = useTranslation();

  const handleClick = () => {
    onSelect?.(kit);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(kit);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(kit);
  };

  return (
    <Card
      variant={isSelected ? 'elevated' : 'outlined'}
      padding="medium"
      className={`${styles.card} ${isSelected ? styles.selected : ''} ${onSelect ? styles.clickable : ''}`}
      onClick={onSelect ? handleClick : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
      data-testid={`kit-card-${kit.id}`}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{kit.name}</h3>
          {kit.isBuiltIn && (
            <span className={styles.badge} data-testid="built-in-badge">
              {t('kits.builtIn')}
            </span>
          )}
        </div>

        {kit.description && (
          <p className={styles.description}>{kit.description}</p>
        )}

        <div className={styles.meta}>
          <span className={styles.itemCount}>
            {t('kits.itemCount', { count: kit.itemCount })}
          </span>
        </div>

        {showActions && !kit.isBuiltIn && onDelete && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={handleDelete}
              data-testid={`delete-kit-${kit.id}`}
              aria-label={t('kits.deleteKit', { name: kit.name })}
            >
              {t('actions.delete')}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
