import { useState } from 'react';
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

  let title = '';
  let breadcrumb: string | undefined;
  let body: React.ReactNode;

  if (selectedItemId) {
    title = voice.inventory;
    breadcrumb =
      selectedItemId === NEW_ITEM_ID
        ? voice.addItem
        : selectedItemId.slice(0, 8);
    body = isMobile ? (
      <MobileItemDetail
        itemId={selectedItemId}
        onBack={() => setSelectedItemId(undefined)}
        defaultCategoryId={
          selectedItemId === NEW_ITEM_ID ? selectedCategoryId : undefined
        }
      />
    ) : (
      <ItemDetail
        itemId={selectedItemId}
        onBack={() => setSelectedItemId(undefined)}
        defaultCategoryId={
          selectedItemId === NEW_ITEM_ID ? selectedCategoryId : undefined
        }
      />
    );
  } else {
    switch (nav) {
      case 'home':
        title = voice.home;
        body = isMobile ? (
          <MobileDashboard
            onCategorySelect={(id) => {
              setSelectedCategoryId(id);
              setNav('inv');
            }}
          />
        ) : (
          <Dashboard
            onCategorySelect={(id) => {
              setSelectedCategoryId(id);
              setNav('inv');
            }}
            onViewAllPriority={() => setNav('inv')}
          />
        );
        break;
      case 'inv':
        title = voice.inventory;
        body = isMobile ? (
          <MobileInventory
            onItemSelect={setSelectedItemId}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            onAddItem={() => setSelectedItemId(NEW_ITEM_ID)}
          />
        ) : (
          <Inventory
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            onItemSelect={setSelectedItemId}
            onAddItem={() => setSelectedItemId(NEW_ITEM_ID)}
          />
        );
        break;
      case 'alerts':
        title = voice.alerts;
        body = isMobile ? (
          <MobileAlerts
            onItemSelect={setSelectedItemId}
            onCategorySelect={(id) => {
              setSelectedCategoryId(id);
              setNav('inv');
            }}
          />
        ) : (
          <Alerts
            onItemSelect={setSelectedItemId}
            onCategorySelect={(id) => {
              setSelectedCategoryId(id);
              setNav('inv');
            }}
          />
        );
        break;
      case 'shop':
        title = voice.shopping;
        body = isMobile ? <MobileShopping /> : <Shopping />;
        break;
      case 'plan':
        title = voice.plan;
        body = <Plan />;
        break;
      case 'help':
        title = voice.guide;
        body = <Guide />;
        break;
      case 'settings':
        title = voice.settings;
        body = <SettingsFull />;
        break;
    }
  }

  const Shell = isMobile ? MobileShell : DesktopShell;
  return (
    <Shell
      active={nav}
      onNav={goTo}
      title={title}
      breadcrumb={breadcrumb}
      alertCount={alertCount}
    >
      {body}
    </Shell>
  );
}
