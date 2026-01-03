import type { Meta, StoryObj } from '@storybook/react-vite';
import { Settings } from './Settings';
import { HouseholdProvider } from '@/features/household';
import { SettingsProvider } from '@/shared/contexts/SettingsProvider';
import { InventoryProvider } from '@/shared/contexts/InventoryProvider';
import { RecommendedItemsProvider } from '@/shared/contexts/RecommendedItemsProvider';

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
