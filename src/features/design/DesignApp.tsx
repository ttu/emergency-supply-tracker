import { useEffect, useState } from 'react';
import { DesktopShell, MobileShell, type DesignNavId } from './Shell';
import { Dashboard } from './views/Dashboard';
import { Inventory } from './views/Inventory';
import { ItemDetail } from './views/ItemDetail';
import { Alerts } from './views/Alerts';
import { Shopping } from './views/Shopping';
import { Plan } from './views/Plan';
import { Guide } from './views/Guide';
import { Settings } from './views/Settings';
import { useDesignTheme } from './useDesignTheme';
import { useDesignData } from './useDesignData';

const MOBILE_BREAKPOINT = 768;

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
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

  let title = '';
  let breadcrumb: string | undefined;
  let body: React.ReactNode;

  if (selectedItemId) {
    title = voice.inventory;
    breadcrumb = selectedItemId.slice(0, 8);
    body = (
      <ItemDetail
        itemId={selectedItemId}
        onBack={() => setSelectedItemId(undefined)}
      />
    );
  } else {
    switch (nav) {
      case 'home':
        title = voice.home;
        body = (
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
        body = (
          <Inventory
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            onItemSelect={setSelectedItemId}
            onAddItem={() => {
              /* TODO: open add modal — defer */
            }}
          />
        );
        break;
      case 'alerts':
        title = voice.alerts;
        body = <Alerts onItemSelect={setSelectedItemId} />;
        break;
      case 'shop':
        title = voice.shopping;
        body = <Shopping />;
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
        body = <Settings />;
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
