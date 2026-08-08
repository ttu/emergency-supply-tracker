import { useCallback, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  DesktopShell,
  MobileShell,
  type DesignNavId,
} from '@/shared/components/design-v2/Shell';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import type { DesignV2Theme } from '@/shared/types';
import { Dashboard } from '@/features/dashboard/components/v2/Dashboard';
import { MobileDashboard } from '@/features/dashboard/components/v2/MobileDashboard';
import { Inventory } from '@/features/inventory/components/v2/Inventory';
import { MobileInventory } from '@/features/inventory/components/v2/MobileInventory';
import {
  ItemDetail,
  NEW_ITEM_ID,
} from '@/features/inventory/components/v2/ItemDetail';
import { MobileItemDetail } from '@/features/inventory/components/v2/MobileItemDetail';
import { Guide } from '@/features/help/components/v2/Guide';
import { SettingsFull } from '@/features/settings/components/v2/SettingsFull';
import { useInventoryFilters } from '@/features/inventory/hooks/useInventoryFilters';

interface ViewContext {
  t: TFunction;
  themeKey: DesignV2Theme;
  isMobile: boolean;
  selectedCategoryId: string | undefined;
  setSelectedCategoryId: (id: string | undefined) => void;
  setSelectedItemId: (id: string | undefined) => void;
  setNav: (id: DesignNavId) => void;
  selectedTemplateId: string | undefined;
  setSelectedTemplateId: (id: string | undefined) => void;
  copySourceId: string | undefined;
  setCopySourceId: (id: string | undefined) => void;
}

function renderItemDetail(
  selectedItemId: string,
  ctx: ViewContext,
): { title: string; breadcrumb: string; body: ReactNode } {
  const {
    t,
    themeKey,
    isMobile,
    selectedCategoryId,
    selectedTemplateId,
    copySourceId,
    setSelectedItemId,
    setSelectedTemplateId,
    setCopySourceId,
  } = ctx;
  const breadcrumb =
    selectedItemId === NEW_ITEM_ID
      ? t(`v2.voice.addItem.${themeKey}`)
      : selectedItemId.slice(0, 8);
  const defaultCategoryId =
    selectedItemId === NEW_ITEM_ID ? selectedCategoryId : undefined;
  const onBack = () => setSelectedItemId(undefined);
  const templateId =
    selectedItemId === NEW_ITEM_ID ? selectedTemplateId : undefined;
  const copyFrom = selectedItemId === NEW_ITEM_ID ? copySourceId : undefined;
  // Duplicating opens a fresh new-item view seeded from the source.
  const onCopy = (sourceId: string) => {
    setSelectedTemplateId(undefined);
    setCopySourceId(sourceId);
    setSelectedItemId(NEW_ITEM_ID);
  };
  const body = isMobile ? (
    <MobileItemDetail
      itemId={selectedItemId}
      onBack={onBack}
      defaultCategoryId={defaultCategoryId}
      templateId={templateId}
      copySourceId={copyFrom}
      onCopy={onCopy}
    />
  ) : (
    <ItemDetail
      itemId={selectedItemId}
      onBack={onBack}
      defaultCategoryId={defaultCategoryId}
      templateId={templateId}
      copySourceId={copyFrom}
      onCopy={onCopy}
    />
  );
  return { title: t(`v2.voice.inventory.${themeKey}`), breadcrumb, body };
}

/** Shared by the dashboard's and the inventory's "add" entry points — both
 *  land on the same blank (or template-prefilled) new-item flow. */
function makeOnAddItem(ctx: ViewContext) {
  const { setSelectedItemId, setSelectedTemplateId, setCopySourceId, setNav } =
    ctx;
  return (templateId?: string) => {
    setNav('inv');
    setSelectedTemplateId(templateId);
    setCopySourceId(undefined);
    setSelectedItemId(NEW_ITEM_ID);
  };
}

function renderHome(ctx: ViewContext): ReactNode {
  const { isMobile, setSelectedCategoryId, setSelectedItemId, setNav } = ctx;
  const onCategorySelect = (id: string) => {
    setSelectedCategoryId(id);
    setNav('inv');
  };
  // Alerts live on the dashboard, so resolving one has to land on the item
  // detail view under Inventory.
  const onItemSelect = (id: string) => {
    setNav('inv');
    setSelectedItemId(id);
  };
  const onAddItem = () => makeOnAddItem(ctx)();
  const onViewInventory = () => setNav('inv');
  return isMobile ? (
    <MobileDashboard
      onCategorySelect={onCategorySelect}
      onItemSelect={onItemSelect}
      onAddItem={onAddItem}
      onViewInventory={onViewInventory}
    />
  ) : (
    <Dashboard
      onCategorySelect={onCategorySelect}
      onItemSelect={onItemSelect}
      onViewAllPriority={() => setNav('inv')}
      onAddItem={onAddItem}
      onViewInventory={onViewInventory}
    />
  );
}

function renderInventory(ctx: ViewContext): ReactNode {
  const { isMobile, setSelectedItemId } = ctx;
  const onAddItem = makeOnAddItem(ctx);
  return isMobile ? (
    <MobileInventory onItemSelect={setSelectedItemId} onAddItem={onAddItem} />
  ) : (
    <Inventory onItemSelect={setSelectedItemId} onAddItem={onAddItem} />
  );
}

function renderNav(
  nav: DesignNavId,
  ctx: ViewContext,
): { title: string; body: ReactNode } {
  const { t, themeKey } = ctx;
  switch (nav) {
    case 'home':
      return { title: t(`v2.voice.home.${themeKey}`), body: renderHome(ctx) };
    case 'inv':
      return {
        title: t(`v2.voice.inventory.${themeKey}`),
        body: renderInventory(ctx),
      };
    case 'help':
      return { title: t(`v2.voice.guide.${themeKey}`), body: <Guide /> };
    case 'settings':
      return {
        title: t(`v2.voice.settings.${themeKey}`),
        body: <SettingsFull />,
      };
  }
}

interface DesignAppProps {
  /** Where to open. Carries the classic shell's page across a theme switch. */
  initialNav?: DesignNavId;
  /** Told whenever the destination changes, so the classic shell can follow. */
  onNavChange?: (nav: DesignNavId) => void;
}

export function DesignApp({
  initialNav = 'home',
  onNavChange,
}: Readonly<DesignAppProps> = {}) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const isMobile = useIsMobile();
  const [navState, setNavState] = useState<DesignNavId>(initialNav);
  const setNav = useCallback(
    (id: DesignNavId) => {
      setNavState(id);
      onNavChange?.(id);
    },
    [onNavChange],
  );
  const [{ categoryId: selectedCategoryId }, setFilters] =
    useInventoryFilters();
  const setSelectedCategoryId = useCallback(
    (categoryId: string | undefined) => setFilters({ categoryId }),
    [setFilters],
  );
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(
    undefined,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | undefined
  >(undefined);
  const [copySourceId, setCopySourceId] = useState<string | undefined>(
    undefined,
  );
  const goTo = useCallback(
    (id: DesignNavId) => {
      setNav(id);
      setSelectedItemId(undefined);
      setSelectedTemplateId(undefined);
      setCopySourceId(undefined);
      // The category filter is deliberately *not* cleared here — inventory
      // filters persist, so returning to the list finds it as it was left.
    },
    [setNav],
  );

  // renderNav / renderItemDetail are cheap pure helpers that return JSX
  // trees React then reconciles — there is no benefit to memoising `view`
  // (it never gates an expensive computation), and the previous memo's
  // identity invalidated on every selectedCategoryId change anyway.
  const ctx: ViewContext = {
    t,
    themeKey,
    isMobile,
    selectedCategoryId,
    setSelectedCategoryId,
    setSelectedItemId,
    setNav,
    selectedTemplateId,
    setSelectedTemplateId,
    copySourceId,
    setCopySourceId,
  };
  const view: { title: string; body: ReactNode; breadcrumb?: string } =
    selectedItemId
      ? renderItemDetail(selectedItemId, ctx)
      : renderNav(navState, ctx);

  const Shell = isMobile ? MobileShell : DesktopShell;
  return (
    <Shell
      active={navState}
      onNav={goTo}
      title={view.title}
      breadcrumb={view.breadcrumb}
    >
      {view.body}
    </Shell>
  );
}
