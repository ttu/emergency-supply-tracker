import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SideMenu, SideMenuItem } from './SideMenu';

const meta: Meta<typeof SideMenu> = {
  title: 'Shared/SideMenu',
  component: SideMenu,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const basicItems: SideMenuItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'profile', label: 'Profile' },
  { id: 'settings', label: 'Settings' },
  { id: 'help', label: 'Help' },
];

const itemsWithIcons: SideMenuItem[] = [
  { id: 'water-beverages', label: 'Water & Beverages', icon: '💧' },
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'cooking-heat', label: 'Cooking & Heat', icon: '🔥' },
  { id: 'light-power', label: 'Light & Power', icon: '💡' },
  { id: 'medical-health', label: 'Medical & Health', icon: '🏥' },
  { id: 'tools-supplies', label: 'Tools & Supplies', icon: '🔧' },
];

const settingsSections: SideMenuItem[] = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'household', label: 'Household Configuration' },
  { id: 'nutrition', label: 'Nutrition & Requirements' },
  { id: 'hidden-alerts', label: 'Hidden Alerts' },
  { id: 'data-management', label: 'Data Management' },
  { id: 'about', label: 'About' },
  { id: 'danger-zone', label: 'Danger Zone' },
];

// Interactive wrapper component
function SideMenuInteractive({
  items,
  showAllOption,
  ariaLabel = 'Navigation',
  initialSelected,
}: {
  items: SideMenuItem[];
  showAllOption?: { id: string; label: string; icon?: string };
  ariaLabel?: string;
  initialSelected?: string;
}) {
  const [selected, setSelected] = useState(
    initialSelected || (showAllOption ? showAllOption.id : items[0]?.id || ''),
  );

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <SideMenu
        items={items}
        selectedId={selected}
        onSelect={setSelected}
        ariaLabel={ariaLabel}
        showAllOption={showAllOption}
      />
      <div
        style={{ flex: 1, padding: '1rem', background: 'var(--color-surface)' }}
      >
        <h2>Selected: {selected}</h2>
        <p>Click items in the side menu to change selection.</p>
        <p>
          On mobile viewports, click the hamburger button to open the drawer.
        </p>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: () => <SideMenuInteractive items={basicItems} />,
};

export const WithIcons: Story = {
  render: () => (
    <SideMenuInteractive
      items={itemsWithIcons}
      ariaLabel="Category navigation"
    />
  ),
};

export const WithAllOption: Story = {
  render: () => (
    <SideMenuInteractive
      items={itemsWithIcons}
      showAllOption={{ id: 'all', label: 'All Categories', icon: '📦' }}
      ariaLabel="Category navigation"
    />
  ),
};

export const SettingsNavigation: Story = {
  render: () => (
    <SideMenuInteractive
      items={settingsSections}
      ariaLabel="Settings navigation"
    />
  ),
};

export const MobileDrawer: Story = {
  render: () => <SideMenuInteractive items={itemsWithIcons} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const LongLabels: Story = {
  render: () => (
    <SideMenuInteractive
      items={[
        { id: 'item1', label: 'A very long menu item label that might wrap' },
        { id: 'item2', label: 'Another extremely verbose label for testing' },
        { id: 'item3', label: 'Short' },
        { id: 'item4', label: 'Medium length label' },
      ]}
    />
  ),
};
