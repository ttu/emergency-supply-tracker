import { useState, type ReactNode } from 'react';
import {
  DesktopShell,
  MobileShell,
  type DesignNavId,
} from '@/shared/components/design-v2/Shell';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useDesignData } from '@/shared/hooks/useDesignData';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { Dashboard } from '@/features/dashboard/components/v2/Dashboard';
import { MobileDashboard } from '@/features/dashboard/components/v2/MobileDashboard';
import { Plan } from '@/features/dashboard/components/v2/Plan';
import { Inventory } from '@/features/inventory/components/v2/Inventory';
import { MobileInventory } from '@/features/inventory/components/v2/MobileInventory';
import {
  ItemDetail,
  NEW_ITEM_ID,
} from '@/features/inventory/components/v2/ItemDetail';
import { MobileItemDetail } from '@/features/inventory/components/v2/MobileItemDetail';
import { Shopping } from '@/features/inventory/components/v2/Shopping';
import { MobileShopping } from '@/features/inventory/components/v2/MobileShopping';
import { Alerts } from '@/features/alerts/components/v2/Alerts';
import { MobileAlerts } from '@/features/alerts/components/v2/MobileAlerts';
import { Guide } from '@/features/help/components/v2/Guide';
import { SettingsFull } from '@/features/settings/components/v2/SettingsFull';

interface ViewContext {
  voice: ReturnType<typeof useDesignTheme>['voice'];
  isMobile: boolean;
  selectedCategoryId: string | undefined;
  setSelectedCategoryId: (id: string | undefined) => void;
  setSelectedItemId: (id: string | undefined) => void;
  setNav: (id: DesignNavId) => void;
}

function renderItemDetail(
  selectedItemId: string,
  ctx: ViewContext,
): { title: string; breadcrumb: string; body: ReactNode } {
  const { voice, isMobile, selectedCategoryId, setSelectedItemId } = ctx;
  const breadcrumb =
    selectedItemId === NEW_ITEM_ID ? voice.addItem : selectedItemId.slice(0, 8);
  const defaultCategoryId =
    selectedItemId === NEW_ITEM_ID ? selectedCategoryId : undefined;
  const onBack = () => setSelectedItemId(undefined);
  const body = isMobile ? (
    <MobileItemDetail
      itemId={selectedItemId}
      onBack={onBack}
      defaultCategoryId={defaultCategoryId}
    />
  ) : (
    <ItemDetail
      itemId={selectedItemId}
      onBack={onBack}
      defaultCategoryId={defaultCategoryId}
    />
  );
  return { title: voice.inventory, breadcrumb, body };
}

function renderHome(ctx: ViewContext): ReactNode {
  const { isMobile, setSelectedCategoryId, setNav } = ctx;
  const onCategorySelect = (id: string) => {
    setSelectedCategoryId(id);
    setNav('inv');
  };
  return isMobile ? (
    <MobileDashboard onCategorySelect={onCategorySelect} />
  ) : (
    <Dashboard
      onCategorySelect={onCategorySelect}
      onViewAllPriority={() => setNav('inv')}
    />
  );
}

function renderInventory(ctx: ViewContext): ReactNode {
  const {
    isMobile,
    selectedCategoryId,
    setSelectedCategoryId,
    setSelectedItemId,
  } = ctx;
  const onAddItem = () => setSelectedItemId(NEW_ITEM_ID);
  return isMobile ? (
    <MobileInventory
      onItemSelect={setSelectedItemId}
      selectedCategoryId={selectedCategoryId}
      onCategoryChange={setSelectedCategoryId}
      onAddItem={onAddItem}
    />
  ) : (
    <Inventory
      selectedCategoryId={selectedCategoryId}
      onCategoryChange={setSelectedCategoryId}
      onItemSelect={setSelectedItemId}
      onAddItem={onAddItem}
    />
  );
}

function renderAlerts(ctx: ViewContext): ReactNode {
  const { isMobile, setSelectedItemId, setSelectedCategoryId, setNav } = ctx;
  const onCategorySelect = (id: string) => {
    setSelectedCategoryId(id);
    setNav('inv');
  };
  return isMobile ? (
    <MobileAlerts
      onItemSelect={setSelectedItemId}
      onCategorySelect={onCategorySelect}
    />
  ) : (
    <Alerts
      onItemSelect={setSelectedItemId}
      onCategorySelect={onCategorySelect}
    />
  );
}

function renderNav(
  nav: DesignNavId,
  ctx: ViewContext,
): { title: string; body: ReactNode } {
  const { voice, isMobile } = ctx;
  switch (nav) {
    case 'home':
      return { title: voice.home, body: renderHome(ctx) };
    case 'inv':
      return { title: voice.inventory, body: renderInventory(ctx) };
    case 'alerts':
      return { title: voice.alerts, body: renderAlerts(ctx) };
    case 'shop':
      return {
        title: voice.shopping,
        body: isMobile ? <MobileShopping /> : <Shopping />,
      };
    case 'plan':
      return { title: voice.plan, body: <Plan /> };
    case 'help':
      return { title: voice.guide, body: <Guide /> };
    case 'settings':
      return { title: voice.settings, body: <SettingsFull /> };
  }
}

export function DesignApp() {
  const { voice } = useDesignTheme();
  const isMobile = useIsMobile();
  const [nav, setNav] = useState<DesignNavId>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(undefined);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(
    undefined,
  );
  const data = useDesignData();
  const alertCount = data.totals.crit + data.totals.warn;

  const goTo = (id: DesignNavId) => {
    setNav(id);
    setSelectedItemId(undefined);
    if (id !== 'inv') setSelectedCategoryId(undefined);
  };

  const ctx: ViewContext = {
    voice,
    isMobile,
    selectedCategoryId,
    setSelectedCategoryId,
    setSelectedItemId,
    setNav,
  };

  const view: { title: string; body: ReactNode; breadcrumb?: string } =
    selectedItemId
      ? renderItemDetail(selectedItemId, ctx)
      : renderNav(nav, ctx);

  const Shell = isMobile ? MobileShell : DesktopShell;
  return (
    <Shell
      active={nav}
      onNav={goTo}
      title={view.title}
      breadcrumb={view.breadcrumb}
      alertCount={alertCount}
    >
      {view.body}
    </Shell>
  );
}
