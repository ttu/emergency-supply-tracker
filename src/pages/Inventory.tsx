import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '../hooks/useInventory';
import { useHousehold } from '../hooks/useHousehold';
import { STANDARD_CATEGORIES } from '../data/standardCategories';
import { RECOMMENDED_ITEMS } from '../data/recommendedItems';
import { CategoryNav } from '../components/inventory/CategoryNav';
import { FilterBar } from '../components/inventory/FilterBar';
import { ItemList } from '../components/inventory/ItemList';
import { ItemForm } from '../components/inventory/ItemForm';
import { TemplateSelector } from '../components/inventory/TemplateSelector';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import type {
  InventoryItem,
  ItemStatus,
  RecommendedItemDefinition,
} from '../types';
import { calculateRecommendedQuantity } from '../utils/calculations/household';
import styles from './Inventory.module.css';

type SortBy = 'name' | 'quantity' | 'expiration';

export interface InventoryProps {
  openAddModal?: boolean;
  initialCategoryId?: string;
}

export function Inventory({
  openAddModal = false,
  initialCategoryId,
}: InventoryProps = {}) {
  const { t } = useTranslation(['common', 'products']);
  const { items, addItem, updateItem, deleteItem } = useInventory();
  const { household } = useHousehold();

  // Filter and sort state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategoryId || null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(openAddModal);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(
    undefined,
  );

  // Simple status calculation (inline for now)
  const getItemStatus = (item: InventoryItem): ItemStatus => {
    const percentage = (item.quantity / item.recommendedQuantity) * 100;
    if (percentage === 0) return 'critical';
    if (percentage < 50) return 'warning';
    return 'ok';
  };

  // Filter items
  let filteredItems = items;

  // Filter by category
  if (selectedCategoryId) {
    filteredItems = filteredItems.filter(
      (item) => item.categoryId === selectedCategoryId,
    );
  }

  // Filter by search query
  if (searchQuery) {
    filteredItems = filteredItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  // Filter by status
  if (statusFilter !== 'all') {
    filteredItems = filteredItems.filter((item) => {
      const status = getItemStatus(item);
      return status === statusFilter;
    });
  }

  // Sort items
  filteredItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'quantity':
        return b.quantity - a.quantity;
      case 'expiration':
        if (a.neverExpires && b.neverExpires) return 0;
        if (a.neverExpires) return 1;
        if (b.neverExpires) return -1;
        return (
          new Date(a.expirationDate!).getTime() -
          new Date(b.expirationDate!).getTime()
        );
      default:
        return 0;
    }
  });

  const handleAddItem = (
    itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    addItem(itemData);
    setShowAddModal(false);
    setEditingItem(undefined);
  };

  const handleUpdateItem = (
    itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (editingItem) {
      updateItem(editingItem.id, itemData);
      setShowAddModal(false);
      setEditingItem(undefined);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm(t('inventory.confirmDelete'))) {
      deleteItem(itemId);
      setShowAddModal(false);
      setEditingItem(undefined);
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleSelectTemplate = (template: RecommendedItemDefinition) => {
    const recommendedQty = calculateRecommendedQuantity(template, household);
    const templateName = t(template.i18nKey.replace('products.', ''), {
      ns: 'products',
    });

    const newItem: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> = {
      name: templateName,
      itemType: templateName, // Set the template type
      categoryId: template.category,
      quantity: 0,
      unit: template.unit,
      recommendedQuantity: recommendedQty,
      neverExpires: !template.defaultExpirationMonths,
      expirationDate: template.defaultExpirationMonths
        ? new Date(
            Date.now() +
              template.defaultExpirationMonths * 30 * 24 * 60 * 60 * 1000,
          ).toISOString()
        : undefined,
    };

    setEditingItem(newItem as InventoryItem);
    setShowTemplateModal(false);
    setShowAddModal(true);
  };

  const handleCancelForm = () => {
    setShowAddModal(false);
    setEditingItem(undefined);
  };

  const handleBackToTemplateSelector = () => {
    setShowAddModal(false);
    setEditingItem(undefined);
    setShowTemplateModal(true);
  };

  const handleSelectCustomItem = () => {
    setShowTemplateModal(false);
    setShowAddModal(true);
    setEditingItem(undefined);
  };

  // Calculate default recommended quantity for manual entries
  const getDefaultRecommendedQuantity = (): number => {
    // Use a simple household-based calculation as default
    const peopleMultiplier = household.adults * 1.0 + household.children * 0.75;
    const daysMultiplier = household.supplyDurationDays / 3;
    return Math.ceil(peopleMultiplier * daysMultiplier);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{t('navigation.inventory')}</h1>
        <div className={styles.headerActions}>
          <Button variant="primary" onClick={() => setShowTemplateModal(true)}>
            {t('inventory.addFromTemplate')}
          </Button>
        </div>
      </header>

      <div className={styles.filters}>
        <CategoryNav
          categories={STANDARD_CATEGORIES}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />
      </div>

      <div className={styles.content}>
        <ItemList items={filteredItems} onItemClick={handleEditItem} />
      </div>

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={handleCancelForm}
          onBack={!editingItem?.id ? handleBackToTemplateSelector : undefined}
          title={
            editingItem?.id ? t('inventory.editItem') : t('inventory.addItem')
          }
        >
          <ItemForm
            item={editingItem}
            categories={STANDARD_CATEGORIES}
            onSubmit={editingItem?.id ? handleUpdateItem : handleAddItem}
            onCancel={handleCancelForm}
            defaultRecommendedQuantity={getDefaultRecommendedQuantity()}
          />
          {editingItem?.id && (
            <div className={styles.deleteSection}>
              <Button
                variant="danger"
                onClick={() => handleDeleteItem(editingItem.id)}
              >
                {t('common.delete')}
              </Button>
            </div>
          )}
        </Modal>
      )}

      {/* Template Selector Modal */}
      {showTemplateModal && (
        <Modal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          title={t('inventory.selectTemplate')}
        >
          <TemplateSelector
            templates={RECOMMENDED_ITEMS}
            categories={STANDARD_CATEGORIES}
            onSelectTemplate={handleSelectTemplate}
            onSelectCustom={handleSelectCustomItem}
            initialCategoryId={selectedCategoryId || ''}
          />
        </Modal>
      )}
    </div>
  );
}
