import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useHousehold,
  calculateRecommendedQuantity,
  calculateHouseholdMultiplier,
} from '@/features/household';
import { useInventory } from '@/features/inventory';
import { useSettings } from '@/features/settings';
import { useRecommendedItems } from '@/features/templates';
import { STANDARD_CATEGORIES } from '@/features/categories';
import {
  CategoryNav,
  FilterBar,
  ItemList,
  ItemForm,
  CategoryStatusSummary,
  calculateItemStatus,
} from '@/features/inventory';
import { TemplateSelector } from '@/features/templates';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import type {
  InventoryItem,
  ItemStatus,
  RecommendedItemDefinition,
} from '@/shared/types';
import {
  getCategoryDisplayStatus,
  type CategoryCalculationOptions,
} from '@/features/dashboard';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
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
  const { t, i18n } = useTranslation(['common', 'products']);
  const {
    items,
    addItem,
    updateItem,
    deleteItem,
    disableRecommendedItem,
    disabledRecommendedItems,
  } = useInventory();
  const { household } = useHousehold();
  const { settings } = useSettings();
  const { recommendedItems, getItemName } = useRecommendedItems();

  // Build calculation options from user settings
  const calculationOptions: CategoryCalculationOptions = useMemo(
    () => ({
      childrenMultiplier:
        (settings.childrenRequirementPercentage ??
          CHILDREN_REQUIREMENT_MULTIPLIER * 100) / 100,
      dailyCaloriesPerPerson:
        settings.dailyCaloriesPerPerson ?? DAILY_CALORIES_PER_PERSON,
      dailyWaterPerPerson:
        settings.dailyWaterPerPerson ?? DAILY_WATER_PER_PERSON,
    }),
    [
      settings.childrenRequirementPercentage,
      settings.dailyCaloriesPerPerson,
      settings.dailyWaterPerPerson,
    ],
  );

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
  const [selectedTemplate, setSelectedTemplate] = useState<
    RecommendedItemDefinition | undefined
  >(undefined);

  // Calculate category status when a category is selected
  const categoryStatus = useMemo(() => {
    if (!selectedCategoryId) return null;
    return getCategoryDisplayStatus(
      selectedCategoryId,
      items,
      household,
      disabledRecommendedItems,
      recommendedItems,
      calculationOptions,
    );
  }, [
    selectedCategoryId,
    items,
    household,
    disabledRecommendedItems,
    recommendedItems,
    calculationOptions,
  ]);

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
      const status = calculateItemStatus(item);
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

  const handleMarkAsEnough = useCallback(
    (itemId: string) => {
      updateItem(itemId, { markedAsEnough: true });
    },
    [updateItem],
  );

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    // If item has a template, set it so weight/calorie calculations work
    if (item.productTemplateId) {
      const template = recommendedItems.find(
        (t) => t.id === item.productTemplateId,
      );
      setSelectedTemplate(template);
    } else {
      setSelectedTemplate(undefined);
    }
    setShowAddModal(true);
  };

  const handleCopyItem = () => {
    if (editingItem) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, ...itemData } = editingItem;
      setEditingItem(itemData as InventoryItem);
    }
  };

  const handleSelectTemplate = useCallback(
    (template: RecommendedItemDefinition) => {
      const recommendedQty = calculateRecommendedQuantity(template, household);
      // For custom items (i18nKey starts with 'custom.'), use getItemName; otherwise translate
      const templateName = template.i18nKey.startsWith('custom.')
        ? getItemName(template, i18n.language)
        : t(template.i18nKey.replace('products.', ''), { ns: 'products' });

      const newItem: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> = {
        name: templateName,
        itemType: template.id, // Store template ID for i18n lookup
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
        productTemplateId: template.id,
        weightGrams: template.weightGramsPerUnit,
        caloriesPerUnit: template.caloriesPerUnit,
      };

      setSelectedTemplate(template);
      setEditingItem(newItem as InventoryItem);
      setShowTemplateModal(false);
      setShowAddModal(true);
    },
    [household, t, getItemName, i18n.language],
  );

  const handleCancelForm = () => {
    setShowAddModal(false);
    setEditingItem(undefined);
    setSelectedTemplate(undefined);
  };

  const handleBackToTemplateSelector = () => {
    setShowAddModal(false);
    setEditingItem(undefined);
    setSelectedTemplate(undefined);
    setShowTemplateModal(true);
  };

  const handleSelectCustomItem = () => {
    setShowTemplateModal(false);
    setShowAddModal(true);
    setEditingItem(undefined);
    setSelectedTemplate(undefined);
  };

  // Calculate default recommended quantity for manual entries
  const getDefaultRecommendedQuantity = (): number => {
    return Math.ceil(calculateHouseholdMultiplier(household));
  };

  // Handler for adding a recommended item to inventory from status summary
  const handleAddRecommendedToInventory = useCallback(
    (itemId: string) => {
      const template = recommendedItems.find((rec) => rec.id === itemId);
      if (template) {
        handleSelectTemplate(template);
      }
    },
    [handleSelectTemplate, recommendedItems],
  );

  // Handler for disabling a recommended item
  const handleDisableRecommendedItem = useCallback(
    (itemId: string) => {
      disableRecommendedItem(itemId);
    },
    [disableRecommendedItem],
  );

  // Resolver for custom item names in CategoryStatusSummary
  const resolveItemName = useCallback(
    (itemId: string, i18nKey: string): string | null => {
      // Only resolve custom items (i18nKey starts with 'custom.')
      if (!i18nKey.startsWith('custom.')) {
        return null; // Let the component use translation
      }
      const item = recommendedItems.find((rec) => rec.id === itemId);
      if (item) {
        return getItemName(item, i18n.language);
      }
      return null;
    },
    [recommendedItems, getItemName, i18n.language],
  );

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
        {selectedCategoryId && categoryStatus && (
          <CategoryStatusSummary
            categoryId={selectedCategoryId}
            status={categoryStatus.status}
            completionPercentage={categoryStatus.completionPercentage}
            totalActual={categoryStatus.totalActual}
            totalNeeded={categoryStatus.totalNeeded}
            primaryUnit={categoryStatus.primaryUnit}
            shortages={categoryStatus.shortages}
            totalActualCalories={categoryStatus.totalActualCalories}
            totalNeededCalories={categoryStatus.totalNeededCalories}
            missingCalories={categoryStatus.missingCalories}
            drinkingWaterNeeded={categoryStatus.drinkingWaterNeeded}
            preparationWaterNeeded={categoryStatus.preparationWaterNeeded}
            onAddToInventory={handleAddRecommendedToInventory}
            onDisableRecommended={handleDisableRecommendedItem}
            onMarkAsEnough={handleMarkAsEnough}
            items={items}
            resolveItemName={resolveItemName}
          />
        )}
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
            templateWeightGramsPerUnit={selectedTemplate?.weightGramsPerUnit}
            templateCaloriesPer100g={selectedTemplate?.caloriesPer100g}
            templateRequiresWaterLiters={selectedTemplate?.requiresWaterLiters}
          />
          {editingItem?.id && (
            <div className={styles.deleteSection}>
              <Button variant="secondary" onClick={handleCopyItem}>
                {t('common.copy')}
              </Button>
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
            templates={recommendedItems}
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
