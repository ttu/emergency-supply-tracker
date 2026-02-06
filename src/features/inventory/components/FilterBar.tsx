import { useTranslation } from 'react-i18next';
import { Select } from '@/shared/components/Select';
import { Input } from '@/shared/components/Input';
import type { ItemStatus } from '@/shared/types';
import styles from './FilterBar.module.css';

/** Filter value: 'all' | 'none' | specific location string */
export type LocationFilter = string;

export interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ItemStatus | 'all';
  onStatusFilterChange: (status: ItemStatus | 'all') => void;
  locationFilter: LocationFilter;
  onLocationFilterChange: (location: LocationFilter) => void;
  locations: string[];
  sortBy: 'name' | 'quantity' | 'expiration';
  onSortByChange: (sortBy: 'name' | 'quantity' | 'expiration') => void;
}

export const FilterBar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  locationFilter,
  onLocationFilterChange,
  locations,
  sortBy,
  onSortByChange,
}: FilterBarProps) => {
  const { t } = useTranslation();

  const statusOptions = [
    { value: 'all', label: t('inventory.filter.allStatuses') },
    { value: 'ok', label: t('status.ok') },
    { value: 'warning', label: t('status.warning') },
    { value: 'critical', label: t('status.critical') },
  ];

  const locationOptions = [
    { value: 'all', label: t('inventory.filter.allLocations') },
    { value: 'none', label: t('inventory.filter.noLocation') },
    ...locations.map((loc) => ({ value: loc, label: loc })),
  ];

  const sortOptions = [
    { value: 'name', label: t('inventory.sort.name') },
    { value: 'quantity', label: t('inventory.sort.quantity') },
    { value: 'expiration', label: t('inventory.sort.expiration') },
  ];

  return (
    <div className={styles.filterBar}>
      <div className={styles.search}>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('inventory.searchPlaceholder')}
          aria-label={t('inventory.searchLabel')}
        />
      </div>

      <div className={styles.filters}>
        <Select
          value={statusFilter}
          onChange={(e) =>
            onStatusFilterChange(e.target.value as ItemStatus | 'all')
          }
          options={statusOptions}
          label={t('inventory.filter.status')}
        />

        <Select
          value={locationFilter}
          onChange={(e) =>
            onLocationFilterChange(e.target.value as LocationFilter)
          }
          options={locationOptions}
          label={t('inventory.filter.location')}
        />

        <Select
          value={sortBy}
          onChange={(e) =>
            onSortByChange(e.target.value as 'name' | 'quantity' | 'expiration')
          }
          options={sortOptions}
          label={t('inventory.sort.label')}
        />
      </div>
    </div>
  );
};
