import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../useIsMobile';
import { Button, Field, NumberDisplay, Panel, Title } from '../primitives';
import { ThemePicker } from '../ThemePicker';
import { ClassicThemeSwitcher } from '../ClassicThemeSwitcher';
import { useDesignTheme } from '../useDesignTheme';
import {
  Caption,
  PanelHeader,
  ReadField,
  SectionHeader,
  StepperRow,
  ToggleRow,
} from './SettingsRows';
import { NotificationsSection } from './NotificationsSection';
import { RecommendationsSection } from './RecommendationsSection';
import { useDesignPrefs } from './useDesignPref';
import { useInventory } from '@/features/inventory';
import {
  getLocalStorageUsageMB,
  LOCAL_STORAGE_LIMIT_BYTES,
} from '@/shared/utils/storage/storageUsage';
import { getAppData } from '@/shared/utils/storage/localStorage';
import {
  useSettings,
  ExportButton,
  ImportButton,
  ClearDataButton,
  KitManagement,
  OverriddenRecommendations,
  CustomTemplates,
  CategoriesSection,
  DisabledCategories,
  DebugExport,
  ShoppingListExport,
  InventorySetSection,
} from '@/features/settings';
import { useHousehold } from '@/features/household';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import { APP_VERSION } from '@/shared/utils/version';
import { CONTACT_EMAIL } from '@/shared/utils/constants';
import {
  createPercentage,
  type HouseholdConfig,
  type Theme,
} from '@/shared/types';

interface NavItem {
  id: string;
  code: string;
  label: string;
  danger?: boolean;
}

export function SettingsFull() {
  const { themeKey, voice } = useDesignTheme();
  const { settings, updateSettings } = useSettings();
  const { household, updateHousehold } = useHousehold();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<string>('appearance');

  // Highlight whichever section is currently in view (scroll spy).
  useEffect(() => {
    if (isMobile) return;
    const ids = [
      'appearance',
      'household',
      'inventorysets',
      'nutrition',
      'advanced',
      'notifications',
      'recommendations',
      'categories',
      'data',
      'about',
      'danger',
    ];
    const targets = ids
      .map((id) => document.getElementById(`sec-${id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    // Guard for environments without IntersectionObserver (jsdom in tests).
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (visible) {
          const id = visible.target.id.replace(/^sec-/, '');
          setActiveSection(id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isMobile]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`sec-${id}`);
    if (!el) return;
    // Find the closest scrollable ancestor and scroll IT, not the document.
    // scrollIntoView in nested overflow:auto containers is unreliable.
    let scroller: HTMLElement | null = el.parentElement;
    while (scroller && scroller !== document.body) {
      const o = getComputedStyle(scroller).overflowY;
      if (o === 'auto' || o === 'scroll') break;
      scroller = scroller.parentElement;
    }
    if (scroller && scroller !== document.body) {
      const elTop = el.getBoundingClientRect().top;
      const scTop = scroller.getBoundingClientRect().top;
      const offset = elTop - scTop + scroller.scrollTop - 16;
      scroller.scrollTo({ top: offset, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveSection(id);
  };

  const setTheme = (k: Theme) => updateSettings({ theme: k });
  const setNum = (k: keyof HouseholdConfig) => (v: number) =>
    updateHousehold({ [k]: Math.max(0, v) });

  const sections: NavItem[] = [
    {
      id: 'appearance',
      code: '01',
      label: themeKey === 'pantry' ? 'Appearance' : 'APPEARANCE',
    },
    {
      id: 'household',
      code: '02',
      label: themeKey === 'pantry' ? 'Household' : 'HOUSEHOLD',
    },
    {
      id: 'inventorysets',
      code: '03',
      label: themeKey === 'pantry' ? 'Inventory sets' : 'INVENTORY SETS',
    },
    {
      id: 'nutrition',
      code: '04',
      label: themeKey === 'pantry' ? 'Nutrition' : 'NUTRITION',
    },
    {
      id: 'advanced',
      code: '05',
      label: themeKey === 'pantry' ? 'Advanced' : 'ADVANCED',
    },
    {
      id: 'notifications',
      code: '06',
      label: themeKey === 'pantry' ? 'Notifications' : 'NOTIFICATIONS',
    },
    {
      id: 'recommendations',
      code: '07',
      label: themeKey === 'pantry' ? 'Recommendations' : 'RECOMMENDATIONS',
    },
    {
      id: 'categories',
      code: '08',
      label: themeKey === 'pantry' ? 'Categories' : 'CATEGORIES',
    },
    {
      id: 'data',
      code: '09',
      label: themeKey === 'pantry' ? 'Data & backup' : 'DATA & BACKUP',
    },
    {
      id: 'about',
      code: '10',
      label: themeKey === 'pantry' ? 'About' : 'ABOUT',
    },
    {
      id: 'danger',
      code: '11',
      label: themeKey === 'pantry' ? 'Danger zone' : 'DANGER ZONE',
      danger: true,
    },
  ];

  const adv = settings.advancedFeatures ?? {
    calorieTracking: false,
    powerManagement: false,
    waterTracking: false,
  };
  const setAdv = (k: keyof typeof adv) => (v: boolean) =>
    updateSettings({ advancedFeatures: { ...adv, [k]: v } });

  const cal = settings.dailyCaloriesPerPerson ?? DAILY_CALORIES_PER_PERSON;
  const water = settings.dailyWaterPerPerson ?? DAILY_WATER_PER_PERSON;
  const childPct =
    settings.childrenRequirementPercentage ??
    CHILDREN_REQUIREMENT_MULTIPLIER * 100;

  const [designPrefs, setDesignPref] = useDesignPrefs();
  const { items, deleteItems, enableAllRecommendedItems } = useInventory();

  // Computed live targets for §2 Household
  const computed = useMemo(() => {
    const ppl = household.adults + household.children * (childPct / 100);
    const days = household.supplyDurationDays;
    return {
      water: Math.ceil(water * ppl * days),
      kcal: Math.ceil(cal * ppl * days),
      itemCount: items.length,
    };
  }, [household, childPct, water, cal, items.length]);

  // Storage info for §9 Data & Backup
  const storageMB = getLocalStorageUsageMB();
  const limitMB = Math.round(LOCAL_STORAGE_LIMIT_BYTES / (1024 * 1024));
  const appData = getAppData();
  const lastBackup = appData?.lastBackupDate;
  const lastWrite = appData?.lastModified;

  const handleResetItems = () => {
    if (
      confirm(
        themeKey === 'pantry'
          ? 'Remove every item? Household and settings will be kept.'
          : 'PURGE ALL ITEMS? HOUSEHOLD + CONFIG RETAINED.',
      )
    ) {
      deleteItems(items.map((i) => i.id));
    }
  };
  const handleResetRecommendations = () => {
    if (
      confirm(
        themeKey === 'pantry'
          ? 'Restore default recommendations and re-enable all items?'
          : 'REVERT TO BUILT-IN BASELINE + CLEAR DISABLED LIST?',
      )
    ) {
      enableAllRecommendedItems();
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(180px, 220px) 1fr',
        gap: isMobile ? 16 : 28,
        padding: isMobile ? 16 : 0,
      }}
    >
      {/* Sub-nav rail — desktop only */}
      {!isMobile && (
        <aside style={{ position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
          <Caption style={{ marginBottom: 12 }}>
            {themeKey === 'pantry' ? 'Sections' : 'SECTIONS'}
          </Caption>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sections.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  aria-current={isActive ? 'true' : undefined}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: isActive ? 'var(--color-panel)' : 'transparent',
                    border: 0,
                    borderLeft: isActive
                      ? '3px solid var(--color-accent)'
                      : '3px solid transparent',
                    textAlign: 'left',
                    color: s.danger
                      ? 'var(--color-crit)'
                      : isActive
                        ? 'var(--color-text)'
                        : 'var(--color-text-2)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: isActive
                        ? 'var(--color-accent)'
                        : 'var(--color-text-3)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {s.code}
                  </span>
                  <span
                    style={{
                      letterSpacing: 'var(--caps-tracking)',
                      textTransform:
                        'var(--caps-transform)' as React.CSSProperties['textTransform'],
                    }}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </nav>
          <div
            style={{
              marginTop: 22,
              padding: '12px',
              background: 'var(--color-panel-2)',
              border: '1px solid var(--color-rule-soft)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              lineHeight: 1.6,
              color: 'var(--color-text-3)',
              letterSpacing: '0.06em',
            }}
          >
            AUTOSAVE · ON
            <br />
            <span style={{ color: 'var(--color-ok)' }}>● LOCAL</span>
          </div>
        </aside>
      )}

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
          maxWidth: 940,
          minWidth: 0,
        }}
      >
        <div>
          <Caption>{voice.settings}</Caption>
          <Title size={36} style={{ marginTop: 6 }}>
            {themeKey === 'pantry' ? 'Settings' : 'SYSTEM CONFIGURATION'}
          </Title>
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              fontSize: 14,
              color: 'var(--color-text-2)',
              maxWidth: 660,
              lineHeight: 1.55,
            }}
          >
            {themeKey === 'pantry'
              ? 'Everything that changes how the app behaves. Most of these have sensible defaults — change what matters to you.'
              : 'COMPLETE PARAMETER SET. ALL VALUES PERSIST LOCALLY. CHANGES TAKE EFFECT IMMEDIATELY UNLESS NOTED.'}
          </p>
        </div>

        {/* 01 APPEARANCE */}
        <section id="sec-appearance" style={{ scrollMarginTop: 16 }}>
          <SectionHeader
            code="§1"
            title={themeKey === 'pantry' ? 'Appearance' : 'APPEARANCE'}
          />
          <Panel padding={0}>
            <PanelHeader>
              {themeKey === 'pantry' ? 'Theme' : 'THEME · §1.1'}
            </PanelHeader>
            <div style={{ padding: 20 }}>
              <ThemePicker value={settings.theme} onChange={setTheme} />
            </div>
            <div
              style={{
                padding: 20,
                borderTop: '1px solid var(--color-rule-soft)',
              }}
            >
              <ClassicThemeSwitcher
                value={settings.theme}
                onChange={setTheme}
              />
            </div>
            <div style={{ borderTop: '1px solid var(--color-rule-soft)' }}>
              <PanelHeader>
                {themeKey === 'pantry' ? 'Language' : 'LANGUAGE · §1.2'}
              </PanelHeader>
              <div
                style={{
                  padding: 20,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                {[
                  { code: 'en', label: 'English' },
                  { code: 'fi', label: 'Suomi' },
                ].map((l) => {
                  const sel = settings.language === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() =>
                        updateSettings({ language: l.code as 'en' | 'fi' })
                      }
                      aria-pressed={sel}
                      style={{
                        padding: '12px 14px',
                        border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                        background: sel
                          ? 'var(--color-panel-2)'
                          : 'transparent',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 18px',
                        alignItems: 'center',
                        gap: 10,
                        fontFamily: 'inherit',
                        color: 'var(--color-text)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 700,
                          color: sel
                            ? 'var(--color-accent)'
                            : 'var(--color-text-3)',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {l.code.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          textAlign: 'left',
                        }}
                      >
                        {l.label}
                      </span>
                      <span
                        aria-hidden
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                          background: sel
                            ? 'var(--color-accent)'
                            : 'transparent',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--color-accent-ink)',
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      >
                        {sel ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <ToggleRow
              label={
                themeKey === 'pantry' ? 'High contrast' : 'HIGH CONTRAST MODE'
              }
              hint={
                themeKey === 'pantry'
                  ? 'Sharpens colours and borders for better readability.'
                  : 'INCREASES CONTRAST ABOVE WCAG AA · OVERRIDES ACTIVE THEME PALETTE'
              }
              on={!!settings.highContrast}
              onChange={(v) => updateSettings({ highContrast: v })}
            />
            <ToggleRow
              label={themeKey === 'pantry' ? 'Reduce motion' : 'REDUCE MOTION'}
              hint={
                themeKey === 'pantry'
                  ? 'Disables non-essential animations.'
                  : 'DISABLES TRANSITIONS · RESPECTS prefers-reduced-motion'
              }
              on={designPrefs.reduceMotion}
              onChange={(v) => setDesignPref('reduceMotion', v)}
              last
            />
          </Panel>
        </section>

        {/* 02 HOUSEHOLD — v2 styled steppers + computed/live side panel */}
        <section id="sec-household" style={{ scrollMarginTop: 16 }}>
          <SectionHeader
            code="§2"
            title={themeKey === 'pantry' ? 'Household' : 'HOUSEHOLD'}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr',
              gap: 14,
            }}
          >
            <Panel padding={0}>
              <PanelHeader>
                {themeKey === 'pantry' ? 'Profile' : 'PROFILE · §2.1'}
              </PanelHeader>
              <StepperRow
                label={themeKey === 'pantry' ? 'Adults' : 'ADULTS'}
                hint={
                  themeKey === 'pantry'
                    ? 'Aged 14 and over'
                    : 'AGE ≥ 14 · 1.0× SCALE'
                }
                value={household.adults}
                onChange={setNum('adults')}
                min={1}
              />
              <StepperRow
                label={themeKey === 'pantry' ? 'Children' : 'CHILDREN'}
                hint={
                  themeKey === 'pantry'
                    ? 'Under 14 — scaled to 75%'
                    : 'AGE < 14 · 0.75× SCALE'
                }
                value={household.children}
                onChange={setNum('children')}
              />
              <StepperRow
                label={themeKey === 'pantry' ? 'Pets' : 'PETS'}
                hint={
                  themeKey === 'pantry'
                    ? 'Enables the pets category'
                    : 'ENABLES §PET CATEGORY'
                }
                value={household.pets}
                onChange={setNum('pets')}
              />
              <StepperRow
                label={
                  themeKey === 'pantry'
                    ? 'Target days of supply'
                    : 'COVERAGE TARGET'
                }
                hint={
                  themeKey === 'pantry'
                    ? 'How many days you want to be self-sufficient'
                    : 'DAYS · SELF-SUFFICIENCY TARGET'
                }
                value={household.supplyDurationDays}
                onChange={setNum('supplyDurationDays')}
                suffix="d"
                min={1}
                max={365}
              />
              <ToggleRow
                label={themeKey === 'pantry' ? 'Use freezer' : 'USE FREEZER'}
                hint={
                  themeKey === 'pantry'
                    ? 'Adds frozen-food recommendations'
                    : 'INCLUDES FROZEN ITEMS IN BASELINE'
                }
                on={!!household.useFreezer}
                onChange={(v) => updateHousehold({ useFreezer: v })}
                last
              />
            </Panel>
            <Panel padding={20}>
              <Caption>
                {themeKey === 'pantry' ? 'Calculated' : 'COMPUTED · LIVE'}
              </Caption>
              <div style={{ marginTop: 14 }}>
                <div
                  style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}
                >
                  <NumberDisplay value={computed.water} size={40} />
                  <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
                    L ·{' '}
                    {themeKey === 'pantry'
                      ? `water for ${household.supplyDurationDays}d`
                      : `WATER · ${household.supplyDurationDays}D`}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-3)',
                    marginTop: 4,
                  }}
                >
                  = {water} L × {household.adults} ADULTS ×{' '}
                  {household.supplyDurationDays} D
                </div>
              </div>
              <div style={{ marginTop: 18 }}>
                <div
                  style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}
                >
                  <NumberDisplay
                    value={computed.kcal.toLocaleString()}
                    size={28}
                  />
                  <span style={{ fontSize: 12, color: 'var(--color-text-2)' }}>
                    kcal ·{' '}
                    {themeKey === 'pantry'
                      ? `total food`
                      : `TOTAL · ${household.supplyDurationDays}D`}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-3)',
                    marginTop: 4,
                  }}
                >
                  = {cal} × {household.adults} × {household.supplyDurationDays}{' '}
                  D
                </div>
              </div>
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: '1px solid var(--color-rule-soft)',
                }}
              >
                <Caption>
                  {themeKey === 'pantry' ? 'Items tracked' : 'INVENTORY ITEMS'}
                </Caption>
                <div
                  style={{
                    marginTop: 6,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                  }}
                >
                  <NumberDisplay value={computed.itemCount} size={28} />
                </div>
              </div>
            </Panel>
          </div>
        </section>

        {/* 03 INVENTORY SETS */}
        <section id="sec-inventorysets" style={{ scrollMarginTop: 16 }}>
          <SectionHeader
            code="§3"
            title={themeKey === 'pantry' ? 'Inventory sets' : 'INVENTORY SETS'}
            sub={
              themeKey === 'pantry'
                ? 'Multiple kits — home, car, cabin'
                : 'PARALLEL CONTEXTS · HOME · CAR · CABIN'
            }
          />
          <Panel padding={0}>
            <div className="design-v2-embed" style={{ padding: 20 }}>
              <InventorySetSection />
            </div>
          </Panel>
        </section>

        {/* 04 NUTRITION */}
        <section id="sec-nutrition" style={{ scrollMarginTop: 16 }}>
          <SectionHeader
            code="§4"
            title={
              themeKey === 'pantry'
                ? 'Nutrition & requirements'
                : 'NUTRITION & REQUIREMENTS'
            }
            sub={
              themeKey === 'pantry'
                ? 'Fine-tune per-person targets'
                : 'OVERRIDE DEFAULT PER-PERSON BASELINES'
            }
          />
          <Panel padding={0}>
            <StepperRow
              label={
                themeKey === 'pantry'
                  ? 'Calories per person per day'
                  : 'KCAL · PERSON · DAY'
              }
              hint={
                themeKey === 'pantry'
                  ? `Default: ${DAILY_CALORIES_PER_PERSON}`
                  : `DEFAULT ${DAILY_CALORIES_PER_PERSON} · 72TUNTIA.FI BASELINE`
              }
              value={cal}
              onChange={(v) =>
                updateSettings({ dailyCaloriesPerPerson: Math.max(0, v) })
              }
              step={50}
              min={0}
              max={10000}
              suffix="kcal"
            />
            <StepperRow
              label={
                themeKey === 'pantry'
                  ? 'Water per person per day'
                  : 'WATER · PERSON · DAY'
              }
              hint={
                themeKey === 'pantry'
                  ? 'Drinking and cooking combined'
                  : 'DRINKING + COOKING · L'
              }
              value={water}
              onChange={(v) =>
                updateSettings({ dailyWaterPerPerson: Math.max(0, v) })
              }
              step={0.5}
              decimals={1}
              min={0}
              max={20}
              suffix="L"
            />
            <StepperRow
              label={
                themeKey === 'pantry' ? 'Children scale' : 'CHILDREN MULTIPLIER'
              }
              hint={
                themeKey === 'pantry'
                  ? 'Children typically need less — default 75%'
                  : 'PERCENT OF ADULT BASELINE'
              }
              value={childPct}
              onChange={(v) =>
                updateSettings({
                  childrenRequirementPercentage: createPercentage(
                    Math.min(100, Math.max(0, v)),
                  ),
                })
              }
              step={5}
              min={0}
              max={100}
              suffix="%"
            />
            <ReadField
              label={
                themeKey === 'pantry'
                  ? 'Expiry warning window'
                  : 'EXPIRY WARN WINDOW'
              }
              value="30 days"
              hint={
                themeKey === 'pantry' ? 'fixed' : 'WARN ≤ N DAYS BEFORE EXPIRY'
              }
            />
            <ToggleRow
              label={
                themeKey === 'pantry'
                  ? 'Track hygiene water separately'
                  : 'TRACK HYGIENE WATER SEPARATELY'
              }
              hint={
                themeKey === 'pantry'
                  ? 'Add 3 L/person/day for hygiene'
                  : 'ADDS 3 L/PERSON/DAY · ADV WATER MODE'
              }
              on={designPrefs.trackHygieneWaterSeparately}
              onChange={(v) => setDesignPref('trackHygieneWaterSeparately', v)}
              last
            />
          </Panel>
        </section>

        {/* 05 ADVANCED FEATURES */}
        <section id="sec-advanced" style={{ scrollMarginTop: 16 }}>
          <SectionHeader
            code="§5"
            title={
              themeKey === 'pantry' ? 'Advanced features' : 'ADVANCED FEATURES'
            }
            sub={
              themeKey === 'pantry'
                ? 'Disabled by default — turn on what you need'
                : 'OPTIONAL CAPABILITIES · DISABLED BY DEFAULT'
            }
          />
          <Panel padding={0}>
            <ToggleRow
              label={
                themeKey === 'pantry' ? 'Calorie tracking' : 'CALORIE TRACKING'
              }
              hint={
                themeKey === 'pantry'
                  ? 'Track total calories across food items.'
                  : 'TOTAL KCAL ACROSS FOOD INVENTORY'
              }
              on={adv.calorieTracking}
              onChange={setAdv('calorieTracking')}
            />
            <ToggleRow
              label={
                themeKey === 'pantry' ? 'Power management' : 'POWER MANAGEMENT'
              }
              hint={
                themeKey === 'pantry'
                  ? 'Estimate days of power from batteries and power banks.'
                  : 'COMPUTE OFF-GRID RUNTIME'
              }
              on={adv.powerManagement}
              onChange={setAdv('powerManagement')}
            />
            <ToggleRow
              label={
                themeKey === 'pantry'
                  ? 'Water tracking (advanced)'
                  : 'WATER TRACKING · ADVANCED'
              }
              hint={
                themeKey === 'pantry'
                  ? 'Separate tracking for drinking, cooking, and hygiene water.'
                  : 'SPLIT INTO DRINK / COOK / HYGIENE BUCKETS'
              }
              on={adv.waterTracking}
              onChange={setAdv('waterTracking')}
            />
            <ToggleRow
              label={
                themeKey === 'pantry'
                  ? 'Plan view (preview)'
                  : 'PLAN VIEW · BETA'
              }
              hint={
                themeKey === 'pantry'
                  ? 'Track high-level preparedness goals, not just items.'
                  : 'OBJECTIVE-LEVEL TRACKING · v0.5'
              }
              on={designPrefs.planViewBeta}
              onChange={(v) => setDesignPref('planViewBeta', v)}
            />
            <ToggleRow
              label={
                themeKey === 'pantry'
                  ? 'Multi-device sync (coming soon)'
                  : 'MULTI-DEVICE SYNC · ROADMAP'
              }
              hint={
                themeKey === 'pantry'
                  ? 'Share inventory across devices via encrypted backup.'
                  : 'NOT YET AVAILABLE · E2E ENCRYPTED'
              }
              on={false}
              onChange={() => {
                /* roadmap — disabled */
              }}
              last
            />
          </Panel>
        </section>

        <NotificationsSection />

        {/* 07 RECOMMENDATIONS — v2-styled active source + disabled list */}
        <RecommendationsSection />

        {/* Custom kits + overrides + templates — v1 components in v2 wrappers */}
        <section style={{ scrollMarginTop: 16 }}>
          <SectionHeader
            code="§7.4"
            title={themeKey === 'pantry' ? 'Custom kits' : 'CUSTOM KITS'}
            sub={
              themeKey === 'pantry'
                ? 'Manage uploaded recommendation files'
                : 'UPLOADED RECOMMENDATION FILES'
            }
          />
          <Panel padding={0}>
            <div className="design-v2-embed" style={{ padding: 20 }}>
              <KitManagement />
            </div>
          </Panel>
          <Panel padding={0} style={{ marginTop: 14 }}>
            <PanelHeader>
              {themeKey === 'pantry' ? 'Custom overrides' : 'OVERRIDES'}
            </PanelHeader>
            <div className="design-v2-embed" style={{ padding: 20 }}>
              <OverriddenRecommendations />
            </div>
          </Panel>
          <Panel padding={0} style={{ marginTop: 14 }}>
            <PanelHeader>
              {themeKey === 'pantry'
                ? 'Custom item templates'
                : 'CUSTOM TEMPLATES'}
            </PanelHeader>
            <div className="design-v2-embed" style={{ padding: 20 }}>
              <CustomTemplates />
            </div>
          </Panel>
        </section>

        {/* 08 CATEGORIES */}
        <section id="sec-categories" style={{ scrollMarginTop: 16 }}>
          <SectionHeader
            code="§8"
            title={themeKey === 'pantry' ? 'Categories' : 'CATEGORIES'}
            sub={
              themeKey === 'pantry'
                ? 'Hide built-ins, add your own'
                : 'CUSTOM + DISABLED CATEGORIES'
            }
          />
          <Panel padding={0}>
            <PanelHeader>
              {themeKey === 'pantry' ? 'Custom categories' : 'CUSTOM · §8.1'}
            </PanelHeader>
            <div className="design-v2-embed" style={{ padding: 20 }}>
              <CategoriesSection />
            </div>
          </Panel>
          <Panel padding={0} style={{ marginTop: 14 }}>
            <PanelHeader>
              {themeKey === 'pantry'
                ? 'Disabled built-in categories'
                : 'DISABLED · §8.2'}
            </PanelHeader>
            <div className="design-v2-embed" style={{ padding: 20 }}>
              <DisabledCategories />
            </div>
          </Panel>
        </section>

        {/* 09 DATA & BACKUP */}
        <section id="sec-data" style={{ scrollMarginTop: 16 }}>
          <SectionHeader
            code="§9"
            title={themeKey === 'pantry' ? 'Data & backup' : 'DATA & BACKUP'}
            sub={
              themeKey === 'pantry'
                ? 'Everything is stored on this device'
                : 'LOCAL STORAGE · NO ACCOUNT REQUIRED'
            }
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
            }}
          >
            <Panel padding={0}>
              <PanelHeader>
                {themeKey === 'pantry' ? 'Storage' : 'STORAGE · §9.1'}
              </PanelHeader>
              <Field
                label={themeKey === 'pantry' ? 'Where' : 'LOCATION'}
                value={
                  themeKey === 'pantry'
                    ? 'This browser only'
                    : 'BROWSER LOCALSTORAGE'
                }
                hint={themeKey === 'pantry' ? 'No cloud' : 'OFFLINE-ONLY'}
              />
              <Field
                label={themeKey === 'pantry' ? 'Last save' : 'LAST WRITE'}
                value={
                  lastWrite ? lastWrite.slice(0, 16).replace('T', ' · ') : '—'
                }
              />
              <Field
                label={themeKey === 'pantry' ? 'Records' : 'RECORD COUNT'}
                value={`${items.length} ${themeKey === 'pantry' ? 'items' : 'ITEMS'}`}
              />
              <Field
                label={themeKey === 'pantry' ? 'Storage used' : 'DISK USAGE'}
                value={`${storageMB} MB / ~${limitMB} MB`}
                hint={`${Math.round((Number(storageMB) / limitMB) * 100)}%`}
              />
            </Panel>
            <Panel padding={0}>
              <PanelHeader>
                {themeKey === 'pantry' ? 'Backup & transfer' : 'BACKUP · §9.2'}
              </PanelHeader>
              <div style={{ padding: 20, display: 'grid', gap: 10 }}>
                <ExportButton />
                <ShoppingListExport />
                <ImportButton />
              </div>
              <div
                style={{
                  padding: '12px 22px',
                  background: 'var(--color-panel-2)',
                  borderTop: '1px solid var(--color-rule-soft)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-2)',
                  letterSpacing: '0.04em',
                }}
              >
                {lastBackup
                  ? themeKey === 'pantry'
                    ? `Last backup: ${lastBackup}`
                    : `LAST BACKUP ${lastBackup}`
                  : themeKey === 'pantry'
                    ? 'No backup yet — consider exporting soon.'
                    : 'NO BACKUP RECORDED · ▸ EXPORT RECOMMENDED'}
              </div>
            </Panel>
          </div>
          <Panel padding={0} style={{ marginTop: 14 }}>
            <PanelHeader>
              {themeKey === 'pantry' ? 'Diagnostics' : 'DIAGNOSTICS · §9.3'}
            </PanelHeader>
            <div className="design-v2-embed" style={{ padding: 20 }}>
              <DebugExport />
            </div>
          </Panel>
        </section>

        {/* 10 ABOUT */}
        <section id="sec-about" style={{ scrollMarginTop: 16 }}>
          <SectionHeader
            code="§10"
            title={themeKey === 'pantry' ? 'About' : 'ABOUT'}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: 14,
            }}
          >
            <Panel padding={22}>
              <Caption>
                {themeKey === 'pantry'
                  ? 'Emergency Supply Tracker'
                  : 'EMERGENCY SUPPLY TRACKER · EST'}
              </Caption>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--color-text-2)',
                  lineHeight: 1.65,
                  marginTop: 10,
                  marginBottom: 0,
                }}
              >
                {t('app.tagline')}
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  marginTop: 22,
                  paddingTop: 18,
                  borderTop: '1px solid var(--color-rule-soft)',
                }}
              >
                <div>
                  <Caption>
                    {themeKey === 'pantry' ? 'Version' : 'BUILD'}
                  </Caption>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    {APP_VERSION}
                  </div>
                </div>
                <div>
                  <Caption>
                    {themeKey === 'pantry' ? 'License' : 'LICENSE'}
                  </Caption>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    MIT
                  </div>
                </div>
                <div>
                  <Caption>
                    {themeKey === 'pantry' ? 'Source' : 'SOURCE'}
                  </Caption>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    72tuntia.fi
                  </div>
                </div>
              </div>
            </Panel>
            <Panel padding={0}>
              <PanelHeader>
                {themeKey === 'pantry' ? 'Links' : 'EXTERNAL'}
              </PanelHeader>
              {[
                {
                  href: 'https://github.com/ttu/emergency-supply-tracker',
                  label:
                    themeKey === 'pantry'
                      ? 'Source code (GitHub)'
                      : 'GITHUB · ttu/emergency-supply-tracker',
                },
                {
                  href: 'https://github.com/ttu/emergency-supply-tracker/issues',
                  label:
                    themeKey === 'pantry' ? 'Report an issue' : 'BUG TRACKER',
                },
                {
                  href: 'https://72tuntia.fi',
                  label:
                    themeKey === 'pantry'
                      ? '72tuntia.fi guidance'
                      : '72TUNTIA.FI · SOURCE',
                },
                {
                  href: `mailto:${CONTACT_EMAIL}`,
                  label: themeKey === 'pantry' ? 'Contact' : 'CONTACT',
                },
              ].map((l, i, arr) => (
                <a
                  key={l.href}
                  href={l.href}
                  target={l.href.startsWith('http') ? '_blank' : undefined}
                  rel={
                    l.href.startsWith('http')
                      ? 'noopener noreferrer'
                      : undefined
                  }
                  style={{
                    padding: '12px 22px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                    borderBottom:
                      i < arr.length - 1
                        ? '1px solid var(--color-rule-soft)'
                        : 'none',
                    fontSize: 13,
                  }}
                >
                  <span>{l.label}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--color-text-3)',
                    }}
                  >
                    ↗
                  </span>
                </a>
              ))}
            </Panel>
          </div>
        </section>

        {/* 11 DANGER ZONE */}
        <section id="sec-danger" style={{ scrollMarginTop: 16 }}>
          <SectionHeader
            code="§11"
            title={themeKey === 'pantry' ? 'Danger zone' : 'DANGER ZONE'}
          />
          <Panel padding={0} style={{ borderColor: 'var(--color-crit)' }}>
            <div
              style={{
                padding: '14px 22px',
                borderBottom: '1px solid var(--color-crit)',
              }}
            >
              <Caption style={{ color: 'var(--color-crit)' }}>
                {themeKey === 'pantry'
                  ? 'Irreversible actions'
                  : 'IRREVERSIBLE · CONFIRM EACH ACTION'}
              </Caption>
            </div>
            <DangerRow
              title={
                themeKey === 'pantry' ? 'Reset all items' : 'RESET INVENTORY'
              }
              detail={
                themeKey === 'pantry'
                  ? 'Removes every item but keeps household and settings.'
                  : 'PURGE ITEMS · RETAIN HOUSEHOLD + CONFIG'
              }
              action={themeKey === 'pantry' ? 'Reset items' : 'RESET'}
              onClick={handleResetItems}
            />
            <DangerRow
              title={
                themeKey === 'pantry'
                  ? 'Reset recommendations'
                  : 'RESET RECOMMENDATIONS'
              }
              detail={
                themeKey === 'pantry'
                  ? 'Re-enable every recommended item.'
                  : 'CLEAR DISABLED LIST · ENABLE ALL'
              }
              action={themeKey === 'pantry' ? 'Reset list' : 'RESET'}
              onClick={handleResetRecommendations}
            />
            <div
              style={{
                padding: '16px 22px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                  }}
                >
                  {themeKey === 'pantry' ? 'Clear all data' : 'FACTORY RESET'}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-2)',
                    marginTop: 4,
                  }}
                >
                  {themeKey === 'pantry'
                    ? 'Removes every item, setting, and history entry on this device.'
                    : 'PURGE ALL LOCAL STATE · CANNOT BE UNDONE'}
                </div>
              </div>
              <ClearDataButton />
            </div>
          </Panel>
        </section>

        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: 'var(--color-panel-2)',
            border: '1px solid var(--color-rule-soft)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-3)',
            letterSpacing: '0.06em',
            textAlign: 'center',
          }}
        >
          <Button
            variant="ghost"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ↑ {themeKey === 'pantry' ? 'Back to top' : 'BACK TO TOP'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DangerRow({
  title,
  detail,
  action,
  onClick,
}: {
  title: string;
  detail: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        padding: '16px 22px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: 16,
        borderBottom: '1px solid var(--color-rule-soft)',
      }}
    >
      <div>
        <div
          style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}
        >
          {title}
        </div>
        <div
          style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 4 }}
        >
          {detail}
        </div>
      </div>
      <Button variant="secondary" onClick={onClick}>
        {action}
      </Button>
    </div>
  );
}
