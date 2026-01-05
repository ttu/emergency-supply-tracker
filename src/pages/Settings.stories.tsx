import type { Meta, StoryObj } from '@storybook/react-vite';
import { Settings } from './Settings';
import { HouseholdProvider } from '@/features/household';
import { SettingsProvider } from '@/features/settings';
import { InventoryProvider } from '@/features/inventory';
import { RecommendedItemsProvider } from '@/features/templates';

const meta = {
  title: 'Pages/Settings',
  component: Settings,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <SettingsProvider>
        <HouseholdProvider>
          <RecommendedItemsProvider>
            <InventoryProvider>
              <Story />
            </InventoryProvider>
          </RecommendedItemsProvider>
        </HouseholdProvider>
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof Settings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
