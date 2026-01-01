import type { Meta, StoryObj } from '@storybook/react-vite';
import { Settings } from './Settings';
import { SettingsProvider } from '../contexts/SettingsProvider';
import { HouseholdProvider } from '../contexts/HouseholdProvider';
import { InventoryProvider } from '../contexts/InventoryProvider';
import { RecommendedItemsProvider } from '../contexts/RecommendedItemsProvider';

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
