import type { Meta, StoryObj } from '@storybook/react-vite';
import App from './App';
import { SettingsProvider } from '@/shared/contexts/SettingsProvider';
import { HouseholdProvider } from '@/features/household';
import { InventoryProvider } from '@/shared/contexts/InventoryProvider';

const meta = {
  title: 'App/Shell',
  component: App,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SettingsProvider>
        <HouseholdProvider>
          <InventoryProvider>
            <Story />
          </InventoryProvider>
        </HouseholdProvider>
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
